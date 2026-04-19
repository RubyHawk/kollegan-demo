# Codebase Cleanup Inventory

Files are not deleted just because they look messy. They are inventoried, classified, verified, and removed in focused cleanup PRs.

## Classes

- `active-production`
- `active-demo`
- `legacy-referenced`
- `generated-or-cache`
- `test-only`
- `dead-candidate`
- `safe-to-delete`
- `approved-exception`

## Current Monolith Inventory

Measured from `origin/main` on 2026-04-19. Generated files are excluded.

| Lines | Classification | File |
|---:|---|---|
| 2885 | active-production | `src/app/offerter/publik/[token]/page.tsx` |
| 2796 | active-production | `src/app/(dashboard)/(shell)/offerter/page.tsx` |
| 2103 | active-production | `src/modules/supporting/offers/application/document-generator.ts` |
| 1657 | active-production | `src/app/(dashboard)/(shell)/mallar/_components/BlockSettingsSidebar.tsx` |
| 1061 | active-production | `src/modules/core/voice/ui/components/voice-contact.tsx` |
| 991 | active-production | `src/shared/ui/sidebar.tsx` |
| 937 | active-production | `src/app/(dashboard)/(shell)/_components/DashboardView.tsx` |
| 795 | active-demo | `src/modules/demos/hotel/ui/components/calendar-tab.tsx` |
| 847 | active-production | `src/app/(dashboard)/(shell)/mallar/_components/extensions/ImageNodeView.tsx` |
| 804 | active-production | `src/modules/supporting/offers/application/offer-pdf.ts` |
| 774 | active-production | `src/modules/supporting/offers/application/offers.service.ts` |
| 769 | active-production | `src/app/(dashboard)/(shell)/produkter/_components/products-page-client.tsx` |
| 665 | active-production | `src/app/(dashboard)/(shell)/installningar/utseende/page.tsx` |
| 635 | active-demo | `src/modules/demos/hotel/activity/components/activity-log.tsx` |
| 647 | active-production | `src/app/(dashboard)/(shell)/mallar/_components/DocumentCanvas.tsx` |
| 583 | active-production | `src/modules/supporting/offers/infrastructure/companies.repository.ts` |
| 564 | active-production | `src/modules/supporting/crm/ui/components/crm-tab.tsx` |
| 540 | active-production | `src/platform/api/openapi.ts` |
| 504 | active-production | `src/modules/supporting/offers/infrastructure/offers.repository.ts` |

## Rules

- No hand-written production source file may remain above 1000 lines after monolith-split phases unless listed as an approved exception here.
- CI warns above 500 lines and fails above 1000 lines for new or modified hand-written source files.
- Cleanup PRs must not include behavior changes.
- Demo files are not junk if they support demo routes.
- Legacy API wrappers are not junk until usage is verified gone.

## Approved Exceptions

None.
