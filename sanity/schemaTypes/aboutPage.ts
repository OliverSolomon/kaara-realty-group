import { defineField, defineType } from 'sanity'

/** Every image field can take an upload or a pasted URL, the Pavani pattern. */
const imageWithUrl = {
  options: { hotspot: true },
  fields: [
    {
      name: 'externalUrl',
      title: 'OR paste an image URL',
      type: 'url' as const,
      description: 'Use this instead of uploading.',
    },
    {
      name: 'alt',
      title: 'Alternative text',
      type: 'string' as const,
      description: 'Describes the image for screen readers and for search.',
    },
  ],
}

/**
 * World of Kaara.
 *
 * Every heading, paragraph and photograph on the page is editable here, split
 * into tabs that follow the page top to bottom. Nothing on that page is
 * hardcoded any more.
 */
export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'World of Kaara',
  type: 'document',
  description: 'Every section of the World of Kaara page.',
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'story', title: 'The Story' },
    { name: 'mission', title: 'Mission' },
    { name: 'commitments', title: 'Commitments' },
    { name: 'gallery', title: 'Gallery' },
    { name: 'sections', title: 'Testimonials & Partners' },
    { name: 'cta', title: 'Closing' },
  ],
  fields: [
    // ── Hero ──
    defineField({
      name: 'eyebrow',
      title: 'Small Label Above The Headline',
      type: 'string',
      group: 'hero',
      initialValue: 'World of Kaara',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      description: 'Two lines maximum on desktop',
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'standfirst',
      title: 'Standfirst',
      description: 'The opening paragraph under the headline. Keep it under 30 words.',
      type: 'text',
      rows: 3,
      group: 'hero',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Photograph',
      description: 'The wide image under the headline.',
      type: 'image',
      group: 'hero',
      ...imageWithUrl,
    }),

    // ── Story ──
    defineField({
      name: 'storyHeading',
      title: 'Heading',
      type: 'string',
      group: 'story',
      initialValue: 'Why we exist',
    }),
    defineField({
      name: 'body',
      title: 'The Story',
      description: 'The full narrative. Each paragraph is a block.',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'story',
    }),
    defineField({
      name: 'storyImage',
      title: 'Photograph Beside The Story',
      description: 'Optional. Leave empty and the story runs full width.',
      type: 'image',
      group: 'story',
      ...imageWithUrl,
    }),

    // ── Mission ──
    defineField({
      name: 'missionEyebrow',
      title: 'Small Label',
      type: 'string',
      group: 'mission',
      initialValue: 'Our mission',
    }),
    defineField({
      name: 'mission',
      title: 'Mission Statement',
      description: 'The single line that sits at the heart of everything',
      type: 'string',
      group: 'mission',
    }),
    defineField({
      name: 'missionImage',
      title: 'Background Photograph',
      description: 'Optional. Sits behind the mission statement, dimmed.',
      type: 'image',
      group: 'mission',
      ...imageWithUrl,
    }),

    // ── Commitments ──
    defineField({
      name: 'commitmentsHeading',
      title: 'Heading',
      type: 'string',
      group: 'commitments',
      initialValue: 'What we are working toward',
    }),
    defineField({
      name: 'commitments',
      title: 'Commitments',
      description: 'The specific, measurable things Kaara is working toward',
      type: 'array',
      group: 'commitments',
      of: [
        {
          type: 'object',
          name: 'commitment',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            {
              name: 'value',
              title: 'Value',
              description: 'e.g., 2,000 units or 2029',
              type: 'string',
            },
            { name: 'detail', title: 'Detail', type: 'text', rows: 2 },
          ],
          preview: {
            select: { title: 'label', subtitle: 'value' },
          },
        },
      ],
    }),

    // ── Gallery ──
    defineField({
      name: 'galleryHeading',
      title: 'Heading',
      type: 'string',
      group: 'gallery',
      initialValue: 'Inside the work',
    }),
    defineField({
      name: 'galleryIntro',
      title: 'Intro Paragraph',
      type: 'text',
      rows: 2,
      group: 'gallery',
    }),
    defineField({
      name: 'gallery',
      title: 'Photographs',
      description:
        'Add as many as you like. They lay out in a grid. Leave this empty and the section does not appear.',
      type: 'array',
      group: 'gallery',
      of: [
        {
          type: 'image',
          name: 'galleryImage',
          ...imageWithUrl,
          fields: [
            ...imageWithUrl.fields,
            { name: 'caption', title: 'Caption', type: 'string' as const },
          ],
        },
      ],
      options: { layout: 'grid' },
    }),

    // ── Testimonials & partners ──
    defineField({
      name: 'testimonialsHeading',
      title: 'Testimonials Heading',
      description: 'The quotes themselves come from the Testimonials list.',
      type: 'string',
      group: 'sections',
      initialValue: 'From the people we have worked with',
    }),
    defineField({
      name: 'partnersHeading',
      title: 'Developer Partners Heading',
      description: 'The logos come from the Developer Partners list.',
      type: 'string',
      group: 'sections',
      initialValue: 'Developers we represent',
    }),

    // ── Closing ──
    defineField({
      name: 'ctaHeading',
      title: 'Heading',
      type: 'string',
      group: 'cta',
      initialValue: 'Start with a conversation, not a listing',
    }),
    defineField({
      name: 'ctaBody',
      title: 'Paragraph',
      type: 'text',
      rows: 3,
      group: 'cta',
      initialValue:
        'Book a virtual tour of a specific building, or an investment consultation if you are still working out where your money should go.',
    }),
    defineField({
      name: 'ctaLinkLabel',
      title: 'Link Label',
      type: 'string',
      group: 'cta',
      initialValue: 'Read our market insights',
    }),
    defineField({
      name: 'ctaLinkHref',
      title: 'Link Destination',
      description: 'A path on this site, e.g. /market-insights',
      type: 'string',
      group: 'cta',
      initialValue: '/market-insights',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'World of Kaara' }),
  },
})
