# Frontend Guidelines

Kollegan ERP UI is governed by `docs/DESIGN_SYSTEM.md`. This file is the short operating checklist for feature work.

## Required Reading

Before creating or refactoring non-login UI, read:

- `docs/AI_ENGINEERING.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/ai/UI_GENERATION_CHECKLIST.md`
- `docs/BRANDING_AND_THEMING.md` when branding, public offers, PDFs, emails, or themes are involved

## Route Structure

Major dashboard routes should converge toward:

```txt
src/app/(dashboard)/(shell)/feature/
  page.tsx
  loading.tsx
  error.tsx
  _api/
  _components/
  _containers/
  _dialogs/
  _panels/
  _store/
  _types/
```

`page.tsx` composes. Containers wire state. Components render. Panels and dialogs own workflow forms. API clients own HTTP calls.

## UI Rules

- Use shared UI primitives from `src/shared/ui`.
- Use `--ui-*` semantic tokens for color, radius, shadows, and state styling.
- Use Lucide icons in ERP screens unless explicitly approved.
- Build mobile-first and enhance upward.
- Keep ERP screens compact, scannable, and work-focused.
- Do not create nested cards, decorative ERP backgrounds, or marketing-style page sections.
- Do not hardcode raw Tailwind color families for business states.
- Do not invent page-local button, badge, input, table, panel, or toolbar systems.
- Keep Swedish UI copy in ERP screens.

## Density

Default density is compact. Comfortable density is reserved for setup flows, sparse forms, confirmations, and mobile touch accuracy.

## File Size

Hand-written production files must stay below 1000 lines unless approved in `docs/CODEBASE_CLEANUP_INVENTORY.md`.

Run:

```bash
npm run check:file-size
npm run check:file-size:all
```

