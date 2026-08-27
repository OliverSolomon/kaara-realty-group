import { defineArrayMember, defineField, defineType } from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Market Insight',
  type: 'document',
  description: 'Research, market notes and investor guidance published under Market Insights.',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Market Report', value: 'market-report' },
          { title: 'Investor Guide', value: 'investor-guide' },
          { title: 'Neighbourhood Study', value: 'neighbourhood-study' },
          { title: 'Company Note', value: 'company-note' },
        ],
      },
      initialValue: 'market-report',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      description: 'One or two sentences shown on the index page',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(220),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'externalUrl',
          title: 'External Image URL',
          type: 'url',
        },
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'readingMinutes',
      title: 'Reading Time in Minutes',
      description:
        'Leave blank and the site calculates it from the article length. Only fill this in to override.',
      type: 'number',
    }),
    defineField({
      name: 'tldr',
      title: 'TL;DR',
      description:
        'The whole report in two or three sentences, for readers who want the conclusion before deciding to read on. Shown in a highlighted box directly under the headline.',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(400),
    }),
    defineField({
      name: 'keyTakeaways',
      title: 'Key Takeaways',
      description:
        'Three to five scannable bullet points. These appear in a summary panel above the article and are what most readers will actually absorb.',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      description:
        'Use "Section heading (H2)" for each major section — the website builds the table of contents from these automatically.',
      type: 'blockContent',
    }),
    defineField({
      name: 'furtherReading',
      title: 'Further Reading',
      description:
        'Extra sources listed at the foot of the report. Anything cited inline while writing is added to Sources automatically — this is only for material not cited directly.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'source',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: 'publisher', title: 'Publisher / Author', type: 'string' }),
            defineField({
              name: 'url',
              title: 'Link',
              type: 'url',
              validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
            }),
            defineField({ name: 'year', title: 'Year / Date', type: 'string' }),
          ],
          preview: { select: { title: 'title', subtitle: 'publisher' } },
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'category', media: 'coverImage' },
  },
})
