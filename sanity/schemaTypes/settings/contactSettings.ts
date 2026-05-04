import { defineField, defineType } from 'sanity'

export const contactSettings = defineType({
  name: 'contactSettings',
  title: 'Contact Details',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Contact Email',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Office Address',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'mapUrl',
      title: 'Google Maps Embed URL',
      type: 'url',
    }),
  ],
})
