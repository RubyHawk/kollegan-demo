# Generic Domain Modules

Generic domains are vertical products built on top of core and supporting domains.
These represent specific business verticals or demo bounded contexts.

## Modules
- **hotel** — Hotel management vertical (rooms, bookings, services, amenities)
- **team-hub** — Team collaboration (announcements, meetings, workspace, integrations)
- **billing** — Subscription and payment management (planned)
- **analytics** — Usage analytics and reporting (planned)

## Demo Bounded Contexts
Demo verticals live under `demos/` and are fully isolated:
- **demos/hotel-demo** — Grand Hotel Kollegan AI demo (migrating from generic/hotel)

## Dependency Rule
Generic modules may import from:
- `@/modules/supporting/*` — via public index.ts only
- `@/modules/core/*` — via public index.ts only
- `@/infrastructure/*`
- `@/shared/*`

## Current Status
Modules are migrating from `src/features/` during Phase 5 of the architecture migration.
