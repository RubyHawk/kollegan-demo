# Supporting Domain Modules

Supporting domains enhance the value of core domains but are not the primary product.

## Modules
- **crm** — Contact management, call records, customer profiles
- **leads** — Lead pipeline, scoring, conversion tracking
- **identity** — Staff user management, authentication
- **offers** — Offer templates and management
- **integrations** — External service connectors (Slack, GitHub, N8N)

## Dependency Rule
Supporting modules may import from:
- `@/modules/core/*` — via public index.ts only
- `@/infrastructure/*`
- `@/shared/*`

Supporting modules CANNOT import from `@/modules/generic/*`.

## Current Status
Modules are migrating from `src/features/` during Phase 4 of the architecture migration.
