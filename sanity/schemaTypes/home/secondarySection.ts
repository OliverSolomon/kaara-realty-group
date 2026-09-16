import { defineField, defineType } from 'sanity'

import { videoSourceFields } from '../objects/videoFields'

export const secondarySection = defineType({
  name: 'secondarySection',
  title: 'Secondary Video (Section 2)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'UNRIVALED EXCLUSIVITY',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
    }),
    ...videoSourceFields('url'),
  ],
})
