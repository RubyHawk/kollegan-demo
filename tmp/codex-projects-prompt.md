# Codex Planning-Mode Prompt: "Projects" feature for kollegan-demo

> Copy everything below the divider into Codex running in planning mode. It is self-contained.

---

## Context

I run a Next.js 16 CRM-style webapp (`kollegan-demo`) for a solar-film installation business: we sell film, buy it from suppliers, and install it at customer sites. The **offer (quotation) subsystem is already complete** — customers receive an offer link, accept or decline it, and on acceptance the offer status flips to `accepted` and an `OFFER_ACCEPTED` event is fired. The **lead linked to the offer is auto-marked `won`**.

I now need the **"Project" subsystem** — the post-sales execution workflow that begins the moment an offer is accepted.

### What I want (happy path)

1. A new **"Projekt"** entry appears in the sidebar. Clicking it opens the projects workspace.
2. When a customer accepts an offer, a **Project is automatically created** from that offer, pre-filled with the accepted line items (product, qty, unit price, unit of measure) and linked to the Customer.
3. The project moves through **5 stages** (Swedish labels in parentheses):
   1. **Details** (`Uppgifter`) — I fill in install-specific customer details (address, square meters to film, vehicle/building info, access notes, install date wishes, on-site contact).
   2. **Ordered** (`Beställt`) — I've raised a purchase order to our supplier for the films needed. Project moves here when the PO is submitted.
   3. **Arrived** (`Ankommet`) — The supplier delivered; we now have the stock to do the job.
   4. **In progress** (`Pågår`) — Installation work is underway.
   5. **Completed** (`Klart`) — Job done, invoiced (out of scope for now), archived.
4. The project detail view shows: customer details, the accepted offer snapshot (line items with qty + unit), total amount, the purchase-order panel, a timeline/stage indicator, and a primary "advance to next stage" action.
5. Visually modern, enterprise-grade, matching the existing offer-system look and feel. Swedish UI throughout.

### Decisions already made (do NOT reopen)

- **Replace** the current `/projects` page entirely. Its generic CRUD (`active|review|planned|done|archived`) is unused and can be deleted. **Must not affect the offer system.**
- **Promote `Lead` into a full `Customer` model.** Create a new `crm_customers` table. When an offer is accepted, the lead is marked `won` AND converted into a customer (or linked to an existing one via email match). The `Lead.customerId` FK already exists in the schema — use it.
- **Full Purchase-Order model with supplier.** Create `PurchaseOrder` and `PurchaseOrderLineItem` tables plus a minimal `Supplier` table. A project has zero or many purchase orders; advancing from `details` → `ordered` requires at least one submitted PO.
- **5 stages exactly** as listed above. Hard-coded enum, no custom stages.

### Non-goals

- No invoicing/billing.
- No supplier API integrations — suppliers are entered manually.
- No scheduling/calendar integration beyond a "wished install date" text/date field.
- No mobile-specific UI work (the app is desktop-first).

## Codebase facts you must respect

### Architecture

- **DDD module layout**: business logic lives under `src/modules/{core,supporting,generic}/<feature>/{domain,application,infrastructure,api,events}`. HTTP route files in `src/app/api/**` are thin re-exports of handlers from the module's `api/handlers/*.handler.ts`.
- **Handlers** use `createHandler({ auth, tag, query|body: ZodSchema, rateLimit }, async (ctx) => …)`. Respond via `ok()`, `created()`, `noContent()`, or throw `ApiError`.
- **Repositories** in `infrastructure/` hold all Prisma calls. **Services** in `application/` orchestrate repos + events + cross-module imports (dynamic `import()` to avoid cycles).
- **Events** go through `eventBus.publish({ type, orgId, occurredAt, payload })`. Subscribers live in each module's `events/` folder and are wired up in `src/modules/*/index.ts`.
- **Multi-tenant**: every table has `organizationId`; every query filters by it. Soft deletes via `deletedAt`.
- **Prisma** uses **multi-file schema** under `prisma/schema/*.prisma`. Add a new file for new aggregates rather than overloading existing ones.
- **Path aliases** (see `tsconfig.json`): `@modules/*`, `@shared/*`, `@platform/*`, `@generated/*`.

### Reference implementation to mirror

The **offer module** is your template. Mirror its file structure and naming conventions exactly:

