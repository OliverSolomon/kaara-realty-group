import type { SchemaTypeDefinition } from 'sanity'

import { post } from './post'
import { property } from './property'
import { event } from './event'
import { homePage } from './homePage'
import { county } from './county'
import { district } from './district'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [post, property, event, homePage, county, district],
}
