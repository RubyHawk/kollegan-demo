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
| Tracked files scanned | 926 |
| Source files scanned | 739 |
| Active production source files | 658 |
| Files above 1000 lines | 0 |
| Files above 500 lines | 3 |
| API route files | 113 |
| API v1 route files | 77 |
| Canonical v1 API families | 77 |
| Approved non-versioned API families | 36 |
| Temporary API route overlaps | 0 |
| Duplicate-removal API families | 0 |
| Feature API clients | 21 |
| Legacy API compatibility wrappers | 0 |
| Demo API routes | 14 |
| Public/integration API routes | 22 |
| Retained non-versioned API routes | 36 |
| Literal legacy `/api/*` references outside route files | 40 |
| Dead-candidate review rows | 0 |

## Current Monolith Inventory

_None._

## Files Above 500 Lines

| Lines | Classification | File |
| --- | --- | --- |
| 617 | active-production | `src/app/(dashboard)/(shell)/installningar/sakerhet/sakerhet-client.tsx` |
| 517 | active-production | `scripts/lib/plan-status.mjs` |
| 513 | active-production | `.github/workflows/quality-gates.yml` |

## Dead-Candidate Review Queue

_None._

## Feature API Client Inventory

These are browser-facing API contract wrappers. They are active infrastructure even before every UI screen has migrated to them.

| File |
| --- |
| src/shared/lib/api/announcements.api.ts |
| src/shared/lib/api/auth-account.api.ts |
| src/shared/lib/api/auth-security.api.ts |
| src/shared/lib/api/auth-session.api.ts |
| src/shared/lib/api/branding.api.ts |
| src/shared/lib/api/calendar.api.ts |
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

## Legacy API Compatibility Wrapper Review Queue

These are compatibility or alias routes kept while browser, mobile, and external callers migrate away from legacy `/api/*` paths. They are not junk until usage proves they can be retired.

_None._

## API Route Lifecycle Audit

Product API families should converge on one canonical `/api/v1/**` surface. Any temporary legacy/V1 overlap must be registered in `scripts/api-route-overlaps.json` with a flag key, owner, reason, and expiry date; otherwise it is a duplicate-removal candidate.

### Canonical V1 API Families