- `src/modules/supporting/offers/` — full DDD structure
- `src/modules/supporting/offers/application/offers.service.ts` — service patterns (esp. `acceptOffer` at ~line 582)
- `src/modules/supporting/offers/infrastructure/offers.repository.ts` — repository patterns
- `src/modules/supporting/offers/api/handlers/offer.handler.ts` — handler patterns with Zod
- `src/modules/supporting/offers/events/offer.events.ts` — event type constants
- `src/app/(dashboard)/(shell)/offerter/page.tsx` — list page with status tabs, search, slide-out form, drag-to-reorder
- `src/app/(dashboard)/(shell)/offerter/_components/*` — dialogs, cards
- `src/app/(dashboard)/(shell)/offerter/_store/*` — Zustand stores (`offers-form.store.ts`, `offers-list.store.ts`)

### UI / design system

- **TailwindCSS 4** with **CSS variables**: `var(--accent)`, `var(--surface)`, `var(--surface-alt)`, `var(--surface-hover)`, `var(--border)`, `var(--border-light)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`, `var(--status-*-bg)`, `var(--status-*-text)`. Always use these — never hardcode colors.
- **Radix primitives** + **shadcn-style components** in `src/shared/ui/` (`button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `tabs.tsx`, `badge.tsx`, `progress.tsx`, toast system). **Reuse these** — do not roll new primitives.
- **Icons**: Phosphor Icons React.
- **Animations**: Framer Motion (`AnimatePresence` for slide-outs and stage transitions).
- **Forms**: controlled inputs, `rounded-xl`/`rounded-2xl`, focus ring via `focus:border-[var(--accent)]`, `text-xs font-semibold` labels.
- **Empty states**, loading spinners, and error banners follow the patterns in `src/app/(dashboard)/(shell)/offerter/page.tsx` and the existing `projects/page.tsx` (copy the visual language, drop the CRUD logic).
- **Swedish labels everywhere in user-facing text.** Field names / identifiers in English.

### Sidebar

- `src/shared/ui/sidebar.tsx`, `NAV_CONFIG` constant around line 103. Add a **dropdown** entry under the `'Offertsystem'` section:

  ```
  { type: 'dropdown', key: 'projekt', label: 'Projekt', icon: <PhosphorBriefcase or similar>,
    items: [
      { href: '/projekt', label: 'Alla projekt' },
      { href: '/projekt?stage=uppgifter', label: 'Nya' },
      { href: '/projekt?stage=bestallt', label: 'Beställda' },
    ] }
  ```

  (use Swedish route `/projekt` — matches `offerter`, not the English `/projects`; migrate the folder.)

### Existing Project scaffold to replace

Delete or rewrite these — they are stubs that predate the real requirements:

- `prisma/schema/projects.prisma` (current status enum is wrong for our workflow)
- `src/modules/generic/projects/**` (keep the folder, rewrite the files)
- `src/app/(dashboard)/(shell)/projects/page.tsx` (replace; move to `projekt/page.tsx`)
- `src/app/api/projects/**` (replace; re-point to new handlers)

Verify nothing else in the codebase imports from these before removing.

### Current Lead → Customer promotion

- Existing: `prisma/schema/leads.prisma` has `Lead` with a dangling `customerId` field and no `Customer` table.
- Add `prisma/schema/customers.prisma` with `Customer` (crm_customers) — fields at minimum: `id, organizationId, name, email, phone, company, address, postalCode, city, country, notes, createdAt, updatedAt, deletedAt, convertedFromLeadId`.
- On `OFFER_ACCEPTED`, run an idempotent `upsertCustomerFromLead(leadId, offer)` that creates the customer if missing (match on `organizationId + email`) and back-fills `Lead.customerId`.

## Deliverable: your planning output

Produce a plan with the following sections. Do **not** write code yet — this is planning mode.

### 1. Data model

- Full Prisma schemas for new/changed tables: `Customer`, `Project` (rewritten, with stage enum, customerId, offerId, install-detail fields), `ProjectStageEvent` (audit trail of stage transitions), `Supplier`, `PurchaseOrder`, `PurchaseOrderLineItem`. Drop `ProjectTask` unless you have a real use for it.
- Show the stage enum: `details | ordered | arrived | in_progress | completed`.
- List every FK, index, and `@@map("<table>")`.
- Explain how line items from the accepted offer are copied into the project (snapshot vs live reference — recommend snapshot so post-accept offer edits don't mutate history).
- Migration strategy: since we're in demo phase, a single migration that drops the old `prj_*` tables and creates the new ones is fine.

### 2. Module structure

Lay out files to create under `src/modules/generic/projects/` and a new `src/modules/supporting/customers/` and `src/modules/supporting/procurement/` (suppliers + purchase orders). For each file, one-line purpose. Match offer-module naming exactly.

### 3. Service behaviors

For each service function, list: name, inputs, outputs, side effects, events fired. At minimum:

- `createProjectFromOffer(offerId, orgId)` — triggered by `OFFER_ACCEPTED` subscriber; snapshots line items; creates/links customer.
- `updateProjectDetails(projectId, orgId, installDetails)`.
- `advanceProjectStage(projectId, orgId, toStage, actorId)` — validates transitions (e.g. can't go to `ordered` without a submitted PO; can't go to `arrived` without all POs marked received).
- `createPurchaseOrder(projectId, orgId, supplierId, items)`, `markPurchaseOrderSubmitted`, `markPurchaseOrderReceived`.
- `upsertCustomerFromLead(leadId, offer)`.

Event constants to add: `PROJECT_CREATED`, `PROJECT_STAGE_ADVANCED`, `PROJECT_COMPLETED`, `PURCHASE_ORDER_SUBMITTED`, `PURCHASE_ORDER_RECEIVED`.

### 4. API surface

List every route (method + path) and its handler name, Zod schema shape, auth tag, rate limit. Example: `POST /api/projekt/[id]/advance → handleAdvanceProjectStage, body: { toStage: ProjectStage }`.

### 5. UI pages & components

- `/projekt` — list/board view. Decide: **kanban columns per stage** (recommended for this workflow) vs table with stage filter. Justify.
- `/projekt/[id]` — detail view with sections: stage timeline (horizontal stepper), customer details (editable in stage 1), offer snapshot (read-only line items with unit + qty), purchase orders panel, notes, activity log.
- Slide-out side-panel components for: editing customer details, creating a PO, recording PO receipt.
- Reuse `@shared/ui/*` primitives; reuse the STATUS_STYLE / CSS-variable patterns from the existing projects page and offer page.
- Sidebar change diff (exact lines to insert in `src/shared/ui/sidebar.tsx`).

### 6. State management

Which Zustand stores to add (e.g. `projects-list.store.ts` for filters, `project-detail.store.ts` for the detail view's optimistic updates). Follow the offer-store pattern.

### 7. Event wiring

Show the `OFFER_ACCEPTED` subscriber that calls `createProjectFromOffer`. Where it is registered (in `src/modules/generic/projects/index.ts`). Make it idempotent (creating twice is a no-op).

### 8. Visual / UX checklist (enterprise best practices)

Before finalizing the plan, **search the web** for current (2025–2026) enterprise B2B SaaS best practices for:

- Kanban-style pipeline UIs (look at Linear, Pipedrive, HubSpot Deals, Monday work-management).
- Multi-stage workflow indicators / horizontal steppers.
- Order-management UX patterns (procurement/PO screens).

Summarize 5–8 concrete design rules you'll apply (e.g. "primary CTA per stage," "stage transitions require explicit confirmation for backwards moves," "show blocking prerequisites inline," "use semantic color tokens for stage status not raw hex"). Cite your sources.

### 9. Verification plan

How I'll test end-to-end:

1. Accept an offer via the existing public signing flow → confirm a Project appears at stage `details` with correct line items + customer.
2. Fill install details → stage advances to `ordered` only after a PO is submitted.
3. Mark PO received → stage can advance to `arrived`.
4. Advance through `in_progress` → `completed`.
5. Sidebar shows "Projekt" and navigates correctly.
6. Existing offer flow (create, send, sign, decline) still works unchanged — run through it to confirm no regressions.
7. Type-check: `npx tsc --noEmit`. Lint: `npm run lint`. Unit tests: `npm test` (check `tests/` folder for relevant specs).

### 10. Risks & open questions

Call out anything ambiguous: PO partial receipts? Multiple POs per project? What happens if an accepted offer has no line items? What if the customer email matches two leads? Etc. For each risk propose a default behavior.

### Final output format

Return the plan as a single markdown document with those 10 numbered sections. Do not write code. Do not create files beyond the plan. When done, summarize in ≤5 bullets what you'll build first in implementation mode.
