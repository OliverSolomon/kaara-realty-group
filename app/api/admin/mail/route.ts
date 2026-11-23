import { simpleParser } from "mailparser";
import MailComposer from "nodemailer/lib/mail-composer";
import { adminFromRequest, audit } from "@/lib/auth/admin";
import { encryptSecret } from "@/lib/crypto";
import { getPool } from "@/lib/db";
import { oauthConfigured } from "@/lib/mail/oauth";
import {
  assertPublicHost,
  classify,
  cleanOutgoing,
  credentialFor,
  detectServers,
  explain,
  loadAccount,
  normaliseSubject,
  parseSource,
  pathOf,
  smtpTransport,
  testConnection,
  withImap,
  type Address,
  type MailAccount,
} from "@/lib/mail/client";
import { sortMessage, type MailKind } from "@/lib/mail/sort";

export const maxDuration = 60;

interface MessageRow {
  uid: number;
  subject: string;
  from: Address;
  to: Address[];
  date: string | null;
  seen: boolean;
  flagged: boolean;
  answered: boolean;
  hasAttachment: boolean;
  kind: MailKind;
}

type Body = Record<string, unknown>;
const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
const ACCOUNT_COLUMNS = "id, label, email, auth_type";
const ok = (data: unknown = {}) => Response.json(data);
const bad = (error: string, status = 400) => Response.json({ error }, { status });
const text = (value: unknown, max = 300) => (typeof value === "string" ? value.slice(0, max) : "");
const uidList = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is number => Number.isInteger(item) && item > 0).slice(0, 200) : [];

function db() {
  const pool = getPool();
  if (!pool) throw new Error("The database is not configured.");
  return pool;
}

function hasAttachment(node: { disposition?: string; childNodes?: unknown[] } | undefined): boolean {
  if (!node) return false;
  if (node.disposition?.toLowerCase() === "attachment") return true;
  return (node.childNodes ?? []).some((child) => hasAttachment(child as { disposition?: string; childNodes?: unknown[] }));
}

async function listMessages(account: MailAccount, mailbox: string, query: string, offset: number, limit: number) {
  return withImap(account, async (client) => {
    const lock = await client.getMailboxLock(mailbox);
    try {
      const exists = typeof client.mailbox === "object" ? client.mailbox.exists : 0;
      let range: string | number[] = "";
      let useUid = false;
      let total = exists;
      if (query) {
        const found = await client.search({ or: [{ subject: query }, { from: query }, { to: query }, { body: query }] }, { uid: true });
        const uids = (found || []).sort((a, b) => b - a);
        total = uids.length;
        range = uids.slice(offset, offset + limit);
        useUid = true;
        if (!range.length) return { items: [], total };
      } else {
        const end = exists - offset;
        if (end < 1) return { items: [], total };
        range = `${Math.max(1, end - limit + 1)}:${end}`;
      }
      const items: MessageRow[] = [];
      for await (const message of client.fetch(range, { uid: true, flags: true, envelope: true, bodyStructure: true, headers: ["list-unsubscribe", "precedence"] }, { uid: useUid })) {
        const envelope = message.envelope;
        const sender = envelope?.from?.[0];
        const from = { name: sender?.name ?? "", address: sender?.address ?? "" };
        const subject = envelope?.subject || "(no subject)";
        const flags = message.flags ?? new Set<string>();
        const headers = message.headers?.toString("utf8").toLowerCase() ?? "";
        const flagged = flags.has("\\Flagged");
        const answered = flags.has("\\Answered");
        items.push({
          uid: message.uid,
          subject,
          from,
          to: (envelope?.to ?? []).map((item) => ({ name: item.name ?? "", address: item.address ?? "" })),
          date: envelope?.date ? new Date(envelope.date).toISOString() : null,
          seen: flags.has("\\Seen"),
          flagged,
          answered,
          hasAttachment: hasAttachment(message.bodyStructure),
          kind: sortMessage({ from, subject, flagged, answered, bulk: /list-unsubscribe|precedence:\s*(bulk|list)/.test(headers) }),
        });
      }
      items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.uid - a.uid);
      return { items, total };
    } finally {
      lock.release();
    }
  });
}

