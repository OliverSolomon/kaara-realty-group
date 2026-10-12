import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '@/sanity/env'

/**
 * Where website enquiries and newsletter sign-ups are emailed.
 *
 * Editors set this in Studio → Settings → Contact Details → "Enquiry Emails
 * Go To". If that list is empty or unreadable, ENQUIRY_INBOX (comma separated)
 * is used, and failing that info@kaararealtygroup.com, so an enquiry is never
 * dropped because of a settings problem.
 */
export const DEFAULT_ENQUIRY_INBOX = 'info@kaararealtygroup.com'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CACHE_MS = 60_000

const sanity = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
  token: process.env.SANITY_API_READ_TOKEN,
})

let cached: { at: number; inbox: string[] } | null = null

function clean(list: unknown): string[] {
  if (!Array.isArray(list)) return []
  const seen = new Set<string>()
  for (const item of list) {
    const email = String(item ?? '').trim().toLowerCase()
    if (EMAIL_RE.test(email)) seen.add(email)
  }
  return [...seen]
}

function fallback(): string[] {
  const fromEnv = clean((process.env.ENQUIRY_INBOX || '').split(','))
  return fromEnv.length ? fromEnv : [DEFAULT_ENQUIRY_INBOX]
}

/** Recipient addresses, read from Studio and cached for a minute. */
export async function getEnquiryInbox(): Promise<{ email: string }[]> {
  if (!cached || Date.now() - cached.at > CACHE_MS) {
    let inbox: string[] = []
    try {
      inbox = clean(
        await sanity.fetch(`*[_id == "contactSettings"][0].enquiryRecipients`)
      )
    } catch (err) {
      console.error('Could not read the enquiry inbox from Sanity, using the default.', err)
    }
    cached = { at: Date.now(), inbox: inbox.length ? inbox : fallback() }
  }
  return cached.inbox.map((email) => ({ email }))
}
