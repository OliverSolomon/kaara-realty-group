import { defineArrayMember, defineField, defineType } from 'sanity'
import {
  LinkIcon,
  ImageIcon,
  BlockquoteIcon,
  InfoOutlineIcon,
  PlayIcon,
  BookIcon,
  TrendUpwardIcon,
  RemoveIcon,
  HomeIcon,
} from '@sanity/icons'

/**
 * Rich article body.
 *
 * This is Sanity's Portable Text editor with the full writing toolkit switched
 * on — headings, quotes, links, images with captions, callouts, pull quotes,
 * stat panels, video embeds and inline citations.
 *
 * Everything an editor inserts here is structured data, which is what lets the
 * website automatically build the table of contents, the reading-time estimate
 * and the numbered Sources list at the foot of each article.
 */

/* ─────────────────────────── Inline citation ───────────────────────────
 * Applied like bold or italic: select the sentence, click "Cite".
 * The website numbers every citation in reading order, renders a small
 * superscript marker, and assembles the Sources section automatically.
 * There is no separate list to keep in sync.
 */
const citationAnnotation = defineArrayMember({
  name: 'citation',
  title: 'Citation / Source',
  type: 'object',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Source title',
      description: 'e.g. "Kenya Economic Survey 2026" or "Knight Frank Wealth Report".',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publisher',
      title: 'Publisher / Author',
      description: 'e.g. "Kenya National Bureau of Statistics".',
      type: 'string',
    }),
    defineField({
      name: 'url',
      title: 'Link to source',
      description: 'Optional. If provided, the entry in Sources becomes clickable.',
      type: 'url',
      validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'year',
      title: 'Year / Date',
      description: 'e.g. 2026, or "March 2026".',
      type: 'string',
    }),
    defineField({
      name: 'note',
      title: 'Note (optional)',
      description: 'Page number, chapter, or a short clarification.',
      type: 'string',
    }),
  ],
})

/* ─────────────────────────────── Link ───────────────────────────────
 * One annotation handles both external links and links to your own pages.
 * External links open in a new tab and carry the right rel attributes
 * automatically; internal links stay in the tab and pass full SEO value.
 */
const linkAnnotation = defineArrayMember({
  name: 'link',
  title: 'Link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'linkType',
      title: 'Link to',
      type: 'string',
      options: {
        list: [
          { title: 'A page on another website', value: 'external' },
          { title: 'A page on this website', value: 'internal' },
        ],
        layout: 'radio',
      },
      initialValue: 'external',
    }),
    defineField({
      name: 'href',
      title: 'Web address',
      description: 'The full link, including https://',
      type: 'url',
      hidden: ({ parent }) => parent?.linkType === 'internal',
      validation: (Rule) =>
        Rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }).custom((value, context) => {
          const parent = context.parent as { linkType?: string } | undefined
          if (parent?.linkType !== 'internal' && !value) return 'A web address is required'
          return true
        }),
    }),
    defineField({
      name: 'reference',
      title: 'Page on this site',
      description: 'Pick an article or property to link to.',
      type: 'reference',
      to: [{ type: 'post' }, { type: 'property' }],
      hidden: ({ parent }) => parent?.linkType !== 'internal',
    }),
    defineField({
      name: 'sponsored',
      title: 'Paid or sponsored link?',
      description:
        'Turn on if this link was paid for. Adds rel="sponsored", which search engines require and which protects your rankings.',
      type: 'boolean',
      initialValue: false,
      hidden: ({ parent }) => parent?.linkType === 'internal',
    }),
  ],
})

/* ──────────────────────── Embedded content blocks ──────────────────────── */

const articleImage = defineArrayMember({
  name: 'articleImage',
  title: 'Image',
  type: 'image',
  icon: ImageIcon,
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      description: 'Describes the image for screen readers and search engines. Always fill this in.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      description: 'Shown in small type beneath the image.',
      type: 'string',
    }),
    defineField({
      name: 'credit',
      title: 'Photo credit',
      type: 'string',
    }),
    defineField({
      name: 'layout',
      title: 'Width',
      type: 'string',
      options: {
        list: [
          { title: 'Standard — matches the text column', value: 'inline' },
          { title: 'Wide — breaks out slightly', value: 'wide' },
          { title: 'Full bleed — edge to edge', value: 'full' },
        ],
        layout: 'radio',
      },
      initialValue: 'inline',
    }),
  ],
  preview: {
    select: { media: 'asset', title: 'caption', subtitle: 'alt' },
  },
})

