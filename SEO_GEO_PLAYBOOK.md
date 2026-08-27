# SEO & GEO Playbook

How this platform is built to win search — and what still has to happen outside the codebase.

Applies to **pavanirealtyco.com** and **kaararealtygroup.com**. Both repos now share the same SEO architecture.

---

## 1. The critical fix

Before this round, Pavani's `SITE_URL` fell back to `https://pavani.re` because `NEXT_PUBLIC_SITE_URL` was never set. That value feeds **every canonical tag, every sitemap URL, every Open Graph image and every JSON-LD `@id`**.

The live site was telling Google that the real version of each page lived on a different domain. That alone can keep a site out of the index almost entirely — no amount of content or backlinks overcomes a wrong canonical.

Fixed in code, but **you must also set it in Vercel** for both projects:

| Project | Variable | Value |
|---|---|---|
| Pavani | `NEXT_PUBLIC_SITE_URL` | `https://pavanirealtyco.com` |
| Kaara | `NEXT_PUBLIC_SITE_URL` | `https://kaararealtygroup.com` |

Set for Production, Preview and Development, then redeploy. Verify by viewing source on any page and checking `<link rel="canonical">`.

**Also decide www vs non-www and never serve both.** Pick one, 301 the other. Two reachable versions of the same page split your ranking signals in half.

---

## 2. What is now in the code

### Entity graph (both sites)
Every page carries a cross-referenced `@graph`:

- `Organization` / `RealEstateAgent` — the business, with a real postal address, phone, email and social profiles
- `WebSite` with `SearchAction`
- `BreadcrumbList` on every deep page

`RealEstateAgent` is the one that matters most for your stated goal. Queries like *"luxury property agents Nairobi"* or *"premium apartments Westlands"* are **local-intent** queries. Without a LocalBusiness node carrying an address and an explicit `areaServed`, a site is not even a candidate for them. Both sites now declare service areas covering Westlands, Kilimani, Karen, Muthaiga, Runda, Lavington, Riverside, Gigiri, Parklands, Spring Valley and more.

### Property listings
Each listing emits **two** nodes, deliberately:

- `Product` + `Offer` — carries the price into shopping and rich results
- `RealEstateListing` + `Residence` — carries the *meaning*: a home, with a bedroom count, floor area, amenities, and a `PostalAddress` with `addressLocality` (the suburb), `addressRegion` and `addressCountry: KE`

That address block is the single biggest lever for suburb queries. A page about a Karen villa without it is just a page with the word "Karen" on it. With it, it is a property, in Karen, in Nairobi County, in Kenya.

Coordinates are extracted automatically from the Google Maps URL pasted into Studio — so **paste a Maps link on every listing**. It costs nothing and adds `geo` coordinates to the structured data.

### Articles / blogs — indexed and citable
Every insight article now emits `BlogPosting` with:

- `abstract` — the TL;DR
- `citation[]` — built automatically from the sources cited inline while writing
- `speakable` — marks the summary as safe to read aloud or extract
- `wordCount`, `dateModified`, `articleSection`, `inLanguage: en-KE`
- `author` and `publisher` resolved to the Organization entity

Blogs are in both sitemaps with `lastModified` from Sanity, so new posts are discovered automatically. Nothing manual per post.

### AI / answer-engine optimisation (GEO)

Research finding that shaped the build: **roughly 44% of LLM citations come from the first 30% of a page's text.** That is precisely where the new TL;DR and Key Takeaways panels sit. The reading-experience work and the GEO work are the same work.

Also shipped:

- **`/robots.txt`** explicitly allows `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `anthropic-ai`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`, `Bingbot`, `Amazonbot`, `CCBot`, `cohere-ai` and `Meta-ExternalAgent`. Many sites block these by default at the CDN and quietly vanish from AI answers.
- **`/llms.txt`** on both domains — the emerging llmstxt.org convention. A plain-language map of the business generated live from Sanity: who you are, where you operate, every listing **grouped by suburb** with price and bed count, every article with its TL;DR, and the FAQ answers. When an assistant is asked "who sells luxury property in Nairobi?", this is what lets it answer with specifics instead of guessing.
- **Visible FAQs backed by `FAQPage` markup.** Visible is not optional — Google ignores FAQ markup with no on-page counterpart and can issue a manual action for it. Answer engines quote the visible prose, so each answer is written to stand alone without needing the question for context.

---

## 3. What you must do outside the code

Code is maybe 30% of ranking. The rest is below.

### Immediate — this week

