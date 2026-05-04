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
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Neighborhood Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Neighborhood Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'photos',
      title: 'Neighborhood Photos',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'amenities',
      title: 'Amenities',
      description: 'List names of amenities (e.g. Parks, Gyms)',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'schools',
      title: 'Schools',
      description: 'List names of schools in the area',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'malls',
      title: 'Malls & Shopping',
      description: 'List names of malls or shopping centers',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'boundary',
      title: 'Neighborhood Boundary (Polygon)',
      description: 'Coordinates for the bounding area on the map',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'lat', type: 'number', title: 'Latitude' },
            { name: 'lng', type: 'number', title: 'Longitude' },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'county.name',
    },
  },
})
