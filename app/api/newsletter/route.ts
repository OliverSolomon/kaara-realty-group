import { NextResponse } from 'next/server';
import { MailtrapClient } from 'mailtrap';

import { getEnquiryInbox } from '@/lib/enquiryInbox';
import { cleanAttribution, cleanPath, clip, recordLead, withinRateLimit } from '@/lib/leads';

// Initialize Mailtrap lazily to avoid build-time errors if API key is missing
let client: MailtrapClient | null = null;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (clip(body.website)) {
      return NextResponse.json({ success: true });
    }

    const email = clip(body.email, 200);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!(await withinRateLimit(request, 'newsletter', 8))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const subscriber = email.replace(/[<>"'&]/g, '');
    const lead = await recordLead({
      kind: 'newsletter',
      email: subscriber,
      path: cleanPath(body.path),
      marketingConsent: true,
      attribution: cleanAttribution(body.attribution),
    });

    let emailed = false;
    const apiKey = process.env.MAILTRAP_API_KEY;
    if (!apiKey) {
      console.error('MAILTRAP_API_KEY is not defined in environment variables.');
    } else {
      try {
        client ??= new MailtrapClient({ token: apiKey });
        // Sent to the inbox set in Studio → Settings → Contact Details.
        await client.send({
          from: { email: 'noreply@www.kaararealtygroup.com', name: 'Kaara Realty Collective' },
          to: await getEnquiryInbox(),
          reply_to: { email: subscriber },
          subject: 'New Newsletter Subscription: Kaara Realty Group',
          text: `New newsletter subscriber: ${subscriber}\n\nThis is an automated notification from the Kaara Realty website.`,
          html: `<!doctype html><html><body>
            <div style="font-family: serif; padding: 20px; color: #100B28; background-color: #f9f9f9;">
              <h2 style="text-transform: uppercase; border-bottom: 1px solid #100B28; padding-bottom: 10px;">New Subscription</h2>
              <p style="font-size: 16px;">You have a new subscriber to the Kaara Realty Collective.</p>
              <div style="background-color: #100B28; color: white; padding: 15px; margin-top: 20px;">
                <strong>Subscriber Email:</strong> ${subscriber}
              </div>
              <p style="font-size: 12px; margin-top: 30px; color: #666;">This is an automated notification from the Kaara Realty Platform.</p>
            </div></body></html>
          `,
        });
        emailed = true;
      } catch (error) {
        console.error('Newsletter email failed:', error);
      }
    }

    if (!lead && !emailed) {
      return NextResponse.json({ error: 'Could not save that signup' }, { status: 503 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Newsletter API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
