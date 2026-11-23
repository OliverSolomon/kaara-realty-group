/** Decides from the envelope whether a message needs a person, so the inbox holds only that. */
export type MailKind = "person" | "subscription" | "receipt" | "payment" | "update";

const PAYMENT = /\b(overdue|payment (is )?(due|failed|declined|pending|overdue|reminder|unsuccessful|required)|invoice (is )?(due|overdue|past due|reminder)|past due|final (notice|reminder)|(card|payment method) (was )?(declined|expired|failed)|amount due|balance due)\b/i;
const RECEIPT = /\b(receipt|your order|order (confirmation|confirmed|#|no\.?)|payment (received|successful|confirmation|confirmed|processed)|thank(s| you) for (your )?(purchase|payment|order)|tax invoice|paid invoice|e-?receipt|booking confirm|statement is ready|transaction (alert|notification|receipt)|mpesa|m-pesa confirmed)\b/i;
const SUBSCRIPTION = /\b(newsletter|weekly digest|daily digest|monthly digest|weekly roundup|this week in|unsubscribe|view in browser|\d{1,2}% off|sale ends|limited time|new arrivals|special offer|exclusive offer|promo(tion)?|free shipping|webinar|just launched|don't miss|we miss you|top stories|recommended for you)\b/i;
const UPDATE_FROM = /^(no-?reply|do-?not-?reply|notifications?|notify|alerts?|mailer-daemon|postmaster|bounce[sd]?|system|automated|updates?|security|donotreply)([._+-]|@)/i;
const UPDATE_SUBJECT = /\b(verification code|verify your (email|account)|one-time (password|code)|your code is|security alert|new sign-?in|new login|password (reset|changed)|reset your password|signed in from|mentioned you|invited you|assigned to you|deployment|your (daily|weekly) (summary|report)|delivery status|undeliverable|out of office|automatic reply|invitation:|accepted:|declined:)/i;
const BULK_FROM = /^(newsletter|news|digest|marketing|promo(tion)?s?|offers?|deals?|mailer|campaign|weekly|daily|press)@/i;
const RECEIPT_FROM = /^(receipts?|billing|invoices?|orders?|payments?|statements?)@/i;

// A website enquiry must always reach the inbox, whatever its wording.
const WEBSITE_ENQUIRY = /^(purchase enquiry|viewing request|short stay availability request|virtual tour or consultation request|payment plan request|new newsletter subscription)/i;

export function sortMessage(message: {
  from: { name: string; address: string };
  subject: string;
  bulk?: boolean;
  flagged?: boolean;
  answered?: boolean;
}): MailKind {
  if (message.flagged || message.answered || WEBSITE_ENQUIRY.test(message.subject)) return "person";
  const address = message.from.address.toLowerCase();
  if (PAYMENT.test(message.subject)) return "payment";
  if (RECEIPT.test(message.subject) || RECEIPT_FROM.test(address)) return "receipt";
  if (message.bulk || SUBSCRIPTION.test(message.subject) || BULK_FROM.test(address)) return "subscription";
  if (UPDATE_FROM.test(address) || UPDATE_SUBJECT.test(message.subject)) return "update";
  return "person";
}
