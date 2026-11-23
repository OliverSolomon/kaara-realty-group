import "server-only";
import { promises as dns } from "node:dns";
import { isIP } from "node:net";
import { ImapFlow, type ListResponse } from "imapflow";
import { simpleParser, type ParsedMail } from "mailparser";
import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";
import { decryptSecret } from "@/lib/crypto";
import { getPool } from "@/lib/db";
import { accessTokenFromRefresh } from "@/lib/mail/oauth";

export type Credential = { pass: string } | { accessToken: string };

export interface MailAccount {
  id: string;
  label: string;
  email: string;
  username: string;
  /** The mailbox password, or for Google and Microsoft the refresh token. */
  password_enc: string;
  auth_type: "password" | "google" | "microsoft";
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
}

type ServerConfig = Pick<MailAccount, "imap_host" | "imap_port" | "imap_secure" | "smtp_host" | "smtp_port" | "smtp_secure" | "username">;
export type Special = "inbox" | "sent" | "drafts" | "trash" | "spam" | "archive" | "starred" | "other";
export interface MailboxInfo { path: string; name: string; special: Special; unread?: number }
export interface Address { name: string; address: string }
export interface ParsedMessage {
  uid: number;
  mailbox: string;
  messageId: string | null;
  inReplyTo: string | null;
  references: string[];
  subject: string;
  from: Address[];
  to: Address[];
  cc: Address[];
  date: string | null;
  html: string | null;
  text: string;
  attachments: { index: number; filename: string; size: number; contentType: string; inline: boolean }[];
}

const KNOWN: Record<string, { imap: [string, number, boolean]; smtp: [string, number, boolean] }> = {
  "kaararealtygroup.com": { imap: ["mail.kaararealtygroup.com", 993, true], smtp: ["mail.kaararealtygroup.com", 465, true] },
  "gmail.com": { imap: ["imap.gmail.com", 993, true], smtp: ["smtp.gmail.com", 465, true] },
  "outlook.com": { imap: ["outlook.office365.com", 993, true], smtp: ["smtp.office365.com", 587, false] },
  "hotmail.com": { imap: ["outlook.office365.com", 993, true], smtp: ["smtp.office365.com", 587, false] },
  "googlemail.com": { imap: ["imap.gmail.com", 993, true], smtp: ["smtp.gmail.com", 465, true] },
  "live.com": { imap: ["outlook.office365.com", 993, true], smtp: ["smtp.office365.com", 587, false] },
  "msn.com": { imap: ["outlook.office365.com", 993, true], smtp: ["smtp.office365.com", 587, false] },
  "icloud.com": { imap: ["imap.mail.me.com", 993, true], smtp: ["smtp.mail.me.com", 587, false] },
  "me.com": { imap: ["imap.mail.me.com", 993, true], smtp: ["smtp.mail.me.com", 587, false] },
  "yahoo.com": { imap: ["imap.mail.yahoo.com", 993, true], smtp: ["smtp.mail.yahoo.com", 465, true] },
  "zoho.com": { imap: ["imap.zoho.com", 993, true], smtp: ["smtp.zoho.com", 465, true] },
};

export const knownServers = (domain: string) => KNOWN[domain] ?? null;

export function detectServers(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return KNOWN[domain] ?? { imap: [`mail.${domain}`, 993, true] as [string, number, boolean], smtp: [`mail.${domain}`, 465, true] as [string, number, boolean] };
}

