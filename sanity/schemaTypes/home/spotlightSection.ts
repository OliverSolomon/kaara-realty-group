import { defineField, defineType } from 'sanity'

export const spotlightSection = defineType({
  name: 'spotlightSection',
  title: 'Spotlight Section (Featured Event)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Main Title',
      type: 'string',
      initialValue: 'ON THE MOVE WITH @kaararealtygroup',
    }),
    defineField({
      name: 'featuredEvent',
      title: 'Select Event to Feature',
      description: 'Select an event from your events list.',
      type: 'reference',
      to: [{ type: 'event' }],
    }),
  ],
})
