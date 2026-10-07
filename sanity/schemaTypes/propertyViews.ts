import { defineField, defineType } from 'sanity'

/**
 * Running view total for one listing, written by /api/views whenever a visitor
 * opens the listing page. Kept apart from the listing itself so a page view
 * never edits the listing and never fires the content-refresh webhook.
 * The document id is "views.<listing id>", which the listing queries join on.
 */
export const propertyViews = defineType({
  name: 'propertyViews',
  title: 'Listing Views',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({
      name: 'property',
      title: 'Listing',
      type: 'reference',
      to: [{ type: 'property' }],
      weak: true,
    }),
    defineField({ name: 'count', title: 'Views', type: 'number' }),
  ],
  preview: {
    select: { title: 'property.title', count: 'count' },
    prepare: ({ title, count }) => ({
      title: title || 'Listing',
      subtitle: `${count ?? 0} views`,
    }),
  },
})
