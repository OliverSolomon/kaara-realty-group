import type { ComponentType } from 'react'
import type { StructureResolver } from 'sanity/structure'
import {
  CogIcon,
  UsersIcon,
  EnvelopeIcon,
  ImageIcon,
  EarthAmericasIcon,
  HomeIcon,
  TagIcon,
  CommentIcon,
  CaseIcon,
  DocumentTextIcon,
  DocumentsIcon,
  PlayIcon,
  RocketIcon,
  MoonIcon,
} from '@sanity/icons'

/**
 * Kaara & Co - Studio navigation.
 *
 * Organised the way the website reads, matching the Pavani studio so an editor
 * who knows one knows the other: PAGES (the words visitors see) -> LISTINGS
 * (Buy, Sell, Stay inventory) -> SETTINGS (brand-wide details).
 *
 * Each listing list opens pre-filtered AND pre-set: pressing Create inside
 * "Sell - Resale Units" starts a document already marked as a resale, so an
 * editor never has to remember which radio button to tick.
 */
const listingList = (
  S: Parameters<StructureResolver>[0],
  type: 'buy' | 'sell' | 'stay',
  title: string,
  icon: ComponentType,
) =>
  S.listItem()
    .title(title)
    .icon(icon)
    .child(
      S.documentTypeList('property')
        .title(title)
        .filter('_type == "property" && listingType == $type')
        .params({ type })
        .initialValueTemplates([
          S.initialValueTemplateItem('property-by-type', { listingType: type }),
        ])
        .defaultOrdering([{ field: '_createdAt', direction: 'desc' }]),
    )

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Kaara Content')
    .items([
      // ───────────────────────── PAGES ─────────────────────────
      S.listItem()
        .title('Pages')
        .icon(DocumentsIcon)
        .child(
          S.list()
            .title('Pages')
            .items([
              S.listItem()
                .title('Home Page')
                .icon(HomeIcon)
                .child(
                  S.list()
                    .title('Home Page - Sections')
                    .items([
                      S.listItem()
                        .title('1 · Hero Video (background)')
                        .icon(PlayIcon)
                        .child(S.document().schemaType('heroSection').documentId('heroSection')),
                      S.listItem()
                        .title('2 · Secondary Video')
                        .icon(PlayIcon)
                        .child(
                          S.document().schemaType('secondarySection').documentId('secondarySection'),
                        ),
                      S.listItem()
                        .title('3 · The Next Move Is Yours (featured + filters)')
                        .icon(HomeIcon)
                        .child(
                          S.document()
                            .schemaType('propertiesSection')
                            .documentId('propertiesSection'),
                        ),
                      S.listItem()
                        .title('4 · Experience Video')
                        .icon(PlayIcon)
                        .child(
                          S.document()
                            .schemaType('experienceSection')
                            .documentId('experienceSection'),
                        ),
                      S.listItem()
                        .title('5 · Closing Video')
                        .icon(PlayIcon)
                        .child(
                          S.document().schemaType('closingSection').documentId('closingSection'),
                        ),
                    ]),
                ),
              S.listItem()
                .title('Buy Page')
                .icon(HomeIcon)
                .child(S.document().schemaType('buyPage').documentId('buyPage')),
              S.listItem()
                .title('Sell Page')
                .icon(TagIcon)
                .child(S.document().schemaType('sellPage').documentId('sellPage')),
              S.listItem()
                .title('Stay Page')
                .icon(MoonIcon)
                .child(S.document().schemaType('stayPage').documentId('stayPage')),
              S.listItem()
                .title('World of Kaara')
                .icon(EarthAmericasIcon)
                .child(S.document().schemaType('aboutPage').documentId('aboutPage')),
            ]),
        ),

      S.listItem()
        .title('Market Insights')
        .icon(DocumentTextIcon)
        .child(
          S.documentTypeList('post')
            .title('Market Insights')
            .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
        ),

      S.divider(),

      // ─────────────────────── LISTINGS ───────────────────────
      S.listItem()
        .title('Listings')
        .icon(HomeIcon)
        .child(
          S.list()
            .title('Listings')
            .items([
              listingList(S, 'buy', 'Buy - Active Listings', HomeIcon),
              listingList(S, 'sell', 'Sell - Resale Units', TagIcon),
              listingList(S, 'stay', 'Stay - Short Stay Units', MoonIcon),
              S.divider(),
              S.documentTypeListItem('property').title('All Listings').icon(DocumentsIcon),
            ]),
        ),

      S.documentTypeListItem('developer').title('Developer Partners').icon(CaseIcon),
      S.documentTypeListItem('testimonial').title('Testimonials').icon(CommentIcon),

      S.listItem()
        .title('Locations')
        .icon(EarthAmericasIcon)
        .child(
          S.list()
            .title('Locations')
            .items([
              S.documentTypeListItem('district').title('Districts').icon(TagIcon),
              S.documentTypeListItem('county').title('Counties').icon(EarthAmericasIcon),
            ]),
        ),

      S.divider(),

      // ─────────────────────── SETTINGS ───────────────────────
      S.listItem()
        .title('Settings')
        .icon(CogIcon)
        .child(
          S.list()
            .title('Site Settings')
            .items([
              S.listItem()
                .title('General (site name, SEO, currency)')
                .icon(RocketIcon)
                .child(
                  S.document().schemaType('generalSettings').documentId('generalSettings'),
                ),
              S.listItem()
                .title('Brand Assets (logos, favicon)')
                .icon(ImageIcon)
                .child(S.document().schemaType('brandSettings').documentId('brandSettings')),
              S.listItem()
                .title('Contact Details (phone, WhatsApp, address)')
                .icon(EnvelopeIcon)
                .child(
                  S.document().schemaType('contactSettings').documentId('contactSettings'),
                ),
              S.listItem()
                .title('Social Links')
                .icon(UsersIcon)
                .child(S.document().schemaType('socialSettings').documentId('socialSettings')),
            ]),
        ),

      // Anything already placed above (or retired) stays out of the list.
      ...S.documentTypeListItems().filter(
        (listItem) =>
          ![
            'post',
            'property',
            'event',
            'district',
            'county',
            'developer',
            'testimonial',
            'aboutPage',
            'buyPage',
            'sellPage',
            'stayPage',
            'generalSettings',
            'brandSettings',
            'contactSettings',
            'socialSettings',
            'siteSettings',
            'homePage',
            'heroSection',
            'secondarySection',
            'propertiesSection',
            'experienceSection',
            'spotlightSection',
            'closingSection',
          ].includes(listItem.getId() || ''),
      ),
    ])
