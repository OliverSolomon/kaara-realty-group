'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

import { apiVersion, dataset, projectId } from './sanity/env'
import { schema } from './sanity/schemaTypes'
import { structure } from './sanity/structure'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema: {
    ...schema,
    // Lets each listing list start a new document with its section already
    // chosen, so "Create" inside Sell makes a resale unit and nothing else.
    templates: [
      {
        id: 'property-by-type',
        title: 'Listing in this section',
        schemaType: 'property',
        parameters: [{ name: 'listingType', type: 'string' }],
        value: ({ listingType }: { listingType: string }) => ({ listingType }),
      },
    ],
  },
  plugins: [
    structureTool({ structure }),
  ],
})
