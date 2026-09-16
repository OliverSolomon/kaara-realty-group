import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

/**
 * Instant cache refresh for Studio edits.
 *
 * Point a Sanity webhook at https://<your-domain>/api/revalidate with the
 * same secret as SANITY_REVALIDATE_SECRET (sanity.io/manage → API →
 * Webhooks, trigger on create, update and delete, dataset "production").
 * Every publish then clears the whole site's cache, so the change shows on
 * the next page load. Without the webhook the site still refreshes on its own
 * within a minute (see sanity/lib/live.ts).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    return new Response('SANITY_REVALIDATE_SECRET is not set', { status: 500 })
  }

  try {
    const { isValidSignature, body } = await parseBody<{ _type?: string; _id?: string }>(
      req,
      secret,
      true // wait for the Content Lake to settle so the refetch sees the edit
    )

    if (!isValidSignature) {
      return new Response('Invalid signature', { status: 401 })
    }

    revalidatePath('/', 'layout')

    return NextResponse.json({
      revalidated: true,
      type: body?._type ?? null,
      id: body?._id ?? null,
      now: Date.now(),
    })
  } catch (err) {
    console.error('[revalidate] webhook failed:', err)
    return new Response('Webhook error', { status: 500 })
  }
}