async function readThread(account: MailAccount, mailbox: string, uid: number) {
  return withImap(account, async (client) => {
    const boxes = classify(await client.list());
    const sources: { uid: number; mailbox: string; source: Buffer; seen: boolean; flagged: boolean }[] = [];
    let subject = "";
    let lock = await client.getMailboxLock(mailbox);
    try {
      const current = await client.fetchOne(String(uid), { uid: true, source: true, flags: true, envelope: true }, { uid: true });
      if (!current || !current.source) throw new Error("That message is no longer there.");
      subject = normaliseSubject(current.envelope?.subject ?? "");
      sources.push({ uid, mailbox, source: current.source, seen: true, flagged: current.flags?.has("\\Flagged") ?? false });
      await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
    } finally {
      lock.release();
    }
    if (subject) {
      for (const box of [...new Set([mailbox, pathOf(boxes, "inbox"), pathOf(boxes, "sent")].filter(Boolean) as string[])]) {
        lock = await client.getMailboxLock(box);
        try {
          const found = (await client.search({ subject }, { uid: true })) || [];
          const others = found.filter((item) => !(box === mailbox && item === uid)).sort((a, b) => b - a).slice(0, 8);
          if (!others.length) continue;
          for await (const message of client.fetch(others, { uid: true, source: true, envelope: true, flags: true }, { uid: true })) {
            if (message.source && normaliseSubject(message.envelope?.subject ?? "") === subject) {
              sources.push({ uid: message.uid, mailbox: box, source: message.source, seen: message.flags?.has("\\Seen") ?? true, flagged: message.flags?.has("\\Flagged") ?? false });
            }
          }
        } finally {
          lock.release();
        }
      }
    }
    const parsed = await Promise.all(sources.map(async (item) => ({ ...(await parseSource(item.uid, item.mailbox, item.source)), flagged: item.flagged })));
    const seen = new Set<string>();
    return parsed
      .filter((message) => {
        const key = message.messageId ?? `${message.mailbox}:${message.uid}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
      .slice(-10);
  });
}

async function actOn(account: MailAccount, mailbox: string, uids: number[], action: string) {
  const set = uids.join(",");
  await withImap(account, async (client) => {
    const boxes = classify(await client.list());
    const lock = await client.getMailboxLock(mailbox);
    try {
      switch (action) {
        case "read": await client.messageFlagsAdd(set, ["\\Seen"], { uid: true }); break;
        case "unread": await client.messageFlagsRemove(set, ["\\Seen"], { uid: true }); break;
        case "star": await client.messageFlagsAdd(set, ["\\Flagged"], { uid: true }); break;
        case "unstar": await client.messageFlagsRemove(set, ["\\Flagged"], { uid: true }); break;
        case "archive":
        case "trash":
        case "spam": {
          const target = pathOf(boxes, action as "archive" | "trash" | "spam");
          if (!target) throw new Error(`This mailbox has no ${action} folder.`);
          if (target !== mailbox) await client.messageMove(set, target, { uid: true });
          break;
        }
        case "inbox": await client.messageMove(set, "INBOX", { uid: true }); break;
        default: throw new Error("Unknown action.");
      }
    } finally {
      lock.release();
    }
  });
}

function personalise(html: string, address: string) {
  const local = address.split("@")[0].split(/[._-]+/)[0];
  if (!/^[a-z]{2,}$/i.test(local) || /^(info|admin|hello|contact|office|team|support|mail|noreply|sales|enquiries)$/i.test(local)) return html;
  const name = local[0].toUpperCase() + local.slice(1).toLowerCase();
  const replaced = html.replace(/\{\{\s*(first_?name|name)\s*\}\}/gi, name);
  return replaced.replace(/\b(Dear|Hello|Hi|Hey)(\s+)(all|everyone|team|friends|sir\/madam)\b/i, `$1$2${name}`);
}

async function send(account: MailAccount, body: Body, actor: string) {
  const list = (value: unknown) => (Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, 50) : []);
  const to = list(body.to);
  const cc = list(body.cc);
  const bcc = list(body.bcc);
  if (!to.length) throw new Error("Add at least one recipient.");
  const invalid = [...to, ...cc, ...bcc].find((item) => !EMAIL_RE.test(item));
  if (invalid) throw new Error(`"${invalid.slice(0, 80)}" is not a valid email address.`);
  const attachments = (Array.isArray(body.attachments) ? body.attachments : []).slice(0, 10).map((item: Record<string, unknown>) => ({
    filename: text(item.filename, 200) || "attachment",
    content: Buffer.from(text(item.contentBase64, 6_000_000), "base64"),
    contentType: text(item.contentType, 120) || "application/octet-stream",
  }));
  if (attachments.reduce((total, item) => total + item.content.length, 0) > 3 * 1024 * 1024) throw new Error("Attachments must total under 3 MB.");
  const html = cleanOutgoing(text(body.html, 500_000));
  const subject = text(body.subject, 300).replace(/[\r\n]+/g, " ").trim() || "(no subject)";
  const plain = html.replace(/<(br|\/p|\/div|\/h[1-6]|\/li)[^>]*>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
  const individually = body.individually === true && to.length > 1;
  const batches = individually
    ? to.map((address, index) => ({ to: [address], cc: index === 0 ? cc : [], bcc: index === 0 ? bcc : [], html: personalise(html, address) }))
    : [{ to, cc, bcc, html }];
  const transport = smtpTransport(account, await credentialFor(account));
  const inReplyTo = text(body.inReplyTo, 500) || undefined;
  const references = list(body.references).map((item) => item.slice(0, 500));

  for (const [index, batch] of batches.entries()) {
    const raw = await new MailComposer({
      from: { name: account.label, address: account.email },
      to: batch.to,
      cc: batch.cc.length ? batch.cc : undefined,
      bcc: batch.bcc.length ? batch.bcc : undefined,
      subject,
      html: batch.html,
      text: individually ? batch.html.replace(/<[^>]+>/g, "") : plain,
      inReplyTo,
      references: references.length ? references : undefined,
      attachments,
    }).compile().build();
    try {
      await transport.sendMail({ envelope: { from: account.email, to: [...batch.to, ...batch.cc, ...batch.bcc] }, raw });
    } catch (error) {
      throw new Error(`${batches.length > 1 ? `Sent to ${index} of ${batches.length} people, then it stopped. ` : "The message was not sent. "}${explain(error)}`);
    }
    if (!/gmail|googlemail|office365|outlook/i.test(account.smtp_host)) {
      await withImap(account, async (client) => {
        const sent = pathOf(classify(await client.list()), "sent");
        if (sent) await client.append(sent, raw, ["\\Seen"]);
      }).catch((error) => console.error("Could not file sent mail:", error));
    }
  }
  await audit(actor, "mail.sent", account.email, { recipients: to.length + cc.length + bcc.length, attachments: attachments.length });
}

export async function GET(request: Request) {
  const admin = await adminFromRequest(request);
  if (!admin) return bad("Unauthorized", 401);
  const params = new URL(request.url).searchParams;
  const uid = Number(params.get("uid"));
  const index = Number(params.get("index"));
  if (!Number.isInteger(uid) || uid < 1 || !Number.isInteger(index) || index < 0) return bad("Invalid attachment.");
  try {
    const account = await loadAccount(params.get("account") || "");
    const mailbox = params.get("mailbox") || "INBOX";
    const source = await withImap(account, async (client) => {
      const lock = await client.getMailboxLock(mailbox);
      try {
        return (await client.fetchOne(String(uid), { source: true }, { uid: true }) || undefined)?.source;
      } finally {
        lock.release();
      }
    });
    if (!source) return bad("That message is no longer there.", 404);
    const attachment = (await simpleParser(source)).attachments?.[index];
    if (!attachment) return bad("Attachment not found.", 404);
    const filename = (attachment.filename ?? `attachment-${index + 1}`).replace(/[^\w.-]+/g, "_");
    return new Response(new Uint8Array(attachment.content), {
      headers: {
        // Always a download, so an attached page can never run on this site.
        "content-type": "application/octet-stream",
        "content-disposition": `attachment; filename="${filename}"`,
        "x-content-type-options": "nosniff",
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return bad(error instanceof Error ? error.message : "Could not open the attachment.", 502);
  }
}

export async function POST(request: Request) {
  const admin = await adminFromRequest(request);
  if (!admin) return bad("Unauthorized", 401);
  try {
    const body = (await request.json()) as Body;
    const op = text(body.op, 40);
    switch (op) {
      case "bootstrap": {
        const [accounts, settings, snippets] = await Promise.all([
          db().query(`SELECT ${ACCOUNT_COLUMNS} FROM mail_accounts ORDER BY created_at`),
          db().query("SELECT signature_html, undo_seconds FROM mail_settings WHERE admin_email = $1", [admin.email]),
          db().query("SELECT id, name, body_html FROM mail_snippets ORDER BY name"),
        ]);
        return ok({
          me: admin.email,
          providers: { google: oauthConfigured("google"), microsoft: oauthConfigured("microsoft") },
          accounts: accounts.rows,
          settings: settings.rows[0] ?? { signature_html: "", undo_seconds: 10 },
          snippets: snippets.rows,
        });
      }
      case "addAccount": {
        const email = text(body.email, 200).trim().toLowerCase();
        const password = text(body.password, 500);
        if (!EMAIL_RE.test(email)) return bad("Enter a valid email address.");
        if (!password) return bad("Enter the mailbox password.");
        const detected = detectServers(email);
        const imapHost = text(body.imapHost, 253).trim().toLowerCase() || detected.imap[0];
        const smtpHost = text(body.smtpHost, 253).trim().toLowerCase() || detected.smtp[0];
        const imapPort = Number(body.imapPort) || detected.imap[1];
        const smtpPort = Number(body.smtpPort) || detected.smtp[1];
        if (![993, 143].includes(imapPort) || ![465, 587].includes(smtpPort)) return bad("Use standard mail ports.");
        await Promise.all([assertPublicHost(imapHost), assertPublicHost(smtpHost)]);
        const config = {
          imap_host: imapHost,
          imap_port: imapPort,
          imap_secure: imapPort === 993,
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_secure: smtpPort === 465,
          username: text(body.username, 200).trim() || email,
        };
        await testConnection(config, { pass: password });
        const { rows } = await db().query(
          `INSERT INTO mail_accounts (label, email, username, password_enc, imap_host, imap_port, imap_secure, smtp_host, smtp_port, smtp_secure, connected_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT (email) DO UPDATE SET label=EXCLUDED.label, username=EXCLUDED.username, password_enc=EXCLUDED.password_enc,
             auth_type='password',
             imap_host=EXCLUDED.imap_host, imap_port=EXCLUDED.imap_port, imap_secure=EXCLUDED.imap_secure,
             smtp_host=EXCLUDED.smtp_host, smtp_port=EXCLUDED.smtp_port, smtp_secure=EXCLUDED.smtp_secure, connected_by=EXCLUDED.connected_by
           RETURNING ${ACCOUNT_COLUMNS}`,
          [text(body.label, 60).trim() || "Kaara Realty Group", email, config.username, encryptSecret(password), config.imap_host, config.imap_port, config.imap_secure, config.smtp_host, config.smtp_port, config.smtp_secure, admin.email]
        );
        await audit(admin.email, "mail.account_connected", email);
        return ok({ account: rows[0] });
      }
      case "removeAccount": {
        const account = await loadAccount(text(body.accountId, 40));
        await db().query("DELETE FROM mail_accounts WHERE id = $1", [account.id]);
        await audit(admin.email, "mail.account_removed", account.email);
        return ok();
      }
      case "boxes": {
        const account = await loadAccount(text(body.accountId, 40));
        const boxes = await withImap(account, async (client) => classify(await client.list({ statusQuery: { unseen: true } })));
        return ok({ boxes });
      }
      case "list": {
        const account = await loadAccount(text(body.accountId, 40));
        const offset = Math.max(0, Number(body.offset) || 0);
        const limit = Math.min(60, Math.max(10, Number(body.limit) || 50));
        return ok(await listMessages(account, text(body.mailbox, 200) || "INBOX", text(body.query, 120).trim(), offset, limit));
      }
      case "thread": {
        const account = await loadAccount(text(body.accountId, 40));
        const uid = Number(body.uid);
        if (!Number.isInteger(uid) || uid < 1) return bad("Invalid message.");
        return ok({ messages: await readThread(account, text(body.mailbox, 200) || "INBOX", uid) });
      }
      case "act": {
        const account = await loadAccount(text(body.accountId, 40));
        const uids = uidList(body.uids);
        if (uids.length) await actOn(account, text(body.mailbox, 200) || "INBOX", uids, text(body.action, 20));
        return ok();
      }
      case "send": {
        await send(await loadAccount(text(body.accountId, 40)), body, admin.email);
        return ok();
      }
      case "saveSettings": {
        const undo = Number(body.undoSeconds);
        if (![0, 5, 10, 20, 30].includes(undo)) return bad("Choose a valid undo time.");
        const signature = cleanOutgoing(text(body.signatureHtml, 20_000));
        await db().query(
          `INSERT INTO mail_settings (admin_email, signature_html, undo_seconds) VALUES ($1,$2,$3)
           ON CONFLICT (admin_email) DO UPDATE SET signature_html=EXCLUDED.signature_html, undo_seconds=EXCLUDED.undo_seconds, updated_at=now()`,
          [admin.email, signature, undo]
        );
        return ok({ settings: { signature_html: signature, undo_seconds: undo } });
      }
      case "saveSnippet": {
        const name = text(body.name, 60).trim();
        const html = cleanOutgoing(text(body.html, 20_000));
        if (!name || !html) return bad("Give the snippet a name and text.");
        const { rows } = await db().query(
          "INSERT INTO mail_snippets (name, body_html, created_by) VALUES ($1,$2,$3) RETURNING id, name, body_html",
          [name, html, admin.email]
        );
        return ok({ snippet: rows[0] });
      }
      case "deleteSnippet": {
        const id = text(body.id, 40);
        if (!/^[0-9a-f-]{36}$/i.test(id)) return bad("Invalid snippet.");
        await db().query("DELETE FROM mail_snippets WHERE id = $1", [id]);
        return ok();
      }
      default:
        return bad("Unknown operation.");
    }
  } catch (error) {
    console.error("Mail API error:", error instanceof Error ? error.message : error);
    return bad(error instanceof Error ? error.message.slice(0, 200) : "The mail request failed.", 502);
  }
}
