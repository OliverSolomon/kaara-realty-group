import { defineField, defineType } from 'sanity'

export const county = defineType({
  name: 'county',
  title: 'County',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'County Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
  ],
})
