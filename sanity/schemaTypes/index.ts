import type { SchemaTypeDefinition } from 'sanity'

import { post } from './post'
import { property } from './property'
import { event } from './event'
import { county } from './county'
import { district } from './district'
import { developer } from './developer'
import { testimonial } from './testimonial'
import { aboutPage } from './aboutPage'
import { buyPage, sellPage, stayPage } from './pages/sectionPage'
import { socialSettings } from './settings/socialSettings'
import { contactSettings } from './settings/contactSettings'
import { brandSettings } from './settings/brandSettings'
import { generalSettings } from './settings/generalSettings'
import { heroSection } from './home/heroSection'
import { secondarySection } from './home/secondarySection'
import { propertiesSection } from './home/propertiesSection'
import { experienceSection } from './home/experienceSection'
import { closingSection } from './home/closingSection'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    post,
    property,
    event,
    county,
    district,
    developer,
    testimonial,
    aboutPage,
    buyPage,
    sellPage,
    stayPage,
    socialSettings,
    contactSettings,
    brandSettings,
    generalSettings,
    heroSection,
    secondarySection,
    propertiesSection,
    experienceSection,
    closingSection,
  ],
}
