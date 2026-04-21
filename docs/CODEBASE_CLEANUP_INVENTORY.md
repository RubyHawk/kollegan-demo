# Codebase Cleanup Inventory

Files are not deleted just because they look messy. They are inventoried, classified, verified, and removed in focused cleanup PRs.

This document is generated from the current checkout. Run:

```txt
npm run inventory:codebase:write
```

## Classes

- `active-production`
- `active-demo`
- `legacy-referenced`
- `generated-or-cache`
- `test-only`
- `dead-candidate`
- `safe-to-delete`
- `approved-exception`

## Inventory Method

- tracked file listing via `git ls-files`,
- line-count scan for hand-written source and docs,
- static import/export graph for TypeScript and JavaScript,
- Next.js route entry detection,
- module `index.ts` entry detection,
- demo/test/generated classification,
- legacy API wrapper classification.

Static analysis is a triage tool, not deletion proof. A `dead-candidate` still needs manual verification for dynamic imports, string routes, framework conventions, tests, public assets, Prisma references, and production usage.

## Snapshot Summary

| Metric | Count |
|---|---:|
| Tracked files scanned | 872 |
| Source files scanned | 739 |
| Active production source files | 564 |
| Files above 1000 lines | 0 |
| Files above 500 lines | 2 |
| Feature API clients | 18 |
| Legacy API wrappers | 111 |
| Dead-candidate review rows | 0 |

## Current Monolith Inventory

_None._

## Files Above 500 Lines

| Lines | Classification | File |
| --- | --- | --- |
| 677 | active-production | `src/modules/supporting/offers/application/offers.service.ts` |
| 635 | active-production | `src/modules/supporting/offers/infrastructure/companies.repository.ts` |

## Dead-Candidate Review Queue

_None._

## Feature API Client Inventory

These are browser-facing API contract wrappers. They are active infrastructure even before every UI screen has migrated to them.

| File |
| --- |
| src/shared/lib/api/announcements.api.ts |
| src/shared/lib/api/auth-account.api.ts |
| src/shared/lib/api/auth-session.api.ts |
| src/shared/lib/api/companies.api.ts |
| src/shared/lib/api/compliance.api.ts |
| src/shared/lib/api/customers.api.ts |
| src/shared/lib/api/feature-flags.api.ts |
| src/shared/lib/api/leads.api.ts |
| src/shared/lib/api/meetings.api.ts |
| src/shared/lib/api/messages.api.ts |
| src/shared/lib/api/offers.api.ts |
| src/shared/lib/api/procurement.api.ts |
| src/shared/lib/api/products.api.ts |
| src/shared/lib/api/projects.api.ts |
| src/shared/lib/api/reports.api.ts |
| src/shared/lib/api/settings.api.ts |
| src/shared/lib/api/staff.api.ts |
| src/shared/lib/api/templates.api.ts |

## Legacy API Wrapper Review Queue

These are compatibility wrappers and are not junk until client usage proves they can be retired.

