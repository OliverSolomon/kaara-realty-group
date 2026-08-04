import { defineField, defineType } from 'sanity'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'World of Kaara',
  type: 'document',
  description: 'The About Us narrative, mission and long term commitments.',
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      description: 'Two lines maximum on desktop',
      type: 'string',
    }),
    defineField({
      name: 'standfirst',
      title: 'Standfirst',
      description: 'The opening paragraph under the headline. Keep it under 30 words.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
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
      name: 'body',
      title: 'The Story',
      description: 'The full About Us narrative',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'mission',
      title: 'Mission Statement',
      description: 'The single line that sits at the heart of everything',
      type: 'string',
    }),
    defineField({
      name: 'commitments',
      title: 'Commitments',
      description: 'The specific, measurable things Kaara is working toward',
      type: 'array',
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
  ],
  preview: {
    prepare: () => ({ title: 'World of Kaara' }),
  },
})