1. **Set `NEXT_PUBLIC_SITE_URL` in Vercel** for both projects (see §1). Nothing else matters until this is done.
2. **Google Search Console** — add both domains, verify by DNS, submit `sitemap.xml`. Then use *URL Inspection → Request Indexing* on your top 10 listing pages and the properties index.
3. **Bing Webmaster Tools** — same. Bing is small in Kenya but it feeds **ChatGPT's web search**, so it matters far more than its market share suggests.
4. **Google Business Profile** — create/claim one for each brand. Real Nairobi address, correct category (*Real Estate Agency*), phone, hours, photos. This is the highest-leverage single action for "near me" and suburb queries, and it is free.
   - The name, address and phone must match your site's footer **exactly, character for character**. Inconsistent NAP is the most common local-SEO own goal.
5. **Fix the `.tif` cover image** on the Golden Mansion listing — browsers cannot render TIFF, so that card is broken for users *and* the image is invisible to search.

### Rotate this now
The `SANITY_API_READ_TOKEN` was printed to the terminal during this session. Rotate it in Sanity → API → Tokens.

### Content — the next 90 days

This is what actually beats BuyRentKenya and Property24. They win on **volume of indexed location pages**, not on design.

6. **Build a landing page per suburb.** `/neighborhoods/karen`, `/neighborhoods/westlands`, and so on. Each needs 600+ words of genuinely useful copy: what the area is like, price ranges, who lives there, schools, commute times, security profile, and the live listings you have there. Pavani already has the `district` schema and route — populate it. This is the single biggest content gap.
7. **Publish market insights on a schedule.** One substantial piece a month beats six thin ones. Use the new blocks: TL;DR, Key Takeaways, figures panels, inline citations. Cite real sources — KNBS, Central Bank of Kenya, Knight Frank, Cytonn, Hass Consult. Sourced statistics are what get quoted by AI engines.
8. **Answer real questions.** "Can foreigners buy land in Kenya?", "What is Ardhisasa?", "Stamp duty on property in Kenya", "Off-plan vs ready property". These are high-intent, low-competition, and they are exactly what people ask assistants.
9. **Internal linking.** Use the new internal-link annotation in the editor to link articles to listings and suburbs. Link every listing to its suburb page. This is free ranking equity that most Kenyan sites ignore entirely.

### Authority — ongoing

10. **Get listed and cited.** Business Daily, Nation, The Star, Kenyan Wall Street, Property Reporter Kenya. A single quote in a national outlet with a link outweighs fifty directory submissions.
11. **Directories that matter in Kenya**: Google Business Profile, Bing Places, Apple Business Connect, Yelp, and the Kenya Property Developers Association if eligible. Consistent NAP everywhere.
12. **Wikidata entry** for each brand. Free, and it is a primary source for how AI systems resolve entities. Genuinely underrated.
13. **Do list on the portals.** Counter-intuitive, but BuyRentKenya and Property24 listings carry backlinks and are themselves scraped by AI crawlers. Use them for reach; keep your site as the canonical source with the richer page.

### Measurement

14. Track in Search Console: impressions and average position for *"luxury properties in Kenya"*, *"premium properties Kenya"*, and each suburb + property-type combination.
15. Test your AI visibility monthly — literally ask ChatGPT, Perplexity, Claude and Gemini *"who are the best luxury real estate agents in Nairobi?"* and see whether you appear. That is the GEO scoreboard.
16. Validate structured data after each deploy: [Rich Results Test](https://search.google.com/test/rich-results) and [Schema Markup Validator](https://validator.schema.org/).

---

## 4. Honest expectations

Ranking first for *"properties in Kenya"* is a 6–18 month project, not a deploy. The technical foundation is now genuinely ahead of the Kenyan market — most local competitors have no `RealEstateListing` markup, no LocalBusiness entity, no `llms.txt`, and actively block AI crawlers.

But the portals beat you on two things code cannot fix: **listing volume** and **domain age**. You beat them on depth, trust signals and being answerable by AI. That means suburb pages, cited research, and verified listings — items 6 through 9 above.

The GEO window is the real opportunity. AI citation patterns are still forming and are far less entrenched than Google's rankings. A focused operator can break into that rotation now in a way that will be much harder in two years.

---

## 5. Sources

- [RESO Data Dictionary](https://www.reso.org/data-dictionary/) — the international standard for property data fields, which informed the amenity vocabulary and listing schema
- [Kenya Property Centre](https://kenyapropertycentre.com/) — reference for how amenities are described in the Kenyan market (borehole, DSQ, backup generator, electric fence)
- [Generative Engine Optimization: 2026 Guide](https://www.enrichlabs.ai/blog/generative-engine-optimization-geo-complete-guide-2026) — source of the 44%-of-citations-from-first-30% finding and the crawler-access guidance
- [Getting cited by ChatGPT, Claude & Perplexity](https://www.tooljunction.io/guides/get-cited-by-chatgpt-perplexity) — llms.txt conventions and citation mechanics
- [SEO for Real Estate Websites in Kenya](https://axiomwebsolution.com/seo-for-real-estate-websites-in-kenya/) — local market context
