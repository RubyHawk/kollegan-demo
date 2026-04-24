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
| Tracked files scanned | 857 |
| Source files scanned | 722 |
| Active production source files | 627 |
| Files above 1000 lines | 0 |
| Files above 500 lines | 0 |
| API route files | 121 |
| API v1 route files | 67 |
| Feature API clients | 20 |
| Legacy API compatibility wrappers | 19 |
| Demo API routes | 14 |
| Public/integration API routes | 21 |
| Retained non-versioned API routes | 35 |
| Literal legacy `/api/*` references outside route files | 45 |
| Dead-candidate review rows | 0 |

## Current Monolith Inventory

_None._

## Files Above 500 Lines

_None._

## Dead-Candidate Review Queue

_None._

## Feature API Client Inventory

These are browser-facing API contract wrappers. They are active infrastructure even before every UI screen has migrated to them.

| File |
| --- |
| src/shared/lib/api/announcements.api.ts |
| src/shared/lib/api/auth-account.api.ts |
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

| File |
| --- |
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
| src/app/api/crm/contacts/[id]/route.ts |
| src/app/api/crm/contacts/route.ts |

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
| handler | `src/modules/supporting/offers/api/handlers/company.handler.ts:159` | `/api/companies/${company.id}` |
| handler | `src/modules/supporting/offers/api/handlers/offer.handler.ts:151` | `/api/offers/${offer.id}` |
| handler | `src/modules/supporting/offers/api/handlers/offer.handler.ts:211` | `/api/offers/${dup.id}` |
| handler | `src/modules/supporting/offers/api/handlers/product-categories.handler.ts:92` | `/api/offers/products/categories/${category.id}` |
| handler | `src/modules/supporting/offers/api/handlers/product.handler.ts:87` | `/api/offers/products/${product.id}` |
| handler | `src/modules/supporting/offers/api/handlers/template.handler.ts:88` | `/api/templates/${template.id}` |
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
