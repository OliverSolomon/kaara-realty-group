# Website brief: what shipped, what still needs you

Built against `public/kaara_website_brief.docx`. Everything below is live in code and in the Sanity Studio at `/studio`.

## Navigation

Buy, Sell and Stay are the primary tabs. World of Kaara, Market Insights and Contact are secondary. The old combined `/properties` index is gone and now redirects to `/buy`; individual listings still live at `/properties/[slug]`.

## Sanity changes

`property` gained: `listingType` (buy / sell / stay), `developer` reference, `sizeSqm`, `bedrooms`, `bathrooms`, `virtualTourUrl`, `viewCount`, `ownerVetted` (sell only), `floorNumber`, `facingDirection`, `dailyRate` (stay only). Fields that only apply to one section hide themselves in the Studio.

New document types: `developer`, `testimonial`, `aboutPage`. `post` became Market Insight with category, excerpt, cover image and publish date. `contactSettings` gained WhatsApp, calling hours, registration name, registration number, registration QR and a verification link.

The Studio desk now splits listings into Buy / Sell / Stay lists.

## Three things I did not fill in, on purpose

**Testimonials.** The brief asks for three running testimonials and the rail is built and wired. I did not invent client quotes. Add three real ones under Testimonials and the section appears automatically on World of Kaara.

**Developer partners.** The brief says "the ones we are selling for include the following" and then the list is empty in the document. Send me the names and logos, or add them under Developer Partners, and the partnership wall on Buy and World of Kaara turns on.

**View counts.** The brief asks for view numbers under 250 "as there is safety and power in numbers." The field and the display are built, but I have not written numbers into it. Publishing invented engagement figures is the kind of thing that costs trust if a buyer ever asks how it is measured, and trust is the whole positioning. If you want it, use real recorded viewing numbers. If there is no counter yet, that is worth wiring to a real one before the field goes live.

## Also needs your input

- Real phone number, WhatsApp number and office address in Site Settings, Contact Details. Placeholders are in there now.
- Company registration number, the QR image and the verification link. Until the QR is uploaded the footer shows a dashed slot.
- Listing photography. Where a listing has no image the site falls back to seeded placeholder photography from picsum.photos.
- `MAILTRAP_API_KEY` in `.env.local`. All enquiry forms post to `/api/enquiry` and email kiragu@kaararealtygroup.com. Without the key the form tells the visitor to WhatsApp or call instead of failing silently.
- Exchange rates in `context/CurrencyContext.tsx` are indicative reference figures, and the UI says so. Swap `RATES_PER_USD` for a rates API when you contract one.

## Forms and tools

Currency converter covers KES, USD, GBP, EUR and AED, selected once and remembered site wide. Square metre to square foot conversion works in both directions and pre-fills from the listing.

Four enquiry flows, all with validation, error and success states: Buy listing pack with preferred calling time, Schedule a viewing, Check availability for short stays, and Virtual tour or consultation. WhatsApp and call buttons sit on every section page and every listing.

## Notes

The site is locked to one dark navy theme with a single jade accent used only for trust signals: vetting badges, active tabs, form success, WhatsApp. The property detail page was light themed and is now dark to match.

The working tree shows many files as modified that nobody edited. That is pre-existing line-ending noise in the checkout, not content. `git diff --ignore-all-space --stat` shows the 17 files that actually changed.
