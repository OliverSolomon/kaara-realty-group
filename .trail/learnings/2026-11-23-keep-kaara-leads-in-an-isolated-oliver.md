---
title: Keep Kaara leads in an isolated database with allowlisted admin access
author: Oliver
date: 2026-11-23
branch: main
cost: { minutes: 79, tokens: 468784 }
id: l-8c76821b
scope: repo
status: active
src: agent
touches:
  - "app/(site)/properties/[slug]/PropertyDetailClient.tsx"
  - components/site/ContactActions.tsx
  - app/(site)/HomeClient.tsx
  - app/(site)/globals.css
  - app/(site)/layout.tsx
  - app/(site)/properties/PropertiesClient.tsx
  - components/Footer.tsx
  - components/Navbar.tsx
  - components/SearchOverlay.tsx
  - components/site/WhatsAppButton.tsx
---

## Decided
- Store leads in a dedicated Neon project in the Kaara organization, because other client accounts are also connected on this machine and customer data must stay separate.
- The website connects as the limited `kaara_app` role, with no delete access to leads and no access to `neon_auth`. Migrations use the owner role through `npm run db:migrate`.
- Admin access needs both a Neon Auth session and an address in `ADMIN_EMAILS`. Public sign-up stays disabled.
- An enquiry succeeds if either the database save or the email succeeds, so one outage cannot lose a lead.

## Tried and ruled out
- Reading email login codes from `neon_auth.verification` in tests does not work because the codes are hashed. Tests use a password account on a disposable branch.

## Watch out
- Changing Neon Auth config restarts the branch compute, so requests right after it can fail briefly.
- Use the `kaara` Neon CLI profile and the `~/.vercel-kaara` Vercel config. The default logins belong to WHRD-Hub.

In the code: `lib/leads.ts`, `lib/auth/admin.ts`, `db/migrations/`, `app/api/enquiry/route.ts`.
