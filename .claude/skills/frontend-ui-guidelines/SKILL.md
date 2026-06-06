---
name: frontend-ui-guidelines
description: Use before creating or refactoring dashboard pages, ERP forms, panels, tables, boards, settings sections, or responsive layouts.
---

# Frontend UI Guidelines

Read:

- `docs/AI_ENGINEERING.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/FRONTEND_GUIDELINES.md`
- `docs/ai/UI_GENERATION_CHECKLIST.md`
- `docs/BRANDING_AND_THEMING.md` when branding, public offers, PDFs, emails, or themes are involved

Checklist:

- Choose a documented template before coding.
- Build mobile-first and keep critical workflows available without hover.
- Use shared UI primitives and workflow components from `src/shared/ui`.
- Use `--ui-*` semantic tokens for color, radius, focus, and state styling.
- Use Lucide icons only in ERP screens unless explicitly approved.
- Keep page files as composition only.
- Split containers, components, panels, dialogs, store, API client, and types.
- Do not create nested cards, page-local primitive systems, arbitrary radii, decorative ERP backgrounds, or hardcoded business-state colors.
- Verify hover, active, focus-visible, selected, disabled, loading, error, warning, and success states where applicable.
- Run `npm run check:file-size`.
