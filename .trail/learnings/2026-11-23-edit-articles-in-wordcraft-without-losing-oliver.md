---
title: Edit articles in WordCraft without losing citations or rich blocks
author: Oliver
date: 2026-11-23
branch: main
cost: { minutes: 19, tokens: 195879 }
id: l-249f8fe9
scope: repo
status: active
src: agent
touches:
  - db/migrations/0004_content_suite.sql
  - lib/mail/oauth.ts
  - lib/mail/client.ts
  - app/api/admin/mail/route.ts
  - "app/api/admin/mail/oauth/[provider]/start/route.ts"
  - "app/api/admin/mail/oauth/[provider]/callback/route.ts"
  - app/admin/(panel)/mail/MailApp.tsx
  - lib/cms/portable.ts
  - lib/cms/upload.ts
  - app/api/admin/upload/chunk/route.ts
---

## Decided
- Rich text edits go through WordCraft, converted to and from Portable Text. Citations use a private link marker, and images, callouts and other custom blocks travel as visible markers that are restored unchanged.
- Large uploads are sent in 3 MB parts through Postgres and assembled before going to Sanity, because one Vercel request is limited to 4.5 MB.

## Tried and ruled out
- Passing hosted images through WordCraft's HTML import: it reduces them to their alt text.
- Canvix's `@imgly/background-removal`: it is AGPL, so it must not be brought into Kaara or Sauti.

In the code: `lib/cms/portable.ts`, `app/admin/(panel)/content/[type]/[id]/WordEditorDialog.tsx`, `app/api/admin/upload/chunk/route.ts`.
