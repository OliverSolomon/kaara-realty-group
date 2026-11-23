---
title: "Staff access uses owner env emails, database roles and per-item sharing"
author: Oliver
date: 2026-11-23
branch: main
cost: { minutes: 1, tokens: 3847 }
id: l-7709ee7c
scope: repo
status: active
src: agent
touches:
  - lib/auth/admin.ts
---

## Decided
- Owners live in the `ADMIN_EMAILS` environment variable and are always super admins; everyone else is in `staff_users`, read on each request so removal applies at once. A failed role lookup admits owners only.
- Neon Auth's staff API only works for sessions whose `neon_auth.user.role` is `admin`, so that login role must follow the app's super admin role.
- Co-editors get a per-item grant in `shared_items`. They can save drafts of that item but cannot publish, delete, list or re-share.
## Watch out
- Sharing is turn-based, not live. Article saves are refused on a stale revision and design saves merge by page.
In the code: `lib/auth/admin.ts`, `lib/auth/logins.ts`, `lib/auth/shares.ts`, `db/migrations/0006_staff_roles.sql`, `db/migrations/0007_sharing.sql`.
