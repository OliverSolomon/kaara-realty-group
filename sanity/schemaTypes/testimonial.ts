import { defineField, defineType } from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      description:
        'Keep it to three lines or fewer. A landing page quote is a snippet, not the full review.',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required().max(240),
    }),
    defineField({
      name: 'name',
      title: 'Client Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role or Context',
      description: 'e.g., Bought a two bedroom at Riara One, or Diaspora investor, London',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'portrait',
      title: 'Portrait',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'portrait' },
  },
})
