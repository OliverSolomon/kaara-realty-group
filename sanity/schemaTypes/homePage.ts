import { defineField, defineType } from 'sanity'

const videoSource = {
  name: 'videoSource',
  title: 'Video Source',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
    }),
    defineField({
      name: 'subtitle',
      title: 'Section Subtitle',
      type: 'string',
    }),
    defineField({
      name: 'type',
      title: 'Source Type',
      type: 'string',
      options: {
        list: [
          { title: 'File Upload', value: 'file' },
          { title: 'External URL', value: 'url' },
        ],
        layout: 'radio',
      },
      initialValue: 'file',
    }),
    defineField({
      name: 'videoUrl',
      title: 'External URL',
      type: 'url',
      hidden: ({ parent }) => parent?.type !== 'url',
    }),
    defineField({
      name: 'videoFile',
      title: 'Video File',
      type: 'file',
      hidden: ({ parent }) => parent?.type !== 'file',
    }),
  ],
}

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroVideo',
      title: 'Section 1: Hero Video',
      description: 'The main video shown at the top of the homepage with the search button',
      type: 'object',
      fields: videoSource.fields,
    }),
    defineField({
      name: 'secondaryVideo',
      title: 'Section 2: Secondary Video',
      description: 'Full-screen video section following the hero section',
      type: 'object',
      fields: videoSource.fields,
    }),
    defineField({
      name: 'tertiaryVideo',
      title: 'Section 3: Tertiary Video',
      description: 'Full-screen video section following the property showcase',
      type: 'object',
      fields: videoSource.fields,
    }),
    defineField({
      name: 'quaternaryVideo',
      title: 'Section 4: Quaternary Video',
      description: 'Final full-screen video section before the footer',
      type: 'object',
      fields: videoSource.fields,
    }),
    defineField({
      name: 'featuredProperties',
      title: 'Featured Properties',
      description: 'Select properties to display in the "The Next Move Is Yours" section',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'property' }] }],
    }),
    defineField({
      name: 'featuredEvent',
      title: 'Featured Spotlight Event',
      description: 'Select an event to feature in the "Spotlight" section',
      type: 'reference',
      to: [{ type: 'event' }],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Home Page Settings',
      }
    },
  },
})
