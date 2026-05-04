import { defineField, defineType } from 'sanity'

export const experienceSection = defineType({
  name: 'experienceSection',
  title: 'Experience Section (Section 3)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'LIVE THE EXTRAORDINARY',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
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
