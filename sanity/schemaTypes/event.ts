import { defineField, defineType } from 'sanity'

export const event = defineType({
  name: 'event',
  title: 'Events',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Event Title',
      description: 'The name of the event (e.g., Spotlight on Vertical Cities)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Event Description',
      description: 'A short overview of what the event is about',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'location',
      title: 'Event Location',
      description: 'Where the event is taking place (e.g., Upper Hill)',
      type: 'string',
    }),
    defineField({
      name: 'date',
      title: 'Event Date',
      description: 'When the event will happen (e.g., June 15th)',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'Event Image',
      description: 'Featured image for the event spotlight',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'media',
      title: 'Event Media',
      description: 'Additional media for the event (images or video URLs)',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
            }
          ]
        },
        {
          type: 'object',
          name: 'externalVideo',
          title: 'External Video',
          fields: [
            {
              name: 'url',
              type: 'url',
              title: 'Video URL (YouTube, Vimeo, etc.)',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            }
          ]
        }
      ]
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'location',
      media: 'image',
    },
  },
})