const PRIVATE_V4 = /^(0\.|10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/;

/** Mail hosts can be typed in, so they must never point the server at its own network. */
export async function assertPublicHost(host: string) {
  if (!/^[a-z0-9.-]{3,253}$/i.test(host) || isIP(host)) throw new Error("Enter a valid mail server name.");
  let addresses: { address: string; family: number }[];
  try {
    addresses = await dns.lookup(host, { all: true });
  } catch {
    throw new Error("We could not find that mail server. Check the server name.");
  }
  const blocked = addresses.some(({ address, family }) =>
    family === 4 ? PRIVATE_V4.test(address) : /^(::1?$|f[cd]|fe[89ab]|::ffff:)/i.test(address)
  );
  if (!addresses.length || blocked) throw new Error("That mail server address is not allowed.");
}

export async function loadAccount(id: string) {
  const pool = getPool();
  if (!pool || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("That mailbox is not connected.");
  const { rows } = await pool.query<MailAccount>("SELECT * FROM mail_accounts WHERE id = $1", [id]);
  if (!rows[0]) throw new Error("That mailbox is not connected.");
  return rows[0];
}

export function explain(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const failedAuth = (error as { authenticationFailed?: boolean })?.authenticationFailed;
  if (/certificate|altname|self.signed|CERT_/i.test(message)) return "The mail server's security certificate does not match its name.";
  if (failedAuth || /auth|credential|login|password|invalid/i.test(message)) return "The mailbox rejected the sign-in. Check the email and password.";
  if (/ENOTFOUND|EAI_AGAIN/i.test(message)) return "We could not find that mail server.";
  if (/ETIMEDOUT|timeout/i.test(message)) return "The mail server took too long to answer.";
  return "Could not reach the mailbox.";
}

/** The stored password, or a fresh access token for Google and Microsoft mailboxes. */
export async function credentialFor(account: MailAccount): Promise<Credential> {
  const secret = decryptSecret(account.password_enc);
  if (account.auth_type === "password") return { pass: secret };
  try {
    return { accessToken: await accessTokenFromRefresh(account.auth_type, secret) };
  } catch {
    const name = account.auth_type === "google" ? "Google" : "Microsoft";
    throw new Error(`The ${name} sign-in for ${account.email} has expired. Connect this mailbox again.`);
  }
}

const authOf = (user: string, credential: Credential) =>
  "pass" in credential ? { user, pass: credential.pass } : { user, accessToken: credential.accessToken };

function imapClient(config: ServerConfig, credential: Credential) {
  const client = new ImapFlow({
    host: config.imap_host,
    port: config.imap_port,
    secure: config.imap_secure,
    auth: authOf(config.username, credential),
    logger: false,
    socketTimeout: 25_000,
    greetingTimeout: 15_000,
    connectionTimeout: 15_000,
  });
  client.on("error", () => undefined);
  return client;
}

export function smtpTransport(config: ServerConfig, credential: Credential) {
  return nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_secure,
    requireTLS: !config.smtp_secure,
    auth: "pass" in credential
      ? { user: config.username, pass: credential.pass }
      : { type: "OAuth2", user: config.username, accessToken: credential.accessToken },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
  });
}

export async function testConnection(config: ServerConfig, credential: Credential) {
  const client = imapClient(config, credential);
  try {
    await client.connect();
  } catch (error) {
    throw new Error(explain(error));
  } finally {
    await client.logout().catch(() => client.close());
  }
  try {
    await smtpTransport(config, credential).verify();
  } catch (error) {
    throw new Error(`Reading mail works, but sending does not. ${explain(error)}`);
  }
}

export async function withImap<T>(account: MailAccount, work: (client: ImapFlow) => Promise<T>) {
  const credential = await credentialFor(account);
  let client = imapClient(account, credential);
  try {
    await client.connect();
  } catch (first) {
    // Mail servers often refuse a connection made right after the last one closed.
    if ((first as { authenticationFailed?: boolean })?.authenticationFailed) throw new Error(explain(first));
    console.error("IMAP connection failed, retrying:", first instanceof Error ? first.message : first);
    client.close();
    await new Promise((resolve) => setTimeout(resolve, 900));
    client = imapClient(account, credential);
    try {
      await client.connect();
    } catch (error) {
      console.error("IMAP connection failed:", error instanceof Error ? error.message : error);
      throw new Error(explain(error));
    }
  }
  try {
    return await work(client);
  } finally {
    await client.logout().catch(() => client.close());
  }
}

const USE: Record<string, Special> = { "\\Sent": "sent", "\\Drafts": "drafts", "\\Trash": "trash", "\\Junk": "spam", "\\Archive": "archive", "\\All": "archive", "\\Flagged": "starred" };
const ORDER: Special[] = ["inbox", "starred", "sent", "drafts", "archive", "spam", "trash", "other"];

