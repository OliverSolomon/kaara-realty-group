# Kaara & Co Realty Group - Content Studio Guide

For non-technical editors. It explains how to change every part of the website.
No coding required. The studio is organised the same way as the Pavani studio,
so if you know one you know the other.

---

## 1. Where to edit

Open `https://http://kaararealtygroup.com/studio` and sign in. Change a field, then press
**Publish** (bottom right). Until you press Publish your change is a private
draft and does not appear on the live site.

---

## 2. How the studio is organised

The left sidebar mirrors the website, top to bottom.

### Pages

The words on each page, page by page.

- **Home Page**
  - **1 · Hero Video** - the looping background video at the very top, plus its
    headline and subtitle.
  - **2 · Secondary Video** - the second full screen video and its heading.
  - **3 · The Next Move Is Yours** - the featured properties row. Two things
    live here:
    - **Filter Chips** - the row of categories under the heading. Each chip has
      a label and a rule: match one or more **property types** (Warehouses,
      Villas, Apartments…), show **everything**, or show everything **under a
      price ceiling** in Kenyan shillings. Drag to reorder; the first chip is
      selected when the page loads. Empty the list to hide the row entirely.
    - **Properties to Showcase** - pick up to eight properties. Photos, prices
      and locations are pulled from each property record, so nothing is typed
      twice.
    - **Button Label** - the wording on the button under the grid.
  - **4 · Experience Video** and **5 · Closing Video** - the remaining two full
    screen videos and their headings.
- **Buy Page**, **Sell Page**, **Stay Page** - each has a **Hero** tab (small
  label, headline, intro paragraph, hero photograph) and a **Listings block**
  tab (the heading above the units, and the message shown when nothing is
  listed). Leave the hero photograph empty and the page uses the first listing
  photo instead.
- **World of Kaara** - the about narrative, mission and commitments.

### Market Insights

Your articles. Headline, category, short summary, cover image, publish date.
Newest first.

### Listings

Your inventory, split the way the website is split:

- **Buy - Active Listings**
- **Sell - Resale Units**
- **Stay - Short Stay Units**
- **All Listings** - everything in one list

Pressing **Create** inside one of these three lists starts a listing that is
already tagged for that section. You never have to remember which radio button
to tick.

### Developer Partners, Testimonials, Locations

- **Developer Partners** - name, logo and summary. The partnership wall on Buy
  and World of Kaara turns on once there is at least one.
- **Testimonials** - client quotes shown on World of Kaara.
- **Locations** - Districts and Counties. Optional; used by search and by the
  map. A listing does not need them (see below).

### Settings

Change once, updates everywhere: General (site name, SEO, default currency),
Brand Assets (logos, favicon), Contact Details (phone, WhatsApp, address,
registration and QR), Social Links.

---

## 3. Adding a resale unit or a short stay unit

This is the quick path. Four fields and you are live.

1. **Listings → Sell - Resale Units** (or **Stay - Short Stay Units**) →
   **Create**.
2. **Property Title** - what the unit is called.
3. **Slug** - press **Generate**. That is the page address.
4. **Main Property Image** - upload the photo, or paste a link into *External
   Image URL*. Add more shots under **Property Media** if you have them.
5. **Location** - type it as you want it to read on the card, e.g.
   `Westlands, Nairobi`. County and District above are optional; the Location
   field alone is enough.
6. **Price** - the amount and the currency (KSh by default). For a short stay,
   fill **Daily Rate** instead; the card then reads "… a night".
7. **Publish**.

The unit appears immediately in the grid on the Sell or Stay page, and in the
**All Properties** list at `/properties`.

Optional extras that improve the card: bedrooms, bathrooms, size in square
metres, amenities, and **Owner Vetted** on a resale (this shows the jade
"Owner vetted" badge). For a short stay, Floor Number and Facing Direction
appear on the card.

---

## 4. What visitors can do with a listing

- **All Properties** (`/properties`) — every listing in one place, with search,
  section tabs, property type chips, a minimum bedrooms filter, a maximum price
  slider and sorting by price. The type chips only offer types your inventory
  actually contains, so the list never offers a dead end. Buy, Sell and Stay
  each carry a **View all properties** button through to it.
- **Currency** — the picker in the top navigation sets the currency for the
  **whole site**: the home page grid, every listing card, listing pages, the
  price filter and the repayment estimator all re-price instantly, and the
  choice is remembered on the visitor's next visit. Supported: KES, USD, GBP,
  EUR, AED.

  Rates are mid-market — the same kind Google quotes — read hourly through
  `/api/rates`, which tries the jsDelivr currency API first and
  open.er-api.com second. If both are unreachable the site falls back to the
  shipped figures and the converter says the rates are indicative rather than
  live.
- **Language** — the picker sets English, Arabic or Chinese for the site's
  interface wording: navigation, buttons, filters, listing card labels, footer.
  Arabic switches the whole page to right-to-left, and prices reformat to the
  chosen language's number conventions. **Listing and page copy written in the
  Studio is not translated** — it appears in whichever language you typed it.
- **Floor area** — square metres to square feet, both directions.
- **Repayments** — a mortgage estimator on Buy, Sell and every listing that is
  for sale, computed in shillings and displayed in the visitor's chosen
  currency. It does not appear on short stays.

---

## 5. Common tasks

- **Add a property to the home page row:** Pages → Home Page →
  3 · The Next Move Is Yours → Properties to Showcase.
- **Rename or reorder a filter chip:** same document, Filter Chips.
- **Add a new category chip (e.g. Townhouses):** Filter Chips → Add item →
  label it, choose *Property types*, tick Townhouse.
- **Change a page's headline:** Pages → Buy / Sell / Stay Page → Hero tab.
- **Change phone, WhatsApp or address:** Settings → Contact Details.
- **Swap a logo:** Settings → Brand Assets.
- **The footer QR code:** a code is generated and shipped at
  `public/registration-qr.svg`, pointing at the website. It links to the
  registration verification page as soon as you fill in **Settings → Contact
  Details → Registration URL**. To use an official regulator-issued code
  instead, upload it under the same settings document and it replaces the
  generated one automatically.

---

## 6. For the developer

- Schemas live in `sanity/schemaTypes/`; studio navigation in
  `sanity/structure.ts`; the "create in this section" template is registered in
  `sanity.config.ts`.
- Page singletons: `heroSection`, `secondarySection`, `propertiesSection`,
  `experienceSection`, `closingSection`, `buyPage`, `sellPage`, `stayPage`,
  `aboutPage`.
- After schema changes: `npx sanity schema deploy`, and `npx sanity deploy` if a
  hosted studio is in use.
