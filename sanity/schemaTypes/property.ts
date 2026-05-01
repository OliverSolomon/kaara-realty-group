import { defineArrayMember, defineField, defineType } from 'sanity'

export const property = defineType({
  name: 'property',
  title: 'Property',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Property Title',
      description: 'The main name displayed for the property (e.g., The Amethyst)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'buildingName',
      title: 'Building Name',
      description: 'The specific name of the building or residence complex',
      type: 'string',
    }),
    defineField({
      name: 'county',
      title: 'County',
      description: 'Select the county (e.g., Nairobi). You can add a new one if it does not exist.',
      type: 'reference',
      to: [{ type: 'county' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'district',
      title: 'District',
      description: 'Select the district. Only districts within the selected county will be shown.',
      type: 'reference',
      to: [{ type: 'district' }],
      options: {
        filter: ({ document }) => {
          if (!document.county) {
            return {
              filter: '',
            }
          }
          return {
            filter: 'county._ref == $countyId',
            params: {
              countyId: (document.county as any)?._ref,
            },
          }
        },
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      description: 'A brief summary of the property for quick viewing',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'details',
      title: 'Property Summary Details',
      description: 'Key specs shown on the card (e.g., 3 BR | 4 BA, 1 HALF BA)',
      type: 'string',
    }),
    defineField({
      name: 'price',
      title: 'Price',
      description: 'The asking price (e.g., KSh 520,000,000)',
      type: 'string',
    }),
    defineField({
      name: 'propertyType',
      title: 'Property Type',
      description: 'Used for filtering (e.g., Penthouse, Apartment, Villa)',
      type: 'string',
      options: {
        list: [
          { title: 'Penthouse', value: 'penthouse' },
          { title: 'Apartment', value: 'apartment' },
          { title: 'Villa', value: 'villa' },
          { title: 'Townhouse', value: 'townhouse' },
          { title: 'Commercial', value: 'commercial' },
          { title: 'Land', value: 'land' },
          { title: 'Ranch', value: 'ranch' },
          { title: 'Farm', value: 'farm' },
        ],
      },
    }),
    defineField({
      name: 'verificationDocuments',
      title: 'Verification Documents',
      description: 'Official documents confirming the property status (PDF or Images)',
      type: 'array',
      of: [
        defineArrayMember({ type: 'file' }),
        defineArrayMember({ type: 'image' }),
      ],
    }),
    defineField({
      name: 'media',
      title: 'Property Media',
      description: 'Add multiple images or video URLs for the property gallery',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
              description: 'Describes the image for accessibility',
            }
          ]
        }),
        defineArrayMember({
          type: 'object',
          name: 'externalVideo',
          title: 'External Video',
          fields: [
            {
              name: 'url',
              type: 'url',
              title: 'Video URL',
              description: 'YouTube, Vimeo, or other video link',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            }
          ]
        })
      ],
    }),
    defineField({
      name: 'image',
      title: 'Main Property Image',
      description: 'The primary image used for thumbnails and listings',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'district',
      media: 'image',
    },
    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle: subtitle ? `District: ${subtitle}` : '',
        media,
      }
    },
  },
})