| Family | Route |
| --- | --- |
| `/api/admin/access-review` | `/api/v1/admin/access-review` |
| `/api/admin/compliance/controls` | `/api/v1/admin/compliance/controls` |
| `/api/admin/compliance/controls/[id]/evidence` | `/api/v1/admin/compliance/controls/[id]/evidence` |
| `/api/admin/compliance/evidence/collect` | `/api/v1/admin/compliance/evidence/collect` |
| `/api/admin/compliance/policies` | `/api/v1/admin/compliance/policies` |
| `/api/admin/compliance/policies/[id]` | `/api/v1/admin/compliance/policies/[id]` |
| `/api/admin/compliance/report` | `/api/v1/admin/compliance/report` |
| `/api/admin/compliance/risks` | `/api/v1/admin/compliance/risks` |
| `/api/admin/compliance/risks/[id]` | `/api/v1/admin/compliance/risks/[id]` |
| `/api/announcements` | `/api/v1/announcements` |
| `/api/announcements/[id]` | `/api/v1/announcements/[id]` |
| `/api/auth/change-password` | `/api/v1/auth/change-password` |
| `/api/auth/dev-login` | `/api/v1/auth/dev-login` |
| `/api/auth/login` | `/api/v1/auth/login` |
| `/api/auth/logout` | `/api/v1/auth/logout` |
| `/api/auth/mfa/backup-codes` | `/api/v1/auth/mfa/backup-codes` |
| `/api/auth/mfa/backup-codes/regenerate` | `/api/v1/auth/mfa/backup-codes/regenerate` |
| `/api/auth/mfa/disable` | `/api/v1/auth/mfa/disable` |
| `/api/auth/mfa/enable` | `/api/v1/auth/mfa/enable` |
| `/api/auth/mfa/recovery/reset` | `/api/v1/auth/mfa/recovery/reset` |
| `/api/auth/mfa/setup` | `/api/v1/auth/mfa/setup` |
| `/api/auth/mfa/status` | `/api/v1/auth/mfa/status` |
| `/api/auth/mfa/verify` | `/api/v1/auth/mfa/verify` |
| `/api/auth/profile` | `/api/v1/auth/profile` |
| `/api/auth/refresh` | `/api/v1/auth/refresh` |
| `/api/auth/register` | `/api/v1/auth/register` |
| `/api/auth/sessions` | `/api/v1/auth/sessions` |
| `/api/auth/webauthn/authenticate/options` | `/api/v1/auth/webauthn/authenticate/options` |
| `/api/auth/webauthn/authenticate/verify` | `/api/v1/auth/webauthn/authenticate/verify` |
| `/api/auth/webauthn/credentials` | `/api/v1/auth/webauthn/credentials` |
| `/api/auth/webauthn/credentials/[id]` | `/api/v1/auth/webauthn/credentials/[id]` |
| `/api/auth/webauthn/register/options` | `/api/v1/auth/webauthn/register/options` |
| `/api/auth/webauthn/register/verify` | `/api/v1/auth/webauthn/register/verify` |
| `/api/calendar/events` | `/api/v1/calendar/events` |
| `/api/companies` | `/api/v1/companies` |
| `/api/companies/[id]` | `/api/v1/companies/[id]` |
| `/api/companies/[id]/members` | `/api/v1/companies/[id]/members` |
| `/api/feature-flags` | `/api/v1/feature-flags` |
| `/api/feature-flags/[id]` | `/api/v1/feature-flags/[id]` |
| `/api/feature-flags/[id]/audit` | `/api/v1/feature-flags/[id]/audit` |
| `/api/feature-flags/evaluate` | `/api/v1/feature-flags/evaluate` |
| `/api/kunder` | `/api/v1/kunder` |
| `/api/kunder/[id]` | `/api/v1/kunder/[id]` |
| `/api/leads` | `/api/v1/leads` |
| `/api/leads/[id]` | `/api/v1/leads/[id]` |
| `/api/leads/[id]/activities` | `/api/v1/leads/[id]/activities` |
| `/api/leads/[id]/convert` | `/api/v1/leads/[id]/convert` |
| `/api/leverantorer` | `/api/v1/leverantorer` |
| `/api/leverantorer/[id]` | `/api/v1/leverantorer/[id]` |
| `/api/meetings` | `/api/v1/meetings` |
| `/api/meetings/[id]` | `/api/v1/meetings/[id]` |
| `/api/messages/conversations` | `/api/v1/messages/conversations` |
| `/api/messages/conversations/[id]/messages` | `/api/v1/messages/conversations/[id]/messages` |
| `/api/offers` | `/api/v1/offers` |
| `/api/offers/[id]` | `/api/v1/offers/[id]` |
| `/api/offers/[id]/pdf` | `/api/v1/offers/[id]/pdf` |
| `/api/offers/bulk-send` | `/api/v1/offers/bulk-send` |
| `/api/offers/counts` | `/api/v1/offers/counts` |
| `/api/offers/products` | `/api/v1/offers/products` |
| `/api/offers/products/[id]` | `/api/v1/offers/products/[id]` |
| `/api/offers/products/categories` | `/api/v1/offers/products/categories` |
| `/api/offers/products/categories/[id]` | `/api/v1/offers/products/categories/[id]` |
| `/api/org/email-settings` | `/api/v1/org/email-settings` |
| `/api/org/notification-recipients` | `/api/v1/org/notification-recipients` |
| `/api/projekt` | `/api/v1/projekt` |
| `/api/projekt/[id]` | `/api/v1/projekt/[id]` |
| `/api/projekt/[id]/advance` | `/api/v1/projekt/[id]/advance` |
| `/api/projekt/[id]/details` | `/api/v1/projekt/[id]/details` |
| `/api/projekt/[id]/purchase-orders` | `/api/v1/projekt/[id]/purchase-orders` |
| `/api/projekt/[id]/purchase-orders/[poId]/receive` | `/api/v1/projekt/[id]/purchase-orders/[poId]/receive` |
| `/api/projekt/[id]/purchase-orders/[poId]/submit` | `/api/v1/projekt/[id]/purchase-orders/[poId]/submit` |
| `/api/projekt/counts` | `/api/v1/projekt/counts` |
| `/api/staff` | `/api/v1/staff` |
| `/api/templates` | `/api/v1/templates` |
| `/api/templates/[id]` | `/api/v1/templates/[id]` |
| `/api/templates/assets` | `/api/v1/templates/assets` |
| `/api/templates/preview` | `/api/v1/templates/preview` |

