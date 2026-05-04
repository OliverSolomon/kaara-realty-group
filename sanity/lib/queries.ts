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
  yearBuilt,
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
  yearBuilt,
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
  "contact": *[_type == "contactSettings"][0],
  "socials": *[_type == "socialSettings"][0]
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
