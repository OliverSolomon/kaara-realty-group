import { defineField, defineType } from 'sanity'

import { videoSourceFields } from '../objects/videoFields'

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
    ...videoSourceFields('file'),
  ],
})
