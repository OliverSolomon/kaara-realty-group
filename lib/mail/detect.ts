import "server-only";
import { promises as dns } from "node:dns";
import net from "node:net";
import tls from "node:tls";
import { assertPublicHost, knownServers, testConnection, type Credential } from "@/lib/mail/client";
import { oauthConfigured, type OAuthProvider } from "@/lib/mail/oauth";

type Server = [string, number, boolean];
interface Hosted { label: string; imap: Server; smtp: Server; oauth?: OAuthProvider; appPassword?: string }

const GMAIL: Hosted = { label: "Google", imap: ["imap.gmail.com", 993, true], smtp: ["smtp.gmail.com", 465, true], oauth: "google", appPassword: "Google needs an app password from Google Account, Security, 2-Step Verification." };
const MICROSOFT: Hosted = { label: "Microsoft", imap: ["outlook.office365.com", 993, true], smtp: ["smtp.office365.com", 587, false], oauth: "microsoft" };
const YAHOO: Hosted = { label: "Yahoo", imap: ["imap.mail.yahoo.com", 993, true], smtp: ["smtp.mail.yahoo.com", 465, true], appPassword: "Yahoo needs an app password from Account Security." };
const ICLOUD: Hosted = { label: "iCloud", imap: ["imap.mail.me.com", 993, true], smtp: ["smtp.mail.me.com", 587, false], appPassword: "iCloud needs an app-specific password from account.apple.com." };

const BY_DOMAIN: Record<string, Hosted> = {
  "gmail.com": GMAIL, "googlemail.com": GMAIL,
  "outlook.com": MICROSOFT, "hotmail.com": MICROSOFT, "live.com": MICROSOFT, "msn.com": MICROSOFT,
  "yahoo.com": YAHOO, "ymail.com": YAHOO,
  "icloud.com": ICLOUD, "me.com": ICLOUD, "mac.com": ICLOUD,
};

/** Business domains are recognised by who receives their mail. */
const BY_MX: [RegExp, Hosted][] = [
  [/(^|\.)(google|googlemail)\.com$/, GMAIL],
  [/\.(protection\.outlook|outlook)\.com$/, MICROSOFT],
  [/\.yahoodns\.net$/, YAHOO],
  [/(^|\.)(icloud|me)\.com$/, ICLOUD],
  [/(^|\.)zoho\.eu$/, { label: "Zoho", imap: ["imap.zoho.eu", 993, true], smtp: ["smtp.zoho.eu", 465, true] }],
  [/(^|\.)zoho\.(com|in)$/, { label: "Zoho", imap: ["imap.zoho.com", 993, true], smtp: ["smtp.zoho.com", 465, true] }],
  [/(^|\.)secureserver\.net$/, { label: "GoDaddy", imap: ["imap.secureserver.net", 993, true], smtp: ["smtpout.secureserver.net", 465, true] }],
  [/(^|\.)titan\.email$/, { label: "Titan", imap: ["imap.titan.email", 993, true], smtp: ["smtp.titan.email", 465, true] }],
  [/(^|\.)hostinger\.com$/, { label: "Hostinger", imap: ["imap.hostinger.com", 993, true], smtp: ["smtp.hostinger.com", 465, true] }],
  [/(^|\.)privateemail\.com$/, { label: "Namecheap", imap: ["mail.privateemail.com", 993, true], smtp: ["mail.privateemail.com", 465, true] }],
  [/(^|\.)messagingengine\.com$/, { label: "Fastmail", imap: ["imap.fastmail.com", 993, true], smtp: ["smtp.fastmail.com", 465, true] }],
];

