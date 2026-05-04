import { defineField, defineType } from 'sanity'

export const socialSettings = defineType({
  name: 'socialSettings',
  title: 'Social Media',
  type: 'document',
  fields: [
    defineField({
      name: 'instagram',
      title: 'Instagram URL',
      type: 'url',
    }),
    defineField({
      name: 'facebook',
      title: 'Facebook URL',
      type: 'url',
    }),
    defineField({
      name: 'linkedin',
      title: 'LinkedIn URL',
      type: 'url',
    }),
    defineField({
      name: 'twitter',
      title: 'Twitter/X URL',
      type: 'url',
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp Number',
      description: 'Format: 254700000000',
      type: 'string',
    }),
  ],
})