| File |
| --- |
| src/app/api/admin/access-review/route.ts |
| src/app/api/admin/compliance/controls/[id]/evidence/route.ts |
| src/app/api/admin/compliance/controls/route.ts |
| src/app/api/admin/compliance/evidence/collect/route.ts |
| src/app/api/admin/compliance/policies/[id]/route.ts |
| src/app/api/admin/compliance/policies/route.ts |
| src/app/api/admin/compliance/report/route.ts |
| src/app/api/admin/compliance/risks/[id]/route.ts |
| src/app/api/admin/compliance/risks/route.ts |
| src/app/api/ai/availability/check/route.ts |
| src/app/api/ai/calendar/book/route.ts |
| src/app/api/ai/calendar/check/route.ts |
| src/app/api/ai/crm/update/route.ts |
| src/app/api/ai/customer/get/route.ts |
| src/app/api/ai/hotel-info/route.ts |
| src/app/api/ai/rooms/cancel/route.ts |
| src/app/api/ai/rooms/lock/route.ts |
| src/app/api/ai/transcripts/start/route.ts |
| src/app/api/announcements/[id]/route.ts |
| src/app/api/announcements/route.ts |
| src/app/api/auth/change-password/route.ts |
| src/app/api/auth/dev-login/route.ts |
| src/app/api/auth/login/route.ts |
| src/app/api/auth/logout/route.ts |
| src/app/api/auth/mfa/backup-codes/regenerate/route.ts |
| src/app/api/auth/mfa/backup-codes/route.ts |
| src/app/api/auth/mfa/disable/route.ts |
| src/app/api/auth/mfa/enable/route.ts |
| src/app/api/auth/mfa/setup/route.ts |
| src/app/api/auth/mfa/verify/route.ts |
| src/app/api/auth/profile/route.ts |
| src/app/api/auth/refresh/route.ts |
| src/app/api/auth/register/route.ts |
| src/app/api/auth/webauthn/authenticate/options/route.ts |
| src/app/api/auth/webauthn/authenticate/verify/route.ts |
| src/app/api/auth/webauthn/register/options/route.ts |
| src/app/api/auth/webauthn/register/verify/route.ts |
| src/app/api/calendar/events/route.ts |
| src/app/api/companies/[id]/members/route.ts |
| src/app/api/companies/[id]/route.ts |
| src/app/api/companies/route.ts |
| src/app/api/crm/contacts/[id]/route.ts |
| src/app/api/crm/contacts/route.ts |
| src/app/api/cron/offers/expire/route.ts |
| src/app/api/demos/hotel/activities/[id]/route.ts |
| src/app/api/demos/hotel/activities/route.ts |
| src/app/api/demos/hotel/amenities/[id]/route.ts |
| src/app/api/demos/hotel/amenities/route.ts |
| src/app/api/demos/hotel/info/route.ts |
| src/app/api/demos/hotel/restaurants/[id]/route.ts |
| src/app/api/demos/hotel/restaurants/route.ts |
| src/app/api/demos/hotel/rooms/available/route.ts |
| src/app/api/demos/hotel/rooms/book/route.ts |
| src/app/api/demos/hotel/rooms/cancel/route.ts |
| src/app/api/demos/hotel/rooms/confirm/route.ts |
| src/app/api/demos/hotel/rooms/lock/route.ts |
| src/app/api/demos/hotel/rooms/route.ts |
| src/app/api/demos/hotel/seed/route.ts |
| src/app/api/docs/route.ts |
| src/app/api/docs/ui/route.ts |
| src/app/api/feature-flags/[id]/audit/route.ts |
| src/app/api/feature-flags/[id]/route.ts |
| src/app/api/feature-flags/evaluate/route.ts |
| src/app/api/feature-flags/route.ts |
| src/app/api/health/route.ts |
| src/app/api/kunder/[id]/route.ts |
| src/app/api/kunder/route.ts |
| src/app/api/leads/[id]/activities/route.ts |
| src/app/api/leads/[id]/convert/route.ts |
| src/app/api/leads/[id]/route.ts |
| src/app/api/leads/route.ts |
| src/app/api/leverantorer/[id]/route.ts |
| src/app/api/leverantorer/route.ts |
| src/app/api/meetings/[id]/route.ts |
| src/app/api/meetings/route.ts |
| src/app/api/messages/conversations/[id]/messages/route.ts |
| src/app/api/messages/conversations/route.ts |
| src/app/api/n8n/crm/route.ts |
| src/app/api/n8n/leads/route.ts |
| src/app/api/offers/[id]/pdf/route.ts |
| src/app/api/offers/[id]/route.ts |
| src/app/api/offers/bulk-send/route.ts |
| src/app/api/offers/counts/route.ts |
| src/app/api/offers/products/[id]/route.ts |
| src/app/api/offers/products/categories/[id]/route.ts |
| src/app/api/offers/products/categories/route.ts |
| src/app/api/offers/products/route.ts |
| src/app/api/offers/public/[token]/decline/route.ts |
| src/app/api/offers/public/[token]/pdf/route.ts |
| src/app/api/offers/public/[token]/route.ts |
| src/app/api/offers/public/[token]/sign/route.ts |
| src/app/api/offers/public/[token]/view/route.ts |
| src/app/api/offers/route.ts |
| src/app/api/org/email-settings/route.ts |
| src/app/api/org/notification-recipients/route.ts |
| src/app/api/projects/[id]/route.ts |
| src/app/api/projects/route.ts |
| src/app/api/projekt/[id]/advance/route.ts |
| src/app/api/projekt/[id]/details/route.ts |
| src/app/api/projekt/[id]/purchase-orders/[poId]/receive/route.ts |
| src/app/api/projekt/[id]/purchase-orders/[poId]/submit/route.ts |
| src/app/api/projekt/[id]/purchase-orders/route.ts |
| src/app/api/projekt/[id]/route.ts |
| src/app/api/projekt/counts/route.ts |
| src/app/api/projekt/route.ts |
| src/app/api/sse/route.ts |
| src/app/api/staff/route.ts |
| src/app/api/templates/[id]/route.ts |
| src/app/api/templates/assets/route.ts |
| src/app/api/templates/preview/route.ts |
| src/app/api/templates/route.ts |

## Rules

- No hand-written production source file may remain above 1000 lines after monolith-split phases unless listed as an approved exception here.
- CI warns above 500 lines and fails above 1000 lines for new or modified hand-written source files.
- Cleanup PRs must not include behavior changes.
- Demo files are not junk if they support demo routes.
- Feature API clients are not junk; wire them into UI clients over time.
- Legacy API wrappers are not junk until usage is verified gone.
- A file may move from `dead-candidate` to `safe-to-delete` only after import graph, route strings, package scripts, tests, Prisma references, and public asset references have been checked.

## Approved Exceptions

None.

## Cleanup Workflow

1. Generate this inventory.
2. Pick a small batch of `dead-candidate` files.
3. Verify each file with import search, route search, package scripts, tests, Prisma schema, and public asset references.
4. Move confirmed files to `safe-to-delete` in a dedicated cleanup PR.
5. Delete only confirmed files.
6. Run typecheck, lint, tests, build, dependency checks, file-size checks, and manual smoke tests for affected flows.
