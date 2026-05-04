import { defineField, defineType } from 'sanity'

export const propertiesSection = defineType({
  name: 'propertiesSection',
  title: 'Featured Properties Section',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Main Title',
      type: 'string',
      initialValue: 'The Next Move Is Yours',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      initialValue: 'Local Experts, Global Reach',
    }),
    defineField({
      name: 'featuredProperties',
      title: 'Properties to Showcase',
      description: 'Select properties from your inventory. No need to re-upload photos; they will be pulled from the property record.',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'property' }] }],
      validation: (Rule) => Rule.max(8),
    }),
  ],
})
