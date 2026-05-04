import { defineField, defineType } from 'sanity'

export const closingSection = defineType({
  name: 'closingSection',
  title: 'Closing Video (Section 4)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: '88 NAIROBI CONDOMINIUM',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      initialValue: 'The Apex of Upper Hill • Handover May 2026',
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
      initialValue: 'url',
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
