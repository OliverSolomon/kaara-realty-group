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
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The unique URL for this property',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'listingType',
      title: 'Listing Type',
      description:
        'Which section of the site this listing belongs to. Buy = new and active listings. Sell = owner resale units. Stay = luxury short stays.',
      type: 'string',
      options: {
        list: [
          { title: 'Buy (active listing)', value: 'buy' },
          { title: 'Sell (owner resale)', value: 'sell' },
          { title: 'Stay (short stay)', value: 'stay' },
        ],
        layout: 'radio',
      },
      initialValue: 'buy',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'developer',
      title: 'Developer',
      description: 'The developer partner behind this project',
      type: 'reference',
      to: [{ type: 'developer' }],
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
      description:
        'Optional. Select the county (e.g., Nairobi). If you only want to type a location by hand, use the Location field below instead.',
      type: 'reference',
      to: [{ type: 'county' }],
    }),
    defineField({
      name: 'district',
      title: 'District',
      description:
        'Optional. Select the district. Only districts within the selected county will be shown.',
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
    }),
    defineField({
      name: 'location',
      title: 'Location',
      description:
        'Type the location as you want it to read on the card, e.g. "Westlands, Nairobi" or "Nyali, Mombasa". This is all you need for a quick listing — County and District above are optional extras used by search.',
      type: 'string',
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      description: 'A brief summary of the property for quick viewing',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'longDescription',
      title: 'In-depth Description',
      description: 'Detailed information about the property, its features, and neighborhood',
      type: 'array',
      of: [{ type: 'block' }],
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
      description: 'The asking price and currency',
      type: 'object',
      fields: [
        {
          name: 'amount',
          title: 'Amount',
          type: 'string',
          description: 'The numeric price (e.g., 520,000,000)',
        },
        {
          name: 'currency',
          title: 'Currency',
          type: 'string',
          options: {
            list: [
              { title: 'KSh (Kenyan Shilling)', value: 'KSh' },
              { title: 'USD (US Dollar)', value: 'USD' },
              { title: 'EUR (Euro)', value: 'EUR' },
              { title: 'GBP (British Pound)', value: 'GBP' },
            ],
          },
          initialValue: 'KSh',
        }
      ]
    }),
    defineField({
      name: 'propertyType',
      title: 'Property Type',
      description: 'Select all that apply (e.g., Commercial and Apartment for mixed use)',
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
      description: 'Add multiple images (files or URLs) or video URLs for the property gallery',
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
          name: 'externalImage',
          title: 'External Image URL',
          fields: [
            {
              name: 'url',
              type: 'url',
              title: 'Image URL',
              description: 'Link to an external image',
            },
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
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
      fields: [
        {
          name: 'externalUrl',
          title: 'External Image URL',
          type: 'url',
          description: 'Optionally provide a URL instead of uploading an image'
        }
      ]
    }),
    defineField({
      name: 'googleMapsUrl',
      title: 'Google Maps URL',
      description: 'Paste the Google Maps location link here. This will be used for mapping.',
      type: 'url',
    }),
    defineField({
      name: 'amenities',
      title: 'Amenities',
      description: 'Select all available amenities (e.g., Pool, Gym, Rooftop Terrace)',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Swimming Pool', value: 'pool' },
          { title: 'Gym / Fitness Center', value: 'gym' },
          { title: 'Rooftop Terrace', value: 'rooftop' },
          { title: 'Private Garden', value: 'garden' },
          { title: 'Elevator', value: 'elevator' },
          { title: 'Backup Generator', value: 'generator' },
          { title: 'Borehole', value: 'borehole' },
          { title: 'CCTV & Security', value: 'security' },
          { title: 'Concierge', value: 'concierge' },
          { title: 'Parking', value: 'parking' },
          { title: 'Staff Quarters', value: 'sq' },
        ],
      },
    }),
    defineField({
      name: 'size',
      title: 'Property Size',
      description: 'e.g., 2,500 sq. ft. or 0.5 Acres',
      type: 'string',
    }),
    defineField({
      name: 'sizeSqm',
      title: 'Size in Square Metres',
      description:
        'Numeric only. The site converts this to square feet for international buyers, so enter 148 rather than "148 sqm".',
      type: 'number',
    }),
    defineField({
      name: 'bedrooms',
      title: 'Bedrooms',
      type: 'number',
    }),
    defineField({
      name: 'bathrooms',
      title: 'Bathrooms',
      type: 'number',
    }),
    defineField({
      name: 'yearBuilt',
      title: 'Year Built / Handover',
      description: 'e.g., 2025 or Under Construction',
      type: 'string',
    }),
    defineField({
      name: 'virtualTourUrl',
      title: 'Virtual Tour Link',
      description: 'Matterport, YouTube 360 or any hosted walkthrough',
      type: 'url',
    }),
    defineField({
      name: 'viewCount',
      title: 'Recorded Views',
      description:
        'Number of recorded viewings of this listing. Shown on the listing page as social proof.',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(249),
    }),

    // Sell section
    defineField({
      name: 'ownerVetted',
      title: 'Owner Vetted',
      description:
        'Sell listings only. Confirms Kaara has verified ownership and title documents for this resale unit.',
      type: 'boolean',
      initialValue: false,
      hidden: ({ document }) => document?.listingType !== 'sell',
    }),

    // Stay section
    defineField({
      name: 'floorNumber',
      title: 'Floor Number',
      description: 'Stay listings only. e.g., 14th floor',
      type: 'string',
      hidden: ({ document }) => document?.listingType !== 'stay',
    }),
    defineField({
      name: 'facingDirection',
      title: 'Facing Direction',
      description: 'Stay listings only. The aspect the unit looks out on.',
      type: 'string',
      options: {
        list: [
          { title: 'North', value: 'north' },
          { title: 'North East', value: 'north-east' },
          { title: 'East', value: 'east' },
          { title: 'South East', value: 'south-east' },
          { title: 'South', value: 'south' },
          { title: 'South West', value: 'south-west' },
          { title: 'West', value: 'west' },
          { title: 'North West', value: 'north-west' },
        ],
      },
      hidden: ({ document }) => document?.listingType !== 'stay',
    }),
    defineField({
      name: 'dailyRate',
      title: 'Daily Rate',
      description: 'Stay listings only. The nightly rate for this unit.',
      type: 'object',
      hidden: ({ document }) => document?.listingType !== 'stay',
      fields: [
        {
          name: 'amount',
          title: 'Amount',
          type: 'number',
        },
        {
          name: 'currency',
          title: 'Currency',
          type: 'string',
          options: {
            list: [
              { title: 'KES (Kenyan Shilling)', value: 'KES' },
              { title: 'USD (US Dollar)', value: 'USD' },
              { title: 'GBP (British Pound)', value: 'GBP' },
              { title: 'EUR (Euro)', value: 'EUR' },
              { title: 'AED (UAE Dirham)', value: 'AED' },
            ],
          },
          initialValue: 'KES',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      district: 'district.name',
      location: 'location',
      listingType: 'listingType',
      media: 'image',
    },
    prepare({ title, district, location, listingType, media }) {
      const label: Record<string, string> = {
        buy: 'Buy',
        sell: 'Sell',
        stay: 'Stay',
      }
      const parts = [label[listingType as string], location || district].filter(Boolean)
      return {
        title,
        subtitle: parts.join(' / '),
        media,
      }
    },
  },
})

