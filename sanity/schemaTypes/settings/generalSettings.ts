import { defineField, defineType } from 'sanity'

export const generalSettings = defineType({
  name: 'generalSettings',
  title: 'General Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Site Description',
      description: 'Used for SEO and meta tags',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'footerText',
      title: 'Footer Copyright Text',
      type: 'string',
    }),
    defineField({
      name: 'defaultCurrency',
      title: 'Default Currency',
      description: 'The initial currency shown to users',
      type: 'string',
      options: {
        list: [
          { title: 'KES - Kenyan Shilling', value: 'KES' },
          { title: 'USD - US Dollar', value: 'USD' },
          { title: 'GBP - British Pound', value: 'GBP' },
          { title: 'EUR - Euro', value: 'EUR' },
          { title: 'AED - UAE Dirham', value: 'AED' },
        ],
      },
      initialValue: 'KES',
    }),
    defineField({
      name: 'defaultLanguage',
      title: 'Default Language',
      type: 'string',
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Arabic', value: 'ar' },
          { title: 'Chinese', value: 'zh' },
        ],
      },
      initialValue: 'en',
    }),
  ],
})
