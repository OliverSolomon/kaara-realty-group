import { defineQuery } from 'next-sanity'

export const HOME_PAGE_QUERY = defineQuery(`{
  "heroVideo": *[_type == "heroSection"][0]{
    ...,
    "fileUrl": videoFile.asset->url
  },
  "secondaryVideo": *[_type == "secondarySection"][0]{
    ...,
    "fileUrl": videoFile.asset->url
  },
  "propertiesSection": *[_type == "propertiesSection"][0]{
    ...,
    featuredProperties[]-> {
      _id,
      title,
      "slug": slug.current,
      buildingName,
      price,
      "imageUrl": coalesce(
        image.asset->url, 
        image.externalUrl,
        media[_type == "image"][0].asset->url,
        media[_type == "externalImage"][0].url
      ),
      "county": county->name,
      "district": district->name,
      location,
      details,
      propertyType,
      listingType
    }
  },
  "experienceVideo": *[_type == "experienceSection"][0]{
    ...,
    "fileUrl": videoFile.asset->url
  },
  "closingVideo": *[_type == "closingSection"][0]{
    ...,
    "fileUrl": videoFile.asset->url
  }
}`)

export const PROPERTIES_QUERY = defineQuery(`*[_type == "property"] | order(_createdAt desc) {
  _id,
  title,
  buildingName,
  price,
  "slug": slug.current,
  "imageUrl": coalesce(
    image.asset->url, 
    image.externalUrl,
    media[_type == "image"][0].asset->url,
    media[_type == "externalImage"][0].url
  ),
  "county": county->name,
  location,
  "district": district->{
    name,
    boundary
  },
  details,
  propertyType,
  shortDescription,
  googleMapsUrl,
  amenities,
  size,
  sizeSqm,
  bedrooms,
  bathrooms,
  yearBuilt,
  listingType,
  ownerVetted,
  floorNumber,
  facingDirection,
  dailyRate,
  viewCount,
  media[] {
    ...,
    _type == "image" => {
      "url": asset->url
    },
    _type == "externalImage" => {
      "url": url
    }
  }
}`)

export const PROPERTY_DETAIL_QUERY = defineQuery(`*[_type == "property" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  buildingName,
  price,
  "imageUrl": coalesce(
    image.asset->url, 
    image.externalUrl,
    media[_type == "image"][0].asset->url,
    media[_type == "externalImage"][0].url
  ),
  "county": county->name,
  location,
  "district": district-> {
    _id,
    "name": name,
    "slug": slug.current,
    description,
    "photos": photos[].asset->url
  },
  details,
  propertyType,
  shortDescription,
  longDescription,
  googleMapsUrl,
  amenities,
  size,
  sizeSqm,
  bedrooms,
  bathrooms,
  yearBuilt,
  listingType,
  ownerVetted,
  floorNumber,
  facingDirection,
  dailyRate,
  viewCount,
  virtualTourUrl,
  "developer": developer->{name, "slug": slug.current, "logoUrl": coalesce(logo.asset->url, logo.externalUrl), website},
  media[] {
    ...,
    _type == "image" => {
      "url": asset->url
    },
    _type == "externalImage" => {
      "url": url
    }
  },
  verificationDocuments[] {
    ...,
    _type == "file" => {
      "url": asset->url,
      "originalFilename": asset->originalFilename
    },
    _type == "image" => {
      "url": asset->url
    }
  },
  "similarProperties": *[_type == "property" && _id != ^._id] | order(_createdAt desc) [0...4] {
    _id,
    title,
    "slug": slug.current,
    price,
    googleMapsUrl,
    "imageUrl": coalesce(
      image.asset->url, 
      image.externalUrl,
      media[_type == "image"][0].asset->url,
      media[_type == "externalImage"][0].url
    ),
    "district": district->name,
    details,
    propertyType
  }
}`)

export const SITE_SETTINGS_QUERY = defineQuery(`{
  "general": *[_type == "generalSettings"][0],
  "brand": *[_type == "brandSettings"][0]{
    ...,
    "logoPrimary": logoPrimary.asset->url,
    "logoWhite": logoWhite.asset->url,
    "favicon": favicon.asset->url
  },
  "contact": *[_type == "contactSettings"][0]{
    ...,
    "registrationQrUrl": registrationQr.asset->url
  },
  "socials": *[_type == "socialSettings"][0]
}`)

