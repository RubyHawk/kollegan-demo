# Frontend Guidelines

Kollegan ERP UI should be mobile-ready, dense where needed, and consistent across offers, projects, companies, products, templates, settings, and dashboards.

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

## Layout

Standard dashboard layout:

```txt
Page header
→ toolbar/filter row
→ main content
→ optional side panel/dialog
```

Breakpoints:

- mobile: default
- tablet: `md`
- desktop: `lg`
- wide: `xl`/`2xl`

Build mobile-first, then enhance upward. No critical workflow may require hover or desktop-only controls.

## Density

Supported internal UI density modes:

- `comfortable`
- `compact`

Density can affect app rows, card padding, toolbar spacing, and table cells. It must not affect public offers, PDFs, or emails.

## Visual System

- Use `src/shared/ui` primitives.
- Use Phosphor icons.
- Use semantic CSS variables.
- Do not hardcode business-state colors.
- Avoid nested cards.
- Avoid decorative gradients/orbs in ERP workflows.
- Swedish UI copy in ERP screens.

## File Size

Hand-written production files must stay below 1000 lines unless approved in `docs/CODEBASE_CLEANUP_INVENTORY.md`.

Run:

```bash
npm run check:file-size
npm run check:file-size:all
```

