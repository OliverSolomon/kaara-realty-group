import { defineField, defineType } from 'sanity'

import { videoSourceFields } from '../objects/videoFields'

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
    ...videoSourceFields('url'),
  ],
})
