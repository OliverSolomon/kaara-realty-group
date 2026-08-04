import { NextResponse } from 'next/server';
import { MailtrapClient } from 'mailtrap';

let client: MailtrapClient | null = null;

const SUBJECTS: Record<string, string> = {
  buy: 'Buy enquiry',
  viewing: 'Viewing request',
  booking: 'Short stay availability request',
  tour: 'Virtual tour or consultation request',
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
    const payload = (await request.json()) as Record<string, string>;
    const { kind, name, email, phone } = payload;

    if (!SUBJECTS[kind]) {
      return NextResponse.json({ error: 'Unknown enquiry type' }, { status: 400 });
    }
    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Name and phone number are required' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    const apiKey = process.env.MAILTRAP_API_KEY;
    if (!apiKey) {
      console.error('MAILTRAP_API_KEY is not set, enquiry could not be delivered.');
      return NextResponse.json(
        { error: 'Our enquiry service is temporarily unavailable. Please WhatsApp or call us.' },
        { status: 503 }
      );
    }

    if (!client) {
      client = new MailtrapClient({ token: apiKey });
    }

    const rows = Object.entries(payload)
      .filter(([key, value]) => key !== 'kind' && String(value || '').trim())
      .map(
        ([key, value]) =>
          `<tr>
             <td style="padding:8px 16px 8px 0;color:#6b6b7a;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;vertical-align:top;">${escapeHtml(
               LABELS[key] || key
             )}</td>
             <td style="padding:8px 0;color:#100B28;font-size:15px;">${escapeHtml(String(value))}</td>
           </tr>`
      )
      .join('');

    const response = await client.send({
      from: { email: 'hello@demomailtrap.com', name: 'Kaara Realty Group Website' },
      to: [{ email: 'kiragu@kaararealtygroup.com' }],
      subject: `${SUBJECTS[kind]}: ${name}`,
      html: `
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
        </div>
      `,
    });

    return NextResponse.json({ success: true, data: response });
  } catch (err) {
    console.error('Enquiry API error:', err);
    return NextResponse.json(
      { error: 'We could not send that request. Please WhatsApp or call us instead.' },
      { status: 500 }
    );
  }
}
