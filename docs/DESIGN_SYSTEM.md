# Quiet ERP Design System

This is the source of truth for non-login Kollegan ERP UI. Login/auth visuals, public offers, PDFs, emails, and signing surfaces stay separate unless a task explicitly includes them.

## Principles

- Quiet ERP: dense, calm, predictable, and optimized for repeated operational work.
- OKLCH semantic tokens are the color source of truth.
- Shared primitives own visual behavior; pages compose workflows.
- Color is never the only state indicator.
- Brand color is used sparingly for primary actions, focus, selected state, and key navigation state.
- New UI must be accessible, mobile-ready, and reusable by Claude Code/Codex.

## OKLCH Token Model

Tokens live in `src/shared/design-tokens/`:

- `ui-light.css`
- `ui-dark.css`
- `ui-aliases.css`
- `index.css`

Use `--ui-*` tokens in new UI. Existing `--surface`, `--accent`, `--text-primary`, and status variables are compatibility aliases only.

Required semantic roles:

```txt
--ui-bg
--ui-surface
--ui-surface-subtle
--ui-surface-raised
--ui-surface-hover
--ui-surface-active
--ui-surface-selected
--ui-border
--ui-border-subtle
--ui-border-strong
--ui-text
--ui-text-secondary
--ui-text-muted
--ui-text-disabled
--ui-text-inverse
--ui-accent
--ui-accent-hover
--ui-accent-active
--ui-accent-subtle
--ui-accent-border
--ui-focus
--ui-success-*
--ui-warning-*
--ui-danger-*
--ui-info-*
```

Light and dark themes must define the same token names. Dark theme is structurally equivalent: matching hue families, inverted lightness ranges, and comparable chroma intent.

OKLCH adjustment rules:

- Hover changes lightness by 2-4 points and chroma by at most 0.01.
- Active states use a stronger lightness change than hover.
- Selected states use accent hue with low-chroma background plus border or check/rail indicator.
- Semantic colors stay muted but readable; badge text must meet contrast rules.
- Operational neutrals keep chroma low, normally at or below `0.018`, to avoid lavender/pastel drift.
- Do not introduce arbitrary hex, RGB, HSL, or one-off OKLCH values in components.

Example:

```css
:root {
  --ui-bg: oklch(0.965 0.006 255);
  --ui-surface: oklch(0.995 0.002 255);
  --ui-border: oklch(0.835 0.012 255);
  --ui-text: oklch(0.185 0.018 255);
  --ui-accent: oklch(0.55 0.17 250);
  --ui-success-bg: oklch(0.94 0.045 150);
  --ui-success-text: oklch(0.34 0.115 150);
}
```

## Accessibility

Minimum contrast:

- Primary text: 4.5:1 minimum, 7:1 target.
- Muted content text: 4.5:1 minimum.
- Disabled text/icons: 3:1 target plus disabled affordance.
- Icons: 3:1 minimum.
- Functional borders around controls, inputs, tables, and panels: 3:1 target.
- Focus ring: 3:1 against both component and surrounding surface.
- Buttons and badges: 4.5:1 text contrast.

Interaction:

- Every interactive primitive exposes visible `focus-visible`.
- Focus uses `--ui-focus`, 2px ring plus 2px offset or equivalent.
- Hover, active, focus, selected, disabled, loading, error, warning, and success states must be distinct.
- Disabled elements use native disabled where possible; otherwise use `aria-disabled`, blocked interaction, and disabled tokens.
- Table hover, focused row, selected row, and disabled row must be visually distinguishable.
- State must include text, icon, border, checkmark, rail, or label; color alone is not enough.

## Libraries

Use existing project libraries deliberately:

- Radix UI provides accessible behavior for dialog, select, switch, tooltip, alert dialog, label, and progress.
- shadcn-style components are internal primitives, not page-level copy-paste sources.
- Tailwind v4 handles layout, spacing, sizing, display, responsive variants, and token mappings.
- CVA controls primitive and composed variants.
- `cn` from `src/shared/lib/utils.ts` combines `clsx` and `tailwind-merge`.
- Zod is the schema source.
- React Hook Form plus `@hookform/resolvers` drives canonical form validation.
- TanStack Table powers canonical `DataTable`.
- Framer Motion is allowed for functional motion only and must respect reduced motion.
- Native Tailwind v4 CSS configuration is preferred over `tw-colors` for v1.

