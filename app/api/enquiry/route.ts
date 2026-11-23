import { NextResponse } from 'next/server';
import { MailtrapClient } from 'mailtrap';

import { getEnquiryInbox } from '@/lib/enquiryInbox';
import { cleanAttribution, cleanPath, cleanSlug, clip, recordLead, withinRateLimit } from '@/lib/leads';

let client: MailtrapClient | null = null;

const SUBJECTS: Record<string, string> = {
  // 'Buy' in a subject line costs spam points on the receiving server.
  buy: 'Purchase enquiry',
  viewing: 'Viewing request',
  booking: 'Short stay availability request',
  tour: 'Virtual tour or consultation request',
  payment_plan: 'Payment plan request',
};

const LABELS: Record<string, string> = {
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  callingTime: 'Preferred calling time',
  preferredDate: 'Preferred viewing date',
  checkIn: 'Check in',
  checkOut: 'Check out',
  guests: 'Guests',
  sessionType: 'Session type',
  listing: 'Listing',
  message: 'Message',
};

/** Keeps submitted values out of the email markup as raw HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const kind = String(body.kind ?? '');

    if (!SUBJECTS[kind]) {
      return NextResponse.json({ error: 'Unknown enquiry type' }, { status: 400 });
    }
    // Hidden from people, so only automated submissions fill it in.
    if (clip(body.website)) {
      return NextResponse.json({ success: true });
    }

    const payload: Record<string, string> = {};
    for (const key of Object.keys(LABELS)) {
      const value = clip(body[key], key === 'message' ? 2000 : 200);
      if (value) payload[key] = value;
    }
    const { name, email, phone } = payload;
    const emailOptional = kind === 'payment_plan';

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone number are required' }, { status: 400 });
    }
    if (phone.replace(/\D/g, '').length < 9) {
      return NextResponse.json({ error: 'Enter a phone number including the country code' }, { status: 400 });
    }
    if ((!email && !emailOptional) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }
    if (!(await withinRateLimit(request, 'enquiry', 8))) {
      return NextResponse.json(
        { error: 'Too many requests. Please WhatsApp or call us instead.' },
        { status: 429 }
      );
    }

    const { message, listing } = payload;
    const details = Object.fromEntries(
      Object.entries(payload).filter(
        ([key]) => !['name', 'phone', 'email', 'message', 'listing'].includes(key)
      )
    );
    const lead = await recordLead({
      kind,
      name,
      phone,
      email,
      message,
      listingTitle: listing,
      listingSlug: cleanSlug(body.listingSlug),
      path: cleanPath(body.path),
      marketingConsent: body.marketingConsent === true,
      attribution: cleanAttribution(body.attribution),
      details,
    });

    let emailed = false;
    const apiKey = process.env.MAILTRAP_API_KEY;
    if (!apiKey) {
      console.error('MAILTRAP_API_KEY is not set, enquiry could not be emailed.');
    } else {
      try {
        client ??= new MailtrapClient({ token: apiKey });
        const entries = Object.entries(payload);
        if (lead) entries.push(['Lead reference', lead.ref]);
        const rows = entries
          .map(
            ([key, value]) =>
              `<tr>
                 <td style="padding:8px 16px 8px 0;color:#6b6b7a;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;vertical-align:top;">${escapeHtml(
                   LABELS[key] || key
                 )}</td>
                 <td style="padding:8px 0;color:#100B28;font-size:15px;">${escapeHtml(value)}</td>
               </tr>`
          )
          .join('');

        await client.send({
          from: { email: 'noreply@www.kaararealtygroup.com', name: 'Kaara Realty Group Website' },
          // Set in Studio → Settings → Contact Details → "Enquiry Emails Go To".
          to: await getEnquiryInbox(),
          // Hitting Reply in the inbox answers the client directly.
          ...(email ? { reply_to: { email, name } } : {}),
          subject: `${SUBJECTS[kind]}: ${name}`,
          // A plain-text copy alongside the HTML keeps spam filters from
          // treating the message as HTML-only marketing mail.
          text: [
            `${SUBJECTS[kind]}: ${name}`,
            '',
            ...entries.map(([key, value]) => `${LABELS[key] || key}: ${value}`),
            '',
            'Sent from the Kaara Realty Group website.',
          ].join('\n'),
          html: `<!doctype html><html><body>
            <div style="font-family:Helvetica,Arial,sans-serif;background:#f6f6f8;padding:32px;">
              <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px;">
                <p style="margin:0 0 4px;color:#2e7d6f;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">${escapeHtml(
                  SUBJECTS[kind]
                )}</p>
                <h1 style="margin:0 0 24px;font-size:22px;color:#100B28;font-weight:400;">${escapeHtml(
                  name
                )}</h1>
                <table style="width:100%;border-collapse:collapse;border-top:1px solid #e7e7ec;">${rows}</table>
                <p style="margin:28px 0 0;font-size:12px;color:#8a8a99;">Sent from the Kaara Realty Group website.</p>
              </div>
            </div></body></html>
          `,
        });
        emailed = true;
      } catch (error) {
        console.error('Enquiry email failed:', error);
      }
    }

    // A saved lead or a delivered email means the enquiry is safe.
    if (!lead && !emailed) {
      return NextResponse.json(
        { error: 'We could not send that request. Please WhatsApp or call us instead.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: true, ref: lead?.ref });
  } catch (err) {
    console.error('Enquiry API error:', err);
    return NextResponse.json(
      { error: 'We could not send that request. Please WhatsApp or call us instead.' },
      { status: 500 }
    );
  }
}
