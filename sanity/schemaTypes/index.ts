import type { SchemaTypeDefinition } from 'sanity'

import { post } from './post'
import { property } from './property'
import { event } from './event'
import { county } from './county'
import { district } from './district'
import { socialSettings } from './settings/socialSettings'
import { contactSettings } from './settings/contactSettings'
import { brandSettings } from './settings/brandSettings'
import { generalSettings } from './settings/generalSettings'
import { heroSection } from './home/heroSection'
import { secondarySection } from './home/secondarySection'
import { propertiesSection } from './home/propertiesSection'
import { experienceSection } from './home/experienceSection'
import { spotlightSection } from './home/spotlightSection'
import { closingSection } from './home/closingSection'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    post,
    property,
    event,
    county,
    district,
    socialSettings,
    contactSettings,
    brandSettings,
    generalSettings,
    heroSection,
    secondarySection,
    propertiesSection,
    experienceSection,
    spotlightSection,
    closingSection,
  ],
}
