---
title: Capture WhatsApp leads by consent and run the admin workspace within free-tier limits
author: Oliver
date: 2026-11-23
branch: main
cost: { minutes: 90, tokens: 531290 }
id: l-cd3770fd
scope: repo
status: active
src: agent
touches:
  - app/(site)/HomeClient.tsx
  - app/(site)/buy/page.tsx
  - app/(site)/contact/page.tsx
  - app/(site)/layout.tsx
  - "app/(site)/market-insights/[slug]/page.tsx"
  - app/(site)/market-insights/page.tsx
  - app/(site)/properties/PropertiesClient.tsx
  - "app/(site)/properties/[slug]/PropertyDetailClient.tsx"
  - "app/(site)/properties/[slug]/page.tsx"
  - app/(site)/properties/page.tsx
---

## Decided
- Visitor phone numbers come only from the WhatsApp Business webhook when someone actually messages. Browsers and cookies do not expose them, and covertly identifying visitors would breach Kenya's Data Protection Act. Social profiles are recorded only when a person shares them.
- Scheduled posts run from a GitHub Actions job every 30 minutes using its OIDC identity, because Vercel Hobby cron runs once a day and a faster schedule would keep the free Neon database awake.
- The admin Content editor is generated from the Sanity schema with `npm run cms:schema`. It edits plain paragraphs and leaves rich Portable Text blocks untouched, so citations and links cannot be lost.

## Watch out
- Run `npm run cms:schema` after changing any Sanity schema.
- Keep `sharp` pinned to the version Next.js uses. Two copies crash image generation with a colourspace error.
- `ADMIN_ENCRYPTION_KEY` protects stored mailbox and social credentials. Changing it means reconnecting them.

In the code: `lib/whatsapp.ts`, `lib/social/publish.ts`, `.github/workflows/publish-posts.yml`, `lib/cms/server.ts`, `scripts/build-cms-schema.mjs`, `lib/mail/client.ts`.
