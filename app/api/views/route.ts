import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget/i

let writeClient: ReturnType<typeof createClient> | null = null

/**
 * Counts one view of a listing.
 *
 * The total lives in a "propertyViews" document (id "views.<listing id>") so
 * a page view never edits the listing itself or triggers the cache-refresh
 * webhook. The increment is atomic in the Content Lake, so simultaneous
 * visitors are never lost. The browser calls this once per listing per
 * session (see ViewTracker); crawlers are skipped.
 */
export async function POST(request: Request) {
  try {
    const token = process.env.SANITY_API_WRITE_TOKEN
    if (!token) {
      console.error('SANITY_API_WRITE_TOKEN is not set, listing views are not being recorded.')
      return NextResponse.json({ error: 'View tracking is not configured' }, { status: 503 })
    }

    const { slug } = (await request.json()) as { slug?: string }
    if (!slug || typeof slug !== 'string' || slug.length > 200) {
      return NextResponse.json({ error: 'A listing slug is required' }, { status: 400 })
    }

    writeClient ??= createClient({ projectId, dataset, apiVersion, token, useCdn: false })

    const listingId = await writeClient.fetch<string | null>(
      `*[_type == "property" && slug.current == $slug && !(_id in path("drafts.**"))][0]._id`,
      { slug }
    )
    if (!listingId) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const viewsId = `views.${listingId}`
    const userAgent = request.headers.get('user-agent') || ''

    if (!userAgent || BOT_PATTERN.test(userAgent)) {
      const current = await writeClient.fetch<number | null>(`*[_id == $id][0].count`, {
        id: viewsId,
      })
      return NextResponse.json({ count: current ?? 0, counted: false })
    }

    await writeClient
      .transaction()
      .createIfNotExists({
        _id: viewsId,
        _type: 'propertyViews',
        property: { _type: 'reference', _ref: listingId, _weak: true },
        count: 0,
      })
      .patch(viewsId, (patch) => patch.inc({ count: 1 }))
      .commit()

    const count = await writeClient.fetch<number | null>(`*[_id == $id][0].count`, { id: viewsId })
    return NextResponse.json({ count: count ?? null, counted: true })
  } catch (err) {
    console.error('Listing views API error:', err)
    return NextResponse.json({ error: 'Could not record the view' }, { status: 500 })
  }
}
