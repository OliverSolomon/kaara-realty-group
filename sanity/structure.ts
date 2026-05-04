import type { StructureResolver } from 'sanity/structure'
import { CogIcon, UsersIcon, EnvelopeIcon, ImageIcon, EarthAmericasIcon } from '@sanity/icons'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('post').title('Posts'),
      S.documentTypeListItem('property').title('Properties'),
      S.documentTypeListItem('event').title('Events'),
      S.documentTypeListItem('district').title('Districts'),
      S.divider(),
      
      // Grouped Home Page Sections
      S.listItem()
        .title('Home Page')
        .icon(EarthAmericasIcon)
        .child(
          S.list()
            .title('Sections')
            .items([
              S.listItem()
                .title('Hero Section (1)')
                .icon(ImageIcon)
                .child(
                  S.document()
                    .schemaType('heroSection')
                    .documentId('heroSection')
                ),
              S.listItem()
                .title('Secondary Video (2)')
                .icon(ImageIcon)
                .child(
                  S.document()
                    .schemaType('secondarySection')
                    .documentId('secondarySection')
                ),
              S.listItem()
                .title('Featured Properties')
                .icon(ImageIcon)
                .child(
                  S.document()
                    .schemaType('propertiesSection')
                    .documentId('propertiesSection')
                ),
              S.listItem()
                .title('Experience Section (3)')
                .icon(ImageIcon)
                .child(
                  S.document()
                    .schemaType('experienceSection')
                    .documentId('experienceSection')
                ),
              S.listItem()
                .title('Spotlight Section')
                .icon(ImageIcon)
                .child(
                  S.document()
                    .schemaType('spotlightSection')
                    .documentId('spotlightSection')
                ),
              S.listItem()
                .title('Closing Video (4)')
                .icon(ImageIcon)
                .child(
                  S.document()
                    .schemaType('closingSection')
                    .documentId('closingSection')
                ),
            ])
        ),

      // Grouped Settings
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(
          S.list()
            .title('Settings')
            .items([
              S.listItem()
                .title('General Settings')
                .icon(EarthAmericasIcon)
                .child(
                  S.document()
                    .schemaType('generalSettings')
                    .documentId('generalSettings')
                ),
              S.listItem()
                .title('Brand Assets')
                .icon(ImageIcon)
                .child(
                  S.document()
                    .schemaType('brandSettings')
                    .documentId('brandSettings')
                ),
              S.listItem()
                .title('Contact Details')
                .icon(EnvelopeIcon)
                .child(
                  S.document()
                    .schemaType('contactSettings')
                    .documentId('contactSettings')
                ),
              S.listItem()
                .title('Social Media')
                .icon(UsersIcon)
                .child(
                  S.document()
                    .schemaType('socialSettings')
                    .documentId('socialSettings')
                ),
            ])
        ),

      // Filter out types that are explicitly added above or should be hidden
      ...S.documentTypeListItems().filter(
        (listItem) => 
          ![
            'post', 
            'property', 
            'event', 
            'district', 
            'county',
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
            'closingSection'
          ].includes(listItem.getId() || '')
      ),
    ])
