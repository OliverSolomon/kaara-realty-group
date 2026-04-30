import { defineField, defineType } from 'sanity'

export const district = defineType({
  name: 'district',
  title: 'District',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'District Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'county',
      title: 'County',
      type: 'reference',
      to: [{ type: 'county' }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'county.name',
    },
  },
})
