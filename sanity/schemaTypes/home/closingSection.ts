import { defineField, defineType } from 'sanity'

import { videoSourceFields } from '../objects/videoFields'

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
    ...videoSourceFields('url'),
  ],
})
