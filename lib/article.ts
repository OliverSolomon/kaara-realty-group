/**
 * Helpers for long-form article rendering.
 *
 * Everything here works off the raw Portable Text array, which is why the
 * table of contents, reading time and Sources list stay correct automatically
 * — an editor writing in Studio never has to maintain them by hand.
 */

export interface PortableSpan {
  _type?: string
  _key?: string
  text?: string
  marks?: string[]
}

export interface PortableMarkDef {
  _key: string
  _type: string
  [key: string]: unknown
}

export interface PortableBlock {
  /** Required so the array satisfies @portabletext/react's TypedObject. */
  _type: string
  _key?: string
  style?: string
  listItem?: string
  children?: PortableSpan[]
  markDefs?: PortableMarkDef[]
  [key: string]: unknown
}

export interface Heading {
  id: string
  text: string
  level: 2 | 3
}

export interface Citation {
  number: number
  title: string
  publisher?: string
  url?: string
  year?: string
  note?: string
}

/**
 * Where an internal link annotation points, by referenced document type.
 * This is the one piece of this module that differs between the two sites,
 * so the shared components read it from here rather than hardcoding routes.
 */
export const INTERNAL_LINK_BASE: Record<string, string> = {
  post: '/market-insights',
  property: '/properties',
}

export const INTERNAL_LINK_FALLBACK = '/market-insights'

/** URL-safe id from heading text. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Plain text of a block, used for headings and word counts. */
export function blockText(block: PortableBlock): string {
  if (!Array.isArray(block.children)) return ''
  return block.children
    .map((child) => child.text ?? '')
    .join('')
    .trim()
}

/**
 * Heading ids must match between the table of contents and the rendered
 * headings, including when two sections share a title — hence the shared
 * de-duplication counter.
 */
function makeIdFactory() {
  const seen = new Map<string, number>()
  return (text: string) => {
    const base = slugify(text) || 'section'
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count + 1}`
  }
}

/** H2 and H3 only — deeper levels make the contents list unusable. */
export function extractHeadings(blocks?: PortableBlock[] | null): Heading[] {
  if (!Array.isArray(blocks)) return []
  const nextId = makeIdFactory()
  const headings: Heading[] = []

  for (const block of blocks) {
    if (block?._type !== 'block') continue
    if (block.style !== 'h2' && block.style !== 'h3') continue
    const text = blockText(block)
    if (!text) continue
    headings.push({ id: nextId(text), text, level: block.style === 'h2' ? 2 : 3 })
  }

  return headings
}

/**
 * Same factory, same order, so a heading rendered in the body receives the
 * identical id the contents list is linking to.
 */
export function buildHeadingIdMap(blocks?: PortableBlock[] | null): Map<string, string> {
  const map = new Map<string, string>()
  if (!Array.isArray(blocks)) return map
  const nextId = makeIdFactory()

  for (const block of blocks) {
    if (block?._type !== 'block') continue
    if (block.style !== 'h2' && block.style !== 'h3') continue
    const text = blockText(block)
    if (!text || !block._key) continue
    map.set(block._key, nextId(text))
  }

  return map
}

/**
 * Walks the document in reading order and numbers every inline citation.
 * Citing the same source twice reuses the first number, which is how footnotes
 * are expected to behave.
 *
 * Returns both the ordered list for the Sources section and a lookup from the
 * mark's key to its number, so the renderer can print the right superscript.
 */
export function collectCitations(blocks?: PortableBlock[] | null): {
  citations: Citation[]
  numberByKey: Map<string, number>
} {
  const citations: Citation[] = []
  const numberByKey = new Map<string, number>()
  const numberByIdentity = new Map<string, number>()

  if (!Array.isArray(blocks)) return { citations, numberByKey }

  for (const block of blocks) {
    if (block?._type !== 'block' || !Array.isArray(block.children)) continue
    const defs = Array.isArray(block.markDefs) ? block.markDefs : []
    if (defs.length === 0) continue

    for (const child of block.children) {
      for (const mark of child.marks ?? []) {
        const def = defs.find((d) => d._key === mark)
        if (!def || def._type !== 'citation') continue
        if (numberByKey.has(def._key)) continue

        const title = String(def.title ?? '').trim()
        const url = def.url ? String(def.url).trim() : undefined
        const identity = (url || title).toLowerCase()
        if (!identity) continue

        const existing = numberByIdentity.get(identity)
        if (existing) {
          numberByKey.set(def._key, existing)
          continue
        }

        const number = citations.length + 1
        numberByIdentity.set(identity, number)
        numberByKey.set(def._key, number)
        citations.push({
          number,
          title: title || url || 'Source',
          publisher: def.publisher ? String(def.publisher) : undefined,
          url,
          year: def.year ? String(def.year) : undefined,
          note: def.note ? String(def.note) : undefined,
        })
      }
    }
  }

  return { citations, numberByKey }
}

/**
 * Reading time at 220 words per minute — the usual figure for adult reading of
 * general non-fiction. Images and embeds add a few seconds each.
 */
export function estimateReadingMinutes(blocks?: PortableBlock[] | null, extraText = ''): number {
  if (!Array.isArray(blocks)) return 1
  let words = extraText ? extraText.trim().split(/\s+/).filter(Boolean).length : 0
  let mediaSeconds = 0

  for (const block of blocks) {
    if (block?._type === 'block') {
      const text = blockText(block)
      if (text) words += text.split(/\s+/).filter(Boolean).length
      continue
    }
    if (block?._type === 'articleImage' || block?._type === 'videoEmbed') mediaSeconds += 8
    if (block?._type === 'statBlock' || block?._type === 'propertyEmbed') mediaSeconds += 10
  }

  const minutes = words / 220 + mediaSeconds / 60
  return Math.max(1, Math.round(minutes))
}

/** Total words in the body — used for the `wordCount` structured-data field. */
export function countWords(blocks?: PortableBlock[] | null): number {
  if (!Array.isArray(blocks)) return 0
  let words = 0
  for (const block of blocks) {
    if (block?._type !== 'block') continue
    const text = blockText(block)
    if (text) words += text.split(/\s+/).filter(Boolean).length
  }
  return words
}

/** Turns a YouTube or Vimeo link into its embeddable form. */
export function toEmbedUrl(raw?: string): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`
    }
    if (host.endsWith('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) return url.toString()
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (host.endsWith('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop()
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    return null
  } catch {
    return null
  }
}

/**
 * Link hygiene. External links open in a new tab and get noopener for security;
 * paid links get rel="sponsored" as search engines require. Internal links get
 * none of this so they pass full ranking value.
 */
export function linkAttributes(opts: { isExternal: boolean; sponsored?: boolean }) {
  if (!opts.isExternal) return { target: undefined, rel: undefined }
  const rel = ['noopener', 'noreferrer']
  if (opts.sponsored) rel.push('sponsored')
  return { target: '_blank', rel: rel.join(' ') }
}
