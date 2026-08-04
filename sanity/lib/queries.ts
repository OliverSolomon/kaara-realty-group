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
      details,
      propertyType
    }
  },
  "experienceVideo": *[_type == "experienceSection"][0]{
    ...,
    "fileUrl": videoFile.asset->url
  },
  "spotlightSection": *[_type == "spotlightSection"][0]{
    ...,
    featuredEvent-> {
      title,
      description,
      location,
      date,
      "imageUrl": image.asset->url,
      media[] {
        ...,
        _type == "image" => {
          "url": asset->url
        },
        _type == "externalImage" => {
          "url": url
        }
      }
    }
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

export const NEIGHBORHOOD_QUERY = defineQuery(`*[_type == "district" && slug.current == $slug][0] {
  _id,
  name,
  "slug": slug.current,
  "county": county->name,
  description,
  "mainImage": mainImage.asset->url,
  "photos": photos[].asset->url,
  amenities,
  schools,
  malls
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
  headline,
  standfirst,
  "heroImageUrl": coalesce(heroImage.asset->url, heroImage.externalUrl),
  body,
  mission,
  commitments
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
export const NEIGHBORHOODS_QUERY = defineQuery(`*[_type == "district"] {
  _id,
  name,
  "slug": slug.current,
  boundary,
  "properties": *[_type == "property" && district._ref == ^._id] {
    _id,
    title,
    "slug": slug.current,
    price,
    "imageUrl": coalesce(image.asset->url, image.externalUrl),
    googleMapsUrl,
    "district": district->name,
    "county": county->name
  }
}`)