### Approved Non-Versioned API Families

| Family | Kind | Route |
| --- | --- | --- |
| `/api/ai/availability/check` | integration-or-ops-route | `/api/ai/availability/check` |
| `/api/ai/calendar/book` | integration-or-ops-route | `/api/ai/calendar/book` |
| `/api/ai/calendar/check` | integration-or-ops-route | `/api/ai/calendar/check` |
| `/api/ai/crm/update` | integration-or-ops-route | `/api/ai/crm/update` |
| `/api/ai/customer/get` | integration-or-ops-route | `/api/ai/customer/get` |
| `/api/ai/hotel-info` | integration-or-ops-route | `/api/ai/hotel-info` |
| `/api/ai/rooms/cancel` | integration-or-ops-route | `/api/ai/rooms/cancel` |
| `/api/ai/rooms/lock` | integration-or-ops-route | `/api/ai/rooms/lock` |
| `/api/ai/transcripts/start` | integration-or-ops-route | `/api/ai/transcripts/start` |
| `/api/cron/offers/expire` | integration-or-ops-route | `/api/cron/offers/expire` |
| `/api/cron/projects/backfill` | integration-or-ops-route | `/api/cron/projects/backfill` |
| `/api/demos/hotel/activities` | demo-api-route | `/api/demos/hotel/activities` |
| `/api/demos/hotel/activities/[id]` | demo-api-route | `/api/demos/hotel/activities/[id]` |
| `/api/demos/hotel/amenities` | demo-api-route | `/api/demos/hotel/amenities` |
| `/api/demos/hotel/amenities/[id]` | demo-api-route | `/api/demos/hotel/amenities/[id]` |
| `/api/demos/hotel/info` | demo-api-route | `/api/demos/hotel/info` |
| `/api/demos/hotel/restaurants` | demo-api-route | `/api/demos/hotel/restaurants` |
| `/api/demos/hotel/restaurants/[id]` | demo-api-route | `/api/demos/hotel/restaurants/[id]` |
| `/api/demos/hotel/rooms` | demo-api-route | `/api/demos/hotel/rooms` |
| `/api/demos/hotel/rooms/available` | demo-api-route | `/api/demos/hotel/rooms/available` |
| `/api/demos/hotel/rooms/book` | demo-api-route | `/api/demos/hotel/rooms/book` |
| `/api/demos/hotel/rooms/cancel` | demo-api-route | `/api/demos/hotel/rooms/cancel` |
| `/api/demos/hotel/rooms/confirm` | demo-api-route | `/api/demos/hotel/rooms/confirm` |
| `/api/demos/hotel/rooms/lock` | demo-api-route | `/api/demos/hotel/rooms/lock` |
| `/api/demos/hotel/seed` | demo-api-route | `/api/demos/hotel/seed` |
| `/api/docs` | integration-or-ops-route | `/api/docs` |
| `/api/docs/ui` | integration-or-ops-route | `/api/docs/ui` |
| `/api/health` | integration-or-ops-route | `/api/health` |
| `/api/n8n/crm` | integration-or-ops-route | `/api/n8n/crm` |
| `/api/n8n/leads` | integration-or-ops-route | `/api/n8n/leads` |
| `/api/offers/public/[token]` | public-document-route | `/api/offers/public/[token]` |
| `/api/offers/public/[token]/decline` | public-document-route | `/api/offers/public/[token]/decline` |
| `/api/offers/public/[token]/pdf` | public-document-route | `/api/offers/public/[token]/pdf` |
| `/api/offers/public/[token]/sign` | public-document-route | `/api/offers/public/[token]/sign` |
| `/api/offers/public/[token]/view` | public-document-route | `/api/offers/public/[token]/view` |
| `/api/sse` | integration-or-ops-route | `/api/sse` |

