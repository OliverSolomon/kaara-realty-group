# Sanity Content Migration Guide

This guide provides instructions on how to migrate the existing hardcoded static content (like photos, videos, property listings, and search regions) in `app/page.tsx` into the newly integrated Sanity CMS.

## 1. Entering Data in the Sanity Studio

First, you need to populate your Sanity dataset with your current content.

1. Start your local development server: `npm run dev`
2. Navigate to your local Studio: [http://localhost:3000/studio](http://localhost:3000/studio)
3. You will see new Document Types: **Properties**, **Search Regions**, and **Home Page**.
4. **Create Regions**: Recreate each of your `SEARCH_REGIONS` (e.g., NAIROBI, MOMBASA) in the Studio. Upload the corresponding Unsplash images and list out the districts.
5. **Create Properties**: Create a "Property" document for "The Amethyst", "Symphony Residence", etc., providing their titles, prices, and uploading their images.
6. **Configure the Home Page**: Create a single "Home Page" document. Upload your MP4 files (or provide the Cloudinary URLs if you add a string field for URLs) for `heroVideo`, `secondaryVideo`, and `tertiaryVideo`. Select the properties you created to be the `featuredProperties`.

## 2. Fetching Data in `app/page.tsx`

Once your data is in Sanity, you need to pull it into your frontend.

First, define your GROQ query to fetch the home page and referenced properties/regions. Add this to your file (or a `queries.ts` file):

```typescript
import { defineQuery } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

export const HOME_PAGE_QUERY = defineQuery(`
  {
    "homePage": *[_type == "homePage"][0]{
      "heroVideoUrl": heroVideo.asset->url,
      "secondaryVideoUrl": secondaryVideo.asset->url,
      "featuredProperties": featuredProperties[]->{
        _id,
        title,
        details,
        price,
        "imageUrl": image.asset->url
      }
    },
    "regions": *[_type == "region"]{
      _id,
      name,
      districts,
      "imageUrl": image.asset->url
    }
  }
`);
```

## 3. Updating `app/page.tsx` component

Change your `Home` component to fetch this data dynamically rather than relying on hardcoded arrays.

### Important React Server Components Refactoring
Since `app/page.tsx` currently has `"use client"` at the very top, you cannot use `async/await` directly in it to fetch from Sanity without turning it into a Server Component. 

**Recommended approach:**
1. Rename your current `app/page.tsx` to `components/HomeClient.tsx` and ensure it has `"use client"`.
2. Create a new `app/page.tsx` (without `"use client"`).
3. In the new `page.tsx`, fetch the data from Sanity.
4. Pass the fetched data as props to `<HomeClient initialRegions={regions} homePageData={homePageData} />`.

```tsx
// app/page.tsx
import HomeClient from "@/components/HomeClient";
import { sanityFetch } from "@/sanity/lib/live";
import { HOME_PAGE_QUERY } from "@/sanity/queries";

export default async function Home() {
  const { data } = await sanityFetch({ query: HOME_PAGE_QUERY });
  
  return <HomeClient initialRegions={data?.regions} homePageData={data?.homePage} />;
}
```

## 4. Replacing Hardcoded Values

Inside your `HomeClient` component, replace the hardcoded values with the passed props.

**Example for Regions:**
Instead of mapping over the hardcoded `SEARCH_REGIONS`, map over `initialRegions`:
```tsx
{initialRegions.map((region, idx) => (
  // ...
))}
```

**Example for Videos:**
```tsx
<video autoPlay loop muted playsInline>
  <source src={homePageData?.heroVideoUrl || "/videos/amethyst.mp4"} type="video/mp4" />
</video>
```

**Example for Properties:**
```tsx
{homePageData?.featuredProperties?.map((property) => (
  <div key={property._id}>
    <Image src={property.imageUrl} alt={property.title} fill />
    {/* ... */}
  </div>
))}
```

## Summary

By migrating to this pattern, all text, images, and videos on the Kaara Realty Group landing page will be entirely manageable from the Sanity Studio!
