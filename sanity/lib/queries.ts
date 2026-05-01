import { defineQuery } from 'next-sanity'

export const HOME_PAGE_QUERY = defineQuery(`*[_type == "homePage"][0]{
  heroVideo {
    title,
    subtitle,
    type,
    videoUrl,
    "fileUrl": videoFile.asset->url
  },
  secondaryVideo {
    title,
    subtitle,
    type,
    videoUrl,
    "fileUrl": videoFile.asset->url
  },
  tertiaryVideo {
    title,
    subtitle,
    type,
    videoUrl,
    "fileUrl": videoFile.asset->url
  },
  quaternaryVideo {
    title,
    subtitle,
    type,
    videoUrl,
    "fileUrl": videoFile.asset->url
  },
  featuredProperties[]-> {
    _id,
    title,
    buildingName,
    price,
    "imageUrl": image.asset->url,
    "county": county->name,
    "district": district->name,
    details,
    propertyType
  },
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
      }
    }
  }
}`)