export function classify(list: ListResponse[]): MailboxInfo[] {
  return list
    .filter((box) => !box.flags?.has("\\Noselect"))
    .map((box) => {
      let special: Special = box.path.toUpperCase() === "INBOX" ? "inbox" : "other";
      if (box.specialUse && USE[box.specialUse]) special = USE[box.specialUse];
      else if (special === "other") {
        const name = box.name.toLowerCase();
        if (/^sent/.test(name)) special = "sent";
        else if (/^draft/.test(name)) special = "drafts";
        else if (/^(trash|deleted)/.test(name)) special = "trash";
        else if (/^(spam|junk)/.test(name)) special = "spam";
        else if (/^archive/.test(name)) special = "archive";
      }
      return { path: box.path, name: box.name, special, unread: box.status?.unseen };
    })
    .sort((a, b) => ORDER.indexOf(a.special) - ORDER.indexOf(b.special) || a.name.localeCompare(b.name));
}

export const pathOf = (boxes: MailboxInfo[], special: Special) => boxes.find((box) => box.special === special)?.path;

const toAddresses = (value: ParsedMail["from"] | ParsedMail["to"] | undefined): Address[] => {
  const list = Array.isArray(value) ? value.flatMap((item) => item.value) : value ? value.value : [];
  return list.map((item) => ({ name: item.name || "", address: item.address || "" }));
};

/** Email HTML is untrusted. Scripts, forms and handlers are removed, and it renders in a scriptless frame. */
export function cleanHtml(html: string) {
  const upgrade = (url: string | undefined) => url?.replace(/^\s*http:\/\//i, "https://");
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "span", "font", "center", "style", "table", "thead", "tbody", "tr", "td", "th", "h1", "h2", "h3", "picture", "source"]),
    allowedAttributes: {
      "*": ["style", "align", "width", "height", "bgcolor", "color", "class", "background", "valign", "border", "cellpadding", "cellspacing", "dir"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "srcset", "alt", "width", "height", "style", "border", "align"],
      source: ["srcset", "media", "type"],
      td: ["colspan", "rowspan", "align", "valign"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    allowedSchemesAppliedToAttributes: ["href", "src", "background"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer nofollow" }),
      img: (_tag, attribs) => ({ tagName: "img", attribs: { ...attribs, ...(attribs.src ? { src: upgrade(attribs.src)! } : {}) } }),
    },
    allowProtocolRelative: true,
    allowVulnerableTags: true,
  });
}

/** What staff compose is cleaned too, so nothing unsafe is sent from a Kaara address. */
export function cleanOutgoing(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "div", "span", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "h1", "h2", "h3", "img", "hr", "table", "tbody", "tr", "td"],
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt", "width", "height"], "*": ["style"] },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedStyles: { "*": { color: [/^#[0-9a-f]{3,8}$/i, /^rgb/], "text-align": [/^(left|right|center|justify)$/], "font-weight": [/^\w+$/], "font-style": [/^\w+$/], "text-decoration": [/^[\w -]+$/], "margin-left": [/^\d+px$/], "padding-left": [/^\d+px$/], "border-left": [/^[\w #().,-]+$/] } },
  });
}

export async function parseSource(uid: number, mailbox: string, source: Buffer): Promise<ParsedMessage> {
  const message = await simpleParser(source);
  let html = typeof message.html === "string" ? message.html : null;
  if (html) {
    for (const attachment of message.attachments ?? []) {
      if (attachment.cid && attachment.content && /^image\/(png|jpe?g|gif|webp)$/i.test(attachment.contentType)) {
        html = html.split(`cid:${attachment.cid}`).join(`data:${attachment.contentType};base64,${attachment.content.toString("base64")}`);
      }
    }
    html = cleanHtml(html);
  }
  return {
    uid,
    mailbox,
    messageId: message.messageId ?? null,
    inReplyTo: message.inReplyTo ?? null,
    references: Array.isArray(message.references) ? message.references : message.references ? [message.references] : [],
    subject: message.subject ?? "(no subject)",
    from: toAddresses(message.from),
    to: toAddresses(message.to),
    cc: toAddresses(message.cc),
    date: message.date ? message.date.toISOString() : null,
    html,
    text: message.text ?? "",
    attachments: (message.attachments ?? []).map((item, index) => ({
      index,
      filename: item.filename ?? `attachment-${index + 1}`,
      size: item.size ?? 0,
      contentType: item.contentType,
      inline: Boolean(item.cid) && item.contentDisposition !== "attachment",
    })),
  };
}

export const normaliseSubject = (subject: string) => subject.replace(/^\s*((re|fwd?|aw|sv)\s*:\s*)+/i, "").trim().toLowerCase();
