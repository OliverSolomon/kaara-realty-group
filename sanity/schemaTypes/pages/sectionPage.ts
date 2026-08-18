import { defineField, defineType } from 'sanity'
import type { SchemaTypeDefinition } from 'sanity'

/**
 * Buy, Sell and Stay share one shape: a hero (eyebrow, headline, intro,
 * photograph) and the heading that sits above the unit grid. Keeping them as
 * singleton documents means an editor changes the words on the page without a
 * developer, which is how the Pavani studio is organised.
 */
function sectionPage(config: {
  name: string
  title: string
  description: string
  defaults: {
    eyebrow: string
    headline: string
    intro: string
    listingsHeading: string
    listingsEmptyTitle: string
    listingsEmptyBody: string
  }
}): SchemaTypeDefinition {
  return defineType({
    name: config.name,
    title: config.title,
    type: 'document',
    description: config.description,
    groups: [
      { name: 'hero', title: 'Hero', default: true },
      { name: 'listings', title: 'Listings block' },
    ],
    fields: [
      defineField({
        name: 'eyebrow',
        title: 'Small Label',
        description: 'The short word above the headline.',
        type: 'string',
        group: 'hero',
        initialValue: config.defaults.eyebrow,
      }),
      defineField({
        name: 'headline',
        title: 'Headline',
        type: 'string',
        group: 'hero',
        initialValue: config.defaults.headline,
      }),
      defineField({
        name: 'intro',
        title: 'Intro Paragraph',
        type: 'text',
        rows: 3,
        group: 'hero',
        initialValue: config.defaults.intro,
      }),
      defineField({
        name: 'heroImage',
        title: 'Hero Photograph',
        description:
          'Upload a photo, or paste a link in External Image URL. If you leave this empty the page uses the first listing photo.',
        type: 'image',
        options: { hotspot: true },
        group: 'hero',
        fields: [
          {
            name: 'externalUrl',
            title: 'External Image URL',
            type: 'url',
          },
        ],
      }),
      defineField({
        name: 'listingsHeading',
        title: 'Heading Above The Units',
        type: 'string',
        group: 'listings',
        initialValue: config.defaults.listingsHeading,
      }),
      defineField({
        name: 'listingsEmptyTitle',
        title: 'Message When Nothing Is Listed - Heading',
        type: 'string',
        group: 'listings',
        initialValue: config.defaults.listingsEmptyTitle,
      }),
      defineField({
        name: 'listingsEmptyBody',
        title: 'Message When Nothing Is Listed - Body',
        type: 'text',
        rows: 3,
        group: 'listings',
        initialValue: config.defaults.listingsEmptyBody,
      }),
    ],
    preview: {
      prepare: () => ({ title: config.title }),
    },
  })
}

export const buyPage = sectionPage({
  name: 'buyPage',
  title: 'Buy Page',
  description: 'The words on the Buy page. The listings themselves come from Listings / Buy.',
  defaults: {
    eyebrow: 'Buy',
    headline: 'Buy where the developer has already delivered.',
    intro:
      'Every listing here comes from a partner with a completed track record, published payment terms and support after handover.',
    listingsHeading: 'Active listings',
    listingsEmptyTitle: 'Nothing is live in this collection right now',
    listingsEmptyBody:
      'New releases are usually allocated before they reach the site. Tell us what you are looking for and we will send the next one that fits.',
  },
})

export const sellPage = sectionPage({
  name: 'sellPage',
  title: 'Sell Page',
  description:
    'The words on the Sell page. The resale units themselves come from Listings / Sell (resale units).',
  defaults: {
    eyebrow: 'Sell',
    headline: 'Resale units, vetted before they are listed.',
    intro: 'Ownership and title are confirmed first. Only then does a unit reach this page.',
    listingsHeading: 'Available resales',
    listingsEmptyTitle: 'No resale units are listed at the moment',
    listingsEmptyBody:
      'Resales move quickly and we only publish units that have cleared vetting. Tell us the building or district you want and we will contact you when one becomes available.',
  },
})

export const stayPage = sectionPage({
  name: 'stayPage',
  title: 'Stay Page',
  description:
    'The words on the Stay page. The short stay units themselves come from Listings / Stay (short stay units).',
  defaults: {
    eyebrow: 'Stay',
    headline: 'Short stays in buildings we know well.',
    intro:
      'Floor, aspect and nightly rate are stated for every unit. What you see is what you check into.',
    listingsHeading: 'Available units',
    listingsEmptyTitle: 'No short stay units are listed yet',
    listingsEmptyBody:
      'Our short stay portfolio is being onboarded building by building. Send us your dates and we will tell you what we can hold for you.',
  },
})