const withTimeout = <T,>(work: Promise<T>, fallback: T, ms = 3000) =>
  Promise.race([work.catch(() => fallback), new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

async function mxHosts(domain: string) {
  const records = await withTimeout(dns.resolveMx(domain), []);
  return records.sort((a, b) => a.priority - b.priority).map((item) => item.exchange.toLowerCase().replace(/\.$/, ""));
}

async function srvHost(name: string) {
  const records = await withTimeout(dns.resolveSrv(name), []);
  const best = records.sort((a, b) => a.priority - b.priority)[0];
  return best && best.name !== "." ? best.name.toLowerCase().replace(/\.$/, "") : null;
}

function hostedFor(domain: string, mx: string[]) {
  return BY_DOMAIN[domain] ?? mx.map((host) => BY_MX.find(([pattern]) => pattern.test(host))?.[1]).find(Boolean) ?? null;
}

/** What the sign-in form needs to know. Reveals nothing about any stored account. */
export async function describeMail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const hosted = hostedFor(domain, await mxHosts(domain));
  const oauth = hosted?.oauth && oauthConfigured(hosted.oauth) ? hosted.oauth : null;
  return { provider: hosted?.label ?? null, oauth, help: oauth ? null : hosted?.appPassword ?? null };
}

const tlsOpen = (host: string, port: number) =>
  new Promise<boolean>((resolve) => {
    const socket = tls.connect({ host, port, servername: host, timeout: 5000 }, () => { socket.destroy(); resolve(socket.authorized); });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
  });

const tcpOpen = (host: string, port: number) =>
  new Promise<boolean>((resolve) => {
    const socket = net.connect({ host, port, timeout: 5000 }, () => { socket.destroy(); resolve(true); });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
  });

async function firstSafe(hosts: string[]) {
  const unique = [...new Set(hosts.filter(Boolean))].slice(0, 5);
  const safe = await Promise.all(unique.map((host) => assertPublicHost(host).then(() => true, () => false)));
  return unique.filter((_, index) => safe[index]);
}

/** Finds a server with a valid certificate before any password is sent to it. */
async function findCustomServers(domain: string, mx: string[]): Promise<{ imap: Server; smtp: Server } | null> {
  const [imapSrv, smtpSrv] = await Promise.all([srvHost(`_imaps._tcp.${domain}`), srvHost(`_submission._tcp.${domain}`)]);
  const imapHosts = await firstSafe([imapSrv ?? "", `mail.${domain}`, `imap.${domain}`, ...mx]);
  const imapOpen = await Promise.all(imapHosts.map((host) => tlsOpen(host, 993)));
  const imapHost = imapHosts[imapOpen.indexOf(true)];
  if (!imapHost) return null;
  const smtpHosts = await firstSafe([smtpSrv ?? "", imapHost, `smtp.${domain}`, `mail.${domain}`, ...mx]);
  const smtpTls = await Promise.all(smtpHosts.map((host) => tlsOpen(host, 465)));
  const secureHost = smtpHosts[smtpTls.indexOf(true)];
  if (secureHost) return { imap: [imapHost, 993, true], smtp: [secureHost, 465, true] };
  const smtpPlain = await Promise.all(smtpHosts.map((host) => tcpOpen(host, 587)));
  const startTlsHost = smtpHosts[smtpPlain.indexOf(true)];
  return startTlsHost ? { imap: [imapHost, 993, true], smtp: [startTlsHost, 587, false] } : null;
}

/** Works out the servers from the address alone, then proves the login once. */
export async function connectDetected(email: string, credential: Credential) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const mx = await mxHosts(domain);
  const hosted = hostedFor(domain, mx);
  if (hosted?.oauth === "microsoft") {
    throw new Error(oauthConfigured("microsoft") ? "Use Continue with Microsoft for this mailbox." : "Microsoft mailboxes need Microsoft sign-in, which is not switched on yet.");
  }
  const servers = hosted ?? knownServers(domain) ?? (await findCustomServers(domain, mx));
  if (!servers) throw new Error("We could not find a mail server for that address. Open server settings to enter it.");
  await Promise.all([assertPublicHost(servers.imap[0]), assertPublicHost(servers.smtp[0])]);
  const config = {
    imap_host: servers.imap[0],
    imap_port: servers.imap[1],
    imap_secure: servers.imap[2],
    smtp_host: servers.smtp[0],
    smtp_port: servers.smtp[1],
    smtp_secure: servers.smtp[2],
    username: email,
  };
  try {
    await testConnection(config, credential);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not connect.";
    throw new Error(hosted?.appPassword && /rejected/.test(message) ? `${message} ${hosted.appPassword}` : message);
  }
  return config;
}
