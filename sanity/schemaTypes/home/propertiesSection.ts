import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * "The Next Move Is Yours" on the home page.
 *
 * Both the copy and the filter chips are editable here, so the row of
 * categories under the heading is content rather than code. Each chip names a
 * property type (or a price ceiling) and the grid below narrows to match.
 */
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
      name: 'filters',
      title: 'Filter Chips',
      description:
        'The row of categories under the heading. Give each chip a label and tell it what to match. Drag to reorder; the first chip is selected when the page loads. Leave empty to hide the row.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'filter',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              description: 'What the visitor reads, e.g. "Warehouses"',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'mode',
              title: 'What it matches',
              type: 'string',
              options: {
                list: [
                  { title: 'Property types', value: 'types' },
                  { title: 'Everything (show all)', value: 'all' },
                  { title: 'Under a price ceiling', value: 'maxPrice' },
                ],
                layout: 'radio',
              },
              initialValue: 'types',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'propertyTypes',
              title: 'Property Types',
              description: 'A listing matches if it carries any one of these types.',
              type: 'array',
              of: [{ type: 'string' }],
              options: {
                list: [
                  { title: 'Penthouse', value: 'penthouse' },
                  { title: 'Apartment', value: 'apartment' },
                  { title: 'Villa', value: 'villa' },
                  { title: 'Townhouse', value: 'townhouse' },
                  { title: 'Warehouse', value: 'warehouse' },
                  { title: 'Commercial', value: 'commercial' },
                  { title: 'Land', value: 'land' },
                  { title: 'Ranch', value: 'ranch' },
                  { title: 'Farm', value: 'farm' },
                ],
              },
              hidden: ({ parent }) => parent?.mode !== 'types',
            }),
            defineField({
              name: 'maxPrice',
              title: 'Price Ceiling',
              description:
                'Numbers only, in Kenyan shillings. 20000000 shows everything under Ksh 20 million.',
              type: 'number',
              hidden: ({ parent }) => parent?.mode !== 'maxPrice',
            }),
          ],
          preview: {
            select: { title: 'label', mode: 'mode' },
            prepare: ({ title, mode }) => ({
              title,
              subtitle:
                mode === 'all'
                  ? 'Shows everything'
                  : mode === 'maxPrice'
                    ? 'Price ceiling'
                    : 'Property types',
            }),
          },
        }),
      ],
      initialValue: [
        { _type: 'filter', label: 'City Skylines', mode: 'types', propertyTypes: ['penthouse', 'apartment'] },
        { _type: 'filter', label: 'Warehouses', mode: 'types', propertyTypes: ['warehouse'] },
        { _type: 'filter', label: 'Villas', mode: 'types', propertyTypes: ['villa'] },
        { _type: 'filter', label: 'Just Listed', mode: 'all' },
        { _type: 'filter', label: 'Under Ksh 20 Million', mode: 'maxPrice', maxPrice: 20000000 },
      ],
    }),
    defineField({
      name: 'featuredProperties',
      title: 'Properties to Showcase',
      description:
        'Select properties from your inventory. No need to re-upload photos; they are pulled from the property record. Whatever you pick here is exactly what the home page shows.',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'property' }] }],
      validation: (Rule) => Rule.max(8),
    }),
    defineField({
      name: 'ctaLabel',
      title: 'Button Label',
      type: 'string',
      initialValue: 'View All Listings',
    }),
  ],
})
