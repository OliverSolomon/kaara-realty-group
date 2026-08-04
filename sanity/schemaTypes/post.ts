import { defineField, defineType } from 'sanity'

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
      type: 'number',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [{ type: 'block' }],
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