### Temporary Rollout Overlaps

_None._

### Duplicate-Removal Candidates

_None._

## Retained Non-Versioned API Routes

These are not part of the `/api/v1` migration target. They stay non-versioned because they are public document routes, demos, or infrastructure/integration endpoints.

| Kind | File |
| --- | --- |
| integration-or-ops-route | src/app/api/ai/availability/check/route.ts |
| integration-or-ops-route | src/app/api/ai/calendar/book/route.ts |
| integration-or-ops-route | src/app/api/ai/calendar/check/route.ts |
| integration-or-ops-route | src/app/api/ai/crm/update/route.ts |
| integration-or-ops-route | src/app/api/ai/customer/get/route.ts |
| integration-or-ops-route | src/app/api/ai/hotel-info/route.ts |
| integration-or-ops-route | src/app/api/ai/rooms/cancel/route.ts |
| integration-or-ops-route | src/app/api/ai/rooms/lock/route.ts |
| integration-or-ops-route | src/app/api/ai/transcripts/start/route.ts |
| integration-or-ops-route | src/app/api/cron/offers/expire/route.ts |
| integration-or-ops-route | src/app/api/cron/projects/backfill/route.ts |
| demo-api-route | src/app/api/demos/hotel/activities/[id]/route.ts |
| demo-api-route | src/app/api/demos/hotel/activities/route.ts |
| demo-api-route | src/app/api/demos/hotel/amenities/[id]/route.ts |
| demo-api-route | src/app/api/demos/hotel/amenities/route.ts |
| demo-api-route | src/app/api/demos/hotel/info/route.ts |
| demo-api-route | src/app/api/demos/hotel/restaurants/[id]/route.ts |
| demo-api-route | src/app/api/demos/hotel/restaurants/route.ts |
| demo-api-route | src/app/api/demos/hotel/rooms/available/route.ts |
| demo-api-route | src/app/api/demos/hotel/rooms/book/route.ts |
| demo-api-route | src/app/api/demos/hotel/rooms/cancel/route.ts |
| demo-api-route | src/app/api/demos/hotel/rooms/confirm/route.ts |
| demo-api-route | src/app/api/demos/hotel/rooms/lock/route.ts |
| demo-api-route | src/app/api/demos/hotel/rooms/route.ts |
| demo-api-route | src/app/api/demos/hotel/seed/route.ts |
| integration-or-ops-route | src/app/api/docs/route.ts |
| integration-or-ops-route | src/app/api/docs/ui/route.ts |
| integration-or-ops-route | src/app/api/health/route.ts |
| integration-or-ops-route | src/app/api/n8n/crm/route.ts |
| integration-or-ops-route | src/app/api/n8n/leads/route.ts |
| public-document-route | src/app/api/offers/public/[token]/decline/route.ts |
| public-document-route | src/app/api/offers/public/[token]/pdf/route.ts |
| public-document-route | src/app/api/offers/public/[token]/route.ts |
| public-document-route | src/app/api/offers/public/[token]/sign/route.ts |
| public-document-route | src/app/api/offers/public/[token]/view/route.ts |
| integration-or-ops-route | src/app/api/sse/route.ts |

## Literal Legacy API References Outside Route Files

These are literal `/api/*` strings outside route files. Not every row is a migration blocker: handler `Location` headers, proxy allowlists, and OpenAPI specs are expected. UI/shared rows are the main retirement blockers.