/* Shared projection for every listing card across Buy, Sell and Stay. */
const LISTING_CARD_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  buildingName,
  listingType,
  price,
  dailyRate,
  "imageUrl": coalesce(
    image.asset->url,
    image.externalUrl,
    media[_type == "image"][0].asset->url,
    media[_type == "externalImage"][0].url
  ),
  "county": county->name,
  "district": district->name,
  location,
  "developer": developer->{name, "slug": slug.current},
  details,
  propertyType,
  shortDescription,
  amenities,
  size,
  sizeSqm,
  bedrooms,
  bathrooms,
  yearBuilt,
  ownerVetted,
  floorNumber,
  facingDirection,
  viewCount,
  virtualTourUrl
`

export const LISTINGS_BY_TYPE_QUERY =
  defineQuery(`*[_type == "property" && listingType == $listingType] | order(_createdAt desc) {
  ${LISTING_CARD_FIELDS}
}`)

/* Everything on the books, whichever section it belongs to. Powers the
   "View all properties" index. */
export const ALL_LISTINGS_QUERY =
  defineQuery(`*[_type == "property" && defined(slug.current)] | order(_createdAt desc) {
  ${LISTING_CARD_FIELDS}
}`)

export const TESTIMONIALS_QUERY = defineQuery(`*[_type == "testimonial"] | order(order asc) [0...6] {
  _id,
  quote,
  name,
  role,
  "portraitUrl": portrait.asset->url
}`)

export const DEVELOPERS_QUERY = defineQuery(`*[_type == "developer"] | order(order asc) {
  _id,
  name,
  "slug": slug.current,
  "logoUrl": coalesce(logo.asset->url, logo.externalUrl),
  website,
  summary,
  projectsDelivered
}`)

export const ABOUT_QUERY = defineQuery(`*[_type == "aboutPage"][0] {
  eyebrow,
  headline,
  standfirst,
  "heroImageUrl": coalesce(heroImage.asset->url, heroImage.externalUrl),
  "heroImageAlt": heroImage.alt,
  storyHeading,
  body,
  "storyImageUrl": coalesce(storyImage.asset->url, storyImage.externalUrl),
  "storyImageAlt": storyImage.alt,
  missionEyebrow,
  mission,
  "missionImageUrl": coalesce(missionImage.asset->url, missionImage.externalUrl),
  commitmentsHeading,
  commitments,
  galleryHeading,
  galleryIntro,
  gallery[] {
    "url": coalesce(asset->url, externalUrl),
    alt,
    caption
  },
  testimonialsHeading,
  partnersHeading,
  ctaHeading,
  ctaBody,
  ctaLinkLabel,
  ctaLinkHref
}`)

export const INSIGHTS_QUERY = defineQuery(`*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  category,
  excerpt,
  publishedAt,
  readingMinutes,
  "coverUrl": coalesce(coverImage.asset->url, coverImage.externalUrl)
}`)

export const INSIGHT_QUERY = defineQuery(`*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  category,
  excerpt,
  publishedAt,
  readingMinutes,
  "coverUrl": coalesce(coverImage.asset->url, coverImage.externalUrl),
  content
}`)

export const SEARCH_QUERY = defineQuery(`*[_type == "district"] {
  _id,
  name,
  "slug": slug.current,
  "properties": *[_type == "property" && district._ref == ^._id] {
    _id,
    title,
    "slug": slug.current,
    "imageUrl": coalesce(
      image.asset->url, 
      image.externalUrl,
      media[_type == "image"][0].asset->url,
      media[_type == "externalImage"][0].url
    )
  }
}`)

/* Buy, Sell and Stay page copy. Same shape for all three, so one query serves
   each of them with a different $type. */
export const SECTION_PAGE_QUERY = defineQuery(`*[_type == $type][0] {
  eyebrow,
  headline,
  intro,
  "heroImageUrl": coalesce(heroImage.asset->url, heroImage.externalUrl),
  listingsHeading,
  listingsEmptyTitle,
  listingsEmptyBody
}`)
