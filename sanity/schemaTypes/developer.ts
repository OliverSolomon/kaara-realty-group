import { defineField, defineType } from 'sanity'

export const developer = defineType({
  name: 'developer',
  title: 'Developer Partner',
  type: 'document',
  description:
    'Developers Kaara sells for. Only partners with a delivery record, construction standards and post-sale support belong here.',
  fields: [
    defineField({
      name: 'name',
      title: 'Developer Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      description: 'Preferably an SVG or PNG with a transparent background',
      type: 'image',
      fields: [
        {
          name: 'externalUrl',
          title: 'External Logo URL',
          type: 'url',
          description: 'Optionally provide a URL instead of uploading a file',
        },
      ],
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
    }),
    defineField({
      name: 'summary',
      title: 'Why We Partner With Them',
      description: 'One or two sentences. Shown under the partnership wall.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'projectsDelivered',
      title: 'Projects Delivered',
      description: 'Leave empty rather than guessing. Only enter figures you can stand behind.',
      type: 'number',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'summary', media: 'logo' },
  },
})