| Area | Location | Endpoint |
| --- | --- | --- |
| ui-route | `src/app/offerter/publik/[token]/_api/public-offer.api.ts:38` | `/api/offers/public/${token}${suffix}` |
| feature-ui | `src/modules/core/voice/ui/hooks/use-vapi.ts:147` | `/api/ai/hotel-info` |
| demo-client | `src/modules/demos/hotel/api/rooms.ts:16` | `/api/demos/hotel/rooms/book` |
| demo-client | `src/modules/demos/hotel/api/rooms.ts:20` | `/api/demos/hotel/rooms/cancel` |
| demo-client | `src/modules/demos/hotel/api/rooms.ts:24` | `/api/demos/hotel/rooms` |
| demo-client | `src/modules/demos/hotel/api/seed.ts:4` | `/api/demos/hotel/seed` |
| demo-client | `src/modules/demos/hotel/api/services.ts:7` | `/api/demos/hotel/${type` |
| demo-client | `src/modules/demos/hotel/api/services.ts:14` | `/api/demos/hotel/restaurants` |
| demo-client | `src/modules/demos/hotel/api/services.ts:19` | `/api/demos/hotel/restaurants` |
| demo-client | `src/modules/demos/hotel/api/services.ts:23` | `/api/demos/hotel/restaurants/${id}` |
| demo-client | `src/modules/demos/hotel/api/services.ts:27` | `/api/demos/hotel/restaurants/${id}` |
| demo-client | `src/modules/demos/hotel/api/services.ts:33` | `/api/demos/hotel/activities` |
| demo-client | `src/modules/demos/hotel/api/services.ts:38` | `/api/demos/hotel/activities` |
| demo-client | `src/modules/demos/hotel/api/services.ts:42` | `/api/demos/hotel/activities/${id}` |
| demo-client | `src/modules/demos/hotel/api/services.ts:46` | `/api/demos/hotel/activities/${id}` |
| demo-client | `src/modules/demos/hotel/api/services.ts:52` | `/api/demos/hotel/amenities` |
| demo-client | `src/modules/demos/hotel/api/services.ts:57` | `/api/demos/hotel/amenities` |
| demo-client | `src/modules/demos/hotel/api/services.ts:61` | `/api/demos/hotel/amenities/${id}` |
| demo-client | `src/modules/demos/hotel/api/services.ts:65` | `/api/demos/hotel/amenities/${id}` |
| demo-client | `src/modules/demos/hotel/api/services.ts:71` | `/api/demos/hotel/info` |
| demo-client | `src/modules/demos/hotel/domain/seed.entity.ts:1` | `/api/demos/hotel/seed` |
| feature-ui | `src/modules/demos/hotel/ui/hooks/use-hotel-sse.ts:23` | `/api/sse` |
| handler | `src/modules/supporting/offers/api/handlers/resource-location.ts:1` | `/api/v1` |
| openapi | `src/platform/api/openapi-ai-paths.ts:2` | `/api/ai/availability/check` |
| openapi | `src/platform/api/openapi-ai-paths.ts:46` | `/api/ai/rooms/lock` |
| openapi | `src/platform/api/openapi-ai-paths.ts:75` | `/api/ai/rooms/cancel` |
| openapi | `src/platform/api/openapi-ai-paths.ts:104` | `/api/ai/calendar/check` |
| openapi | `src/platform/api/openapi-ai-paths.ts:146` | `/api/ai/calendar/book` |
| openapi | `src/platform/api/openapi-ai-paths.ts:178` | `/api/ai/crm/update` |
| openapi | `src/platform/api/openapi-ai-paths.ts:213` | `/api/ai/customer/get` |
| openapi | `src/platform/api/openapi-ai-paths.ts:254` | `/api/ai/hotel-info` |
| openapi | `src/platform/api/openapi-ai-paths.ts:277` | `/api/ai/transcripts/start` |
| openapi | `src/platform/api/openapi-components.ts:67` | `/api/ai/crm/update` |
| proxy | `src/proxy.ts:12` | `/api/auth/` |
| proxy | `src/proxy.ts:14` | `/api/docs` |
| proxy | `src/proxy.ts:15` | `/api/demo/` |
| proxy | `src/proxy.ts:17` | `/api/ai/` |
| proxy | `src/proxy.ts:18` | `/api/n8n/` |
| proxy | `src/proxy.ts:21` | `/api/offers/public/` |
| proxy | `src/proxy.ts:36` | `/api/` |

## Rules

- No hand-written production source file may remain above 1000 lines after monolith-split phases unless listed as an approved exception here.
- CI warns above 500 lines and fails above 1000 lines for new or modified hand-written source files.
- Cleanup PRs must not include behavior changes.
- Demo files are not junk if they support demo routes.
- Feature API clients are not junk; wire them into UI clients over time.
- Legacy API compatibility wrappers are not junk until usage is verified gone.
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
