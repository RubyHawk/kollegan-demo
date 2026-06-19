# Public Marketing Site Design Language

The source of truth for the **public marketing website** (`src/app/site/`, currently branded as
Fluffy's). This is a deliberately distinct surface from the two other documented UIs:

| Surface | Skill | Doc | Tokens |
| --- | --- | --- | --- |
| ERP dashboard | `frontend-ui-guidelines` | `DESIGN_SYSTEM.md` | `--ui-*` OKLCH |
| Public offers / PDFs / emails, portal theming | `branding-theme-work` | `BRANDING_AND_THEMING.md` | `--accent`/branding |
| **Public marketing website** | `public-site-ui` | **this doc** | **`--fp-*`** |

The public site has its own look ("roadside diner": warm paper + ink, torn-paper edges, taped
ticket cutouts, heavy poster type). **Codify and extend this language — do not redesign it.** Quality
rules below (contrast, data-tolerance) are guardrails for staying in-language, not invitations to
restyle.

## Surface & boundary

- Lives under `src/app/site/`. Pages: `/` (`page.tsx`), `/meny`, `/om-oss`, `/kontakt`, `/boka`.
- Served via `APP_SURFACE=public` (combined mode when unset, for local dev). See
  `docs/FLUFFYS_GO_LIVE.md`.
- Host-based route prefix from `getPublicSiteRoutePrefix()` (`_lib/public-site-data.ts`): pretty URLs
  (`/meny`) on the public host, path-prefixed (`/site/meny`) elsewhere. Always build links with
  `publicSiteHref(routePrefix, path)` — never hardcode.
- The root layout (`src/app/layout.tsx`) sets `<html>`/`<body>` to `overflow-hidden`; the public site
  re-enables scrolling via `html:has(.fluffy-public)`. Keep `.fluffy-public` on the page `<main>`
  (set in `_components/site-shell.tsx`).
- Independent of ERP and offer surfaces. **User theme/font preferences must not affect the public
  site** (consistent with `BRANDING_AND_THEMING.md`).

## Design tokens

Defined on `.fluffy-public` in `src/app/site/fluffys-public.css`. This is the **only** token system
for the surface — do not pull in `--ui-*` or offer branding variables.

```txt
--fp-ink #090807        --fp-ink-soft #171412
--fp-paper #fbf3e6      --fp-paper-strong #fffaf0   --fp-paper-aged #efe0c9
--fp-orange #f28c00     --fp-orange-dark #bc5a00
--fp-purple #521a93     --fp-red #af1616            --fp-white #fffaf0
--fp-line / --fp-line-strong (ink alphas)
--fp-radius 8px         --fp-radius-small 6px
--fp-shadow-soft / --fp-shadow-card
--fp-ease cubic-bezier(0.2,0.75,0.2,1)
--fluffy-display-font (Archivo Black stack)
```

Contrast guardrail: orange (`--fp-orange`) reads only on **ink** backgrounds. On paper, use
`--fp-orange-dark` or `--fp-purple` for text so it meets AA.

## Typography

- **Display:** Archivo Black (`--fluffy-display-font`), self-hosted via `next/font/local` in
  `src/app/layout.tsx`. It ships a single black weight, so `font-synthesis-weight: none` is set —
  never rely on a faux-bold. Headlines are uppercase and tight.
- **Body:** Arial/Helvetica system stack.
- **Sizing:** fluid via `clamp()` (see `fluffys-public-type.css`).
- **Swedish diacritics:** titles use sub-1.0 `line-height`. When a heading can wrap to multiple lines,
  give it enough leading that Å/Ä/Ö rings/dots do not collide with the line above.

## Aesthetic devices

These are the surface's identity — keep them when adding sections:

- **Paper texture:** dot-grid `radial-gradient` over a warm paper gradient (the `.fluffy-public`
  background).
- **Torn-paper edges:** a `::before`/`::after` band masked with `/fluffys/paper-tear.svg`
  (`fluffys-public-home.css`, `fluffys-public-menu.css`). Used to transition between paper and ink
  bands.
- **Taped ticket cutouts:** notched corners via `clip-path` polygon + a tape strip `::before` +
  subtle `rotate()` (`fluffys-public-collage.css`, `.fluffy-ticket` in `-home.css`).
- **Scribble strokes:** `ScribbleStroke` underlines on titles and nav (`_components/scribble-stroke.tsx`).
- **Ink header/footer** with orange/purple accents and number badges.

## CSS architecture

- Plain CSS + custom properties. **No Tailwind, no CSS modules, no styled-components** on this surface.
- One concern per file, all imported in `src/app/site/layout.tsx`:

```txt
fluffys-public.css            root tokens, shell, header, sections, base cards, animations
fluffys-public-type.css       headlines, lede, buttons
fluffys-public-texture.css    decorative scribbles / tape / dashed overlays
fluffys-public-header.css     sticky header + mobile menu dropdown
fluffys-public-home.css       landing hero + dark info strip
fluffys-public-collage.css    floating menu-item cutouts
fluffys-public-menu.css       menu board, sticky category nav, item rows, prices
fluffys-public-menu-responsive.css   menu breakpoints + fixed mobile action bar
fluffys-public-hours.css      availability card + weekly hours
fluffys-public-footer.css     footer
fluffys-public-forms.css      reservation/contact form
```

- **Extend the matching file; do not fork new ones.** If a genuinely new concern needs a file, add it
  and import it in `layout.tsx`.
- Keep every selector scoped under `.fluffy-public`.

## Components & data model

- `_components/`: `site-shell` (header/footer wrapper), `site-footer`, `menu-list` (`MenuBoard`),
  `menu-category-nav` (scroll-spy), `menu-glyphs`, `opening-hours`, `availability-status`,
  `reservation-form`, `scribble-stroke`.
- `_lib/`: `public-site-data` (config, routing, metadata, fallback menu), `menu-visuals`,
  `opening-status`. Reuse these helpers (`addressLine`, `priceParts`, `menuItemParts`,
  `getOpeningStatus`) instead of re-deriving.
- Pages compose; components render. Icons are Lucide.
- **Content is live data:** `getSiteData()` calls `getPublicRestaurantSite(host)` with demo/empty
  fallbacks, and every page is `force-dynamic`. Names, descriptions, ingredient lists, prices, and
  images vary at runtime — **layouts must tolerate variable-length content and missing images without
  overlap or clipping.** Avoid fixed-pixel positioning that assumes specific text lengths.

## Responsive

Mobile-first; enhance upward. Breakpoints in use:

```txt
≤440px   smallest phone type scale
≤760px   mobile threshold — hide desktop nav; switch to hamburger
≥768px   two-column menu item lists + availability grid
≥980px   landing hero becomes two columns
≥1050px  header layout rearrange
≥1100px  three-column "Populärt" row
```

- Sticky header: 88px desktop / 76px mobile, with `scroll-padding-top` so anchor jumps clear it.
- `/meny` has a fixed mobile action bar (`.fluffy-mobile-actions`) with `env(safe-area-inset-bottom)`.
- Keep the primary call/booking action reachable on mobile.

## Accessibility

- Visible `focus-visible`: 3px `--fp-orange` outline + offset (set globally on `.fluffy-public`).
- Honor `prefers-reduced-motion` (the global reduce block must keep covering new animations).
- Touch targets ≥44px.
- WCAG AA contrast — reuse the numbers in `docs/DESIGN_SYSTEM.md` (primary text ≥4.5:1, large/icons
  ≥3:1). Avoid sub-0.7rem body text.
- Keep all copy in Swedish (sv-SE).

## Branding & SEO

- Identity: Fluffy's roadside brand — logo `/fluffys/favicon.svg`, tagline "Mat vid vägen". This is
  separate from offer/company branding (`BRANDING_AND_THEMING.md`).
- Page metadata comes from `siteMetadata()` in `_lib/public-site-data.ts`. Any SEO/metadata change is
  architecture-adjacent — read `docs/AI_ENGINEERING.md` first, and if adding inline structured data
  (JSON-LD) respect the CSP in `next.config.ts` (mirror the existing inline-script pattern).

## Do / Don't

| Do | Don't |
| --- | --- |
| Use `--fp-*` tokens, scoped under `.fluffy-public` | Pull in `--ui-*`, Tailwind, or `src/shared/ui` |
| Extend the matching `fluffys-public-*.css` file | Fork parallel/duplicate stylesheets |
| Keep torn-paper / ticket / scribble character | Flatten it into a generic template |
| Tolerate variable-length live data | Assume fixed text lengths / fixed-pixel layouts |
| Let user theme prefs stay out of the public site | Wire ERP theme switching into this surface |
| Keep AA contrast, focus, reduced motion, Swedish copy | Ship sub-0.7rem or orange-on-paper text |
