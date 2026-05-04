import { defineField, defineType } from 'sanity'

export const brandSettings = defineType({
  name: 'brandSettings',
  title: 'Brand Assets',
  type: 'document',
  fields: [
    defineField({
      name: 'logoPrimary',
      title: 'Primary Logo',
      description: 'Standard logo used in the navbar',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'logoWhite',
      title: 'White Logo',
      description: 'Used on dark backgrounds',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      description: 'The browser tab icon',
      type: 'image',
    }),
  ],
})
