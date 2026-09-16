import { defineLive } from 'next-sanity/live'
import { client } from './client'

/**
 * How content edited in the Studio reaches the live site.
 *
 * In production `defineLive` caches every query forever by default and relies
 * on <SanityLive /> to clear that cache. <SanityLive /> only hears about an
 * edit if a visitor happens to have the site open at the moment it is
 * published, so most edits were never picked up and the site kept serving
 * the old content until the next deploy.
 *
 * Three layers now keep the site current, from fastest to slowest:
 *  1. <SanityLive />: instant, whenever someone has the site open.
 *  2. /api/revalidate: instant, when a Sanity webhook is configured.
 *  3. REVALIDATE_SECONDS: a time-based safety net that needs no setup. After
 *     this many seconds the next visitor triggers a background refresh.
 */
const REVALIDATE_SECONDS = 60

export const { sanityFetch, SanityLive } = defineLive({
  client: client.withConfig({
    apiVersion: '2026-04-29'
  }),
  // For Draft Mode / Visual Editing
  serverToken: process.env.SANITY_API_READ_TOKEN,
  browserToken: process.env.SANITY_API_READ_TOKEN,
  fetchOptions: { revalidate: REVALIDATE_SECONDS },
})