## Icons

Lucide is the default ERP icon library.

- Icons must use Lucide only unless explicitly approved.
- Default size: 16px.
- Toolbar/action icons: 16px.
- Sidebar icons: 18px.
- Empty-state icons: 24px max.
- Stroke width: 1.75 or 2, consistently.
- Icons inherit text color via `currentColor`.
- Do not use icon-specific colors except semantic status indicators.
- Do not mix Lucide with Phosphor, Heroicons, Font Awesome, or custom SVGs in ERP screens.
- Filled, duotone, decorative, or illustrative icons are not allowed in operational UI.
- Existing Phosphor/custom SVG usage in login/auth can remain until auth is explicitly brought into scope.

## Component Layers

Tokens:

- Color, spacing, radius, type, shadow, motion, and z-index.

Primitives:

- `Button`, `Input`, `Textarea`, `Select`, `Switch`, `Badge`, `Panel`, `Tooltip`, `Dialog`, `Skeleton`.
- Own accessibility defaults, state styling, variants, sizes, and density.

Composed:

- `PageHeader`, `Toolbar`, `StatusBadge`, `FormField`, `EmptyState`, `InlineAlert`, `Pagination`.
- Compose primitives and stay domain-free.

Workflow:

- `DataTable`, `KanbanBoard`, `KpiStrip`, `ActivityFeed`, `FilterBar`, `BatchActionBar`, `CommandSearch`.
- Accept typed data/config and callbacks. They do not import repositories, Prisma, or application services.

Templates:

- Dashboard, list workflow, kanban workflow, detail page, dialog/form, and settings section.
- Pages choose a template and compose feature containers.

Page-specific one-off UI is allowed only when it is truly domain-specific and cannot be represented by an existing layer.

## State And Variants

Every interactive component must account for:

```txt
default, hover, active, focus-visible, selected, disabled, loading, error, warning, success
```

Button variants:

```txt
primary, secondary, ghost, danger, compact, icon-only, loading, disabled
```

Badge variants:

```txt
neutral, success, warning, danger, info, accent
```

Panel variants:

```txt
base, subtle, raised, selected, warning, danger, info
```

Table defaults:

```txt
row height: 40px compact, 48px comfortable
header height: 40px
sticky header: default for scroll regions
empty state: canonical EmptyState
loading state: skeleton rows
selected row: selected bg plus check/rail
focused row: visible focus outline/ring
pagination: canonical footer
```

## Density

Default density is compact:

```txt
spacing: 4, 8, 12, 16, 20, 24, 32
radius: 4 small, 6 controls, 8 panels/dialogs
button: 36 compact, 40 default, 44 mobile touch
input: 36 compact, 40 default, 44 mobile touch
toolbar: 44 desktop, 48 mobile
table rows: 40 compact, 48 comfortable
KPI strip item: 72-88 desktop
icons: 16 default, 18 sidebar, 24 max empty state
```

Use comfortable density for setup flows, sparse forms, confirmations, and mobile touch accuracy. Do not use comfortable density to make dashboards feel like marketing pages.

## Templates

Dashboard:

```txt
PageHeader
KpiStrip
Main action queue/table
Activity/context panel
Secondary analytics below
```

List workflow:

```txt
PageHeader
Toolbar
Status tabs
DataTable
Pagination or BatchActionBar
```

Kanban workflow:

```txt
PageHeader
Toolbar
KanbanBoard
Mobile grouped list or horizontal stages
```

Detail page:

```txt
Back link + status + title + actions
Workflow progress
Main facts Panel
Next step Panel
Related DataTable
ActivityFeed
```

Dialog/form:

```txt
DialogHeader
FormField grid
Inline validation
DialogFooter
```

## Checks

Run relevant checks after UI work:

```bash
npm run lint
npm run typecheck
npm run test
npm run check:file-size
```

