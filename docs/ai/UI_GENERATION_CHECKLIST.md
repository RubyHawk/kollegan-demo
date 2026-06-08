# UI Generation Checklist

Use this checklist before creating or refactoring non-login ERP UI.

## Required Context

- Read `docs/AI_ENGINEERING.md`.
- Read `docs/DESIGN_SYSTEM.md`.
- Read `docs/FRONTEND_GUIDELINES.md`.
- Read `docs/BRANDING_AND_THEMING.md` when branding, public offers, PDFs, emails, or themes are involved.

## Choose A Template

Pick exactly one default template before coding:

- Dashboard
- List workflow
- Kanban workflow
- Detail page
- Dialog/form
- Settings section

If none fits, explain why and promote the reusable part to `src/shared/ui`.

## Allowed Component Layers

Use these first:

- Primitives: `Button`, `Input`, `Textarea`, `Select`, `Switch`, `Badge`, `Panel`, `Tooltip`, `Dialog`, `Skeleton`.
- Composed: `PageHeader`, `Toolbar`, `StatusBadge`, `FormField`, `EmptyState`, `InlineAlert`, `Pagination`.
- Workflow: `DataTable`, `KanbanBoard`, `KpiStrip`, `ActivityFeed`, `FilterBar`, `BatchActionBar`, `CommandSearch`.

Do not create page-local versions of these components.

## Token Rules

- Use `--ui-*` tokens for colors, borders, focus, status, surfaces, radius, and shadows.
- Do not invent new hex, RGB, HSL, or OKLCH values inside components.
- Do not use raw Tailwind color families for business states.
- Existing `--surface`, `--accent`, and status aliases are migration compatibility only.

## Tailwind Rules

Allowed:

- Layout, grid, flex, spacing, sizing, typography size/weight, responsive variants, overflow, positioning.

Avoid:

- `bg-red-*`, `text-amber-*`, `border-green-*`, or similar state colors.
- Arbitrary radius such as `rounded-[22px]` in ERP UI.
- Arbitrary shadows in page code.
- Decorative gradients or background effects.

## Icon Rules

- Use Lucide icons only in ERP screens.
- Default size: 16px.
- Toolbar/action icons: 16px.
- Sidebar icons: 18px.
- Empty-state icons: 24px max.
- Stroke width: 1.75 or 2.
- Icons inherit `currentColor`.
- No filled, duotone, decorative, illustrative, Phosphor, Heroicons, Font Awesome, or custom SVG icons in ERP screens without explicit approval.

## Accessibility

Before finishing:

- Primary text meets 4.5:1 contrast minimum.
- Muted content text meets 4.5:1 contrast minimum.
- Buttons and badges meet 4.5:1 text contrast.
- Icons meet 3:1 contrast minimum.
- Focus ring is visible and uses `--ui-focus`.
- Color is not the only state indicator.
- Disabled state blocks interaction and is visually distinct.
- Keyboard focus, hover, active, and selected states are distinct.
- Mobile workflows do not depend on hover or desktop-only controls.

## Banned Patterns

```txt
raw Tailwind state colors
new arbitrary OKLCH/hex colors in components
new arbitrary radii or shadows
nested cards
decorative ERP backgrounds
page-local primitive styling
desktop-only critical workflows
Phosphor/Heroicons/Font Awesome/custom SVGs in ERP screens
filled, duotone, decorative, or illustrative icons
oversized marketing panels
```

## Before / After

Before:

```tsx
<button className="rounded-2xl bg-blue-500 px-6 py-3 text-white shadow-xl">
  Skapa
</button>
```

After:

```tsx
<Button>
  Skapa
</Button>
```

Before:

```tsx
<span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
  Aktiv
</span>
```

After:

```tsx
<StatusBadge tone="success">Aktiv</StatusBadge>
```

Before:

```tsx
<div className="rounded-3xl border bg-white p-6 shadow-lg">
  <div className="rounded-2xl border bg-slate-50 p-4">...</div>
</div>
```

After:

```tsx
<Panel>
  <section className="border-t border-[var(--ui-border)] pt-4">...</section>
</Panel>
```

## Final Self-Check

- I reused shared primitives.
- I selected a documented template.
- I used `--ui-*` or component variants for all state styling.
- I did not invent colors, radii, shadows, icons, or local component systems.
- I preserved existing behavior unless the task explicitly changed it.