const callout = defineArrayMember({
  name: 'callout',
  title: 'Callout box',
  type: 'object',
  icon: InfoOutlineIcon,
  description: 'A tinted box that breaks up long stretches of text.',
  fields: [
    defineField({
      name: 'tone',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Key insight', value: 'insight' },
          { title: 'Note', value: 'note' },
          { title: 'Tip / advice', value: 'tip' },
          { title: 'Caution', value: 'warning' },
        ],
        layout: 'radio',
      },
      initialValue: 'insight',
    }),
    defineField({ name: 'title', title: 'Heading', type: 'string' }),
    defineField({
      name: 'body',
      title: 'Text',
      type: 'array',
      of: [{ type: 'block', styles: [{ title: 'Normal', value: 'normal' }], lists: [{ title: 'Bullet', value: 'bullet' }] }],
    }),
  ],
  preview: {
    select: { title: 'title', tone: 'tone' },
    prepare: ({ title, tone }) => ({ title: title || 'Callout', subtitle: tone }),
  },
})

const pullQuote = defineArrayMember({
  name: 'pullQuote',
  title: 'Pull quote',
  type: 'object',
  icon: BlockquoteIcon,
  description: 'A large, styled quote used to give the reader a visual break.',
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'attribution', title: 'Who said it', type: 'string' }),
    defineField({ name: 'role', title: 'Their role / company', type: 'string' }),
  ],
  preview: {
    select: { title: 'quote', subtitle: 'attribution' },
  },
})

const statBlock = defineArrayMember({
  name: 'statBlock',
  title: 'Figures panel',
  type: 'object',
  icon: TrendUpwardIcon,
  description: 'Two to four headline numbers displayed side by side.',
  fields: [
    defineField({ name: 'heading', title: 'Panel heading', type: 'string' }),
    defineField({
      name: 'stats',
      title: 'Figures',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stat',
          fields: [
            defineField({
              name: 'value',
              title: 'Figure',
              description: 'e.g. "12.4%" or "KSh 2.1B".',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: 'label', title: 'What it measures', type: 'string' }),
            defineField({ name: 'note', title: 'Small print', type: 'string' }),
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        }),
      ],
      validation: (Rule) => Rule.min(2).max(4),
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Figures panel' }),
  },
})

const videoEmbed = defineArrayMember({
  name: 'videoEmbed',
  title: 'Video',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'url',
      title: 'YouTube or Vimeo link',
      type: 'url',
      validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https'] }),
    }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
  ],
  preview: {
    select: { title: 'caption', subtitle: 'url' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Video', subtitle }),
  },
})

const propertyEmbed = defineArrayMember({
  name: 'propertyEmbed',
  title: 'Property card',
  type: 'object',
  icon: HomeIcon,
  description: 'Drops a live listing card into the article. Details stay in sync with the property record.',
  fields: [
    defineField({
      name: 'property',
      title: 'Property',
      type: 'reference',
      to: [{ type: 'property' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'note',
      title: 'Why you are featuring it',
      type: 'string',
    }),
  ],
  preview: {
    select: { title: 'property.title', subtitle: 'note' },
  },
})

const sectionDivider = defineArrayMember({
  name: 'sectionDivider',
  title: 'Section break',
  type: 'object',
  icon: RemoveIcon,
  description: 'A visual pause between sections.',
  fields: [
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      options: {
        list: [
          { title: 'Thin rule', value: 'rule' },
          { title: 'Three dots', value: 'dots' },
          { title: 'Blank space only', value: 'space' },
        ],
        layout: 'radio',
      },
      initialValue: 'rule',
    }),
  ],
  preview: { prepare: () => ({ title: 'Section break' }) },
})

/* ──────────────────────────── The editor itself ──────────────────────────── */

export const blockContent = defineType({
  name: 'blockContent',
  title: 'Article body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      // Only H2 and H3 appear in the table of contents, which keeps it usable.
      styles: [
        { title: 'Body text', value: 'normal' },
        { title: 'Section heading (H2)', value: 'h2' },
        { title: 'Sub-heading (H3)', value: 'h3' },
        { title: 'Minor heading (H4)', value: 'h4' },
        { title: 'Standfirst / intro', value: 'lead' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bulleted list', value: 'bullet' },
        { title: 'Numbered list', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
          { title: 'Underline', value: 'underline' },
          { title: 'Strikethrough', value: 'strike-through' },
          { title: 'Highlight', value: 'highlight' },
          { title: 'Code', value: 'code' },
        ],
        annotations: [linkAnnotation, citationAnnotation],
      },
    }),
    articleImage,
    callout,
    pullQuote,
    statBlock,
    videoEmbed,
    propertyEmbed,
    sectionDivider,
  ],
})
