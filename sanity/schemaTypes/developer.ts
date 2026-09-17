import { defineField, defineType } from 'sanity'

/**
 * A developer Kaara represents. Shown as a logo wall on World of Kaara and the
 * Buy page. Editors can add these from Pages → World of Kaara → Developer
 * Partners, or straight from the World of Kaara page itself.
 */
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
      name: 'logo',
      title: 'Logo',
      description:
        'Upload an SVG or a PNG with a transparent background, at least 400px wide. Leave empty and the website shows the initials instead.',
      type: 'image',
      options: {
        accept: 'image/svg+xml,image/png,image/webp,image/jpeg',
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'externalUrl',
          title: 'OR paste a logo URL',
          type: 'url',
          description: 'Use this instead of uploading a file.',
        }),
      ],
    }),
    defineField({
      name: 'logoStyle',
      title: 'How The Logo Is Shown',
      description:
        'The partner wall sits on a dark background. "White" turns every logo into a clean white mark so dark logos stay visible and the wall looks consistent. Choose "Original colours" for a logo that is already light, or "On a white tile" to keep a dark, full-colour logo exactly as supplied. A logo with a solid background (for example a JPG) should use "On a white tile".',
      type: 'string',
      options: {
        list: [
          { title: 'White (recommended)', value: 'white' },
          { title: 'Original colours', value: 'original' },
          { title: 'On a white tile', value: 'tile' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'white',
    }),
    defineField({
      name: 'website',
      title: 'Website',
      description: 'Optional. The logo links here.',
      type: 'url',
    }),
    defineField({
      name: 'summary',
      title: 'Why We Partner With Them',
      description: 'Optional. One or two sentences for internal reference and future use.',
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
      name: 'slug',
      title: 'Slug',
      description: 'Generated from the name. Not required.',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      description:
        'Used only when World of Kaara has no partners picked. Lower numbers show first.',
      type: 'number',
      initialValue: 0,
    }),
  ],
  orderings: [
    { title: 'Display order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
    { title: 'Name', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', subtitle: 'website', media: 'logo' },
  },
})
