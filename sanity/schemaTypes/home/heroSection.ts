import { defineField, defineType } from 'sanity'

export const heroSection = defineType({
  name: 'heroSection',
  title: 'Hero Section (Section 1)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Main Title',
      type: 'string',
      initialValue: 'WHERE DO YOU WANT TO GO?',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      initialValue: 'Leaders in Luxury Vertical Living • Nairobi',
    }),
    defineField({
      name: 'type',
      title: 'Video Type',
      type: 'string',
      options: {
        list: [
          { title: 'File Upload', value: 'file' },
          { title: 'External URL', value: 'url' },
        ],
        layout: 'radio',
      },
      initialValue: 'file',
    }),
    defineField({
      name: 'videoUrl',
      title: 'External Video URL',
      type: 'url',
      hidden: ({ parent }) => parent?.type !== 'url',
    }),
    defineField({
      name: 'videoFile',
      title: 'Video File',
      type: 'file',
      hidden: ({ parent }) => parent?.type !== 'file',
    }),
  ],
})
