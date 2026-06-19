---
name: public-site-ui
description: Use before creating or changing the public marketing website (Fluffy's) under src/app/site/ — its pages, sections, components, fluffys-public*.css styling, hero/menu-board, public-site branding, logo, hero imagery, or OG/SEO metadata. NOT the ERP dashboard (use frontend-ui-guidelines) and NOT public offers, PDFs, emails, or company branding (use branding-theme-work).
---

# Public Marketing Site UI

Governs the public marketing website surface only: `src/app/site/` (currently branded as Fluffy's).
This is a separate design language from the ERP dashboard and from the offer/PDF/email branding.
Codify and extend the current "roadside diner" language — do not redesign it.

Read:

- `docs/PUBLIC_SITE_DESIGN.md` — the design language, tokens, CSS architecture, and guardrails.
- `docs/AI_ENGINEERING.md` — before any SEO/metadata, CSP, or architecture-adjacent change.
- `docs/DESIGN_SYSTEM.md` — reference only for the shared accessibility/contrast targets (the ERP
  `--ui-*` token model does NOT apply to this surface).

Checklist:

- Keep every selector scoped under `.fluffy-public`; use the `--fp-*` tokens as the only token system.
- Preserve the roadside-diner character: warm paper + ink, torn-paper edges, taped ticket cutouts,
  scribble underlines, Archivo Black display type. Extend the look; do not flatten it.
- One concern per `fluffys-public-*.css` file; extend the existing files rather than forking new ones,
  and import any new file in `src/app/site/layout.tsx`.
- Do not import ERP `--ui-*` tokens, Tailwind utilities, or `src/shared/ui` primitives onto this
  surface. User theme/font preferences must not alter the public site.
- Content is live portal data with demo/empty fallbacks (`force-dynamic`): layouts must tolerate
  variable-length names, descriptions, prices, and missing images without overlap or clipping.
- Build mobile-first; keep the primary call/booking action reachable on mobile.
- Meet WCAG AA contrast (see `docs/DESIGN_SYSTEM.md`), keep visible `focus-visible`, honor
  `prefers-reduced-motion`, and keep touch targets ≥44px.
- Keep copy in Swedish (sv-SE).
- Keep hand-written files under the 1000-line limit; run `npm run check:file-size`.
