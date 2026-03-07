# Domain Modules

This directory contains all domain modules organized by DDD classification.

## Layer Hierarchy

```
demos/        ← can import any module, core, platform, shared
generic/      ← can import supporting + core
  └── dashboard, team-hub, projects, analytics, portal

supporting/   ← can import core only
  └── auth, identity, leads, crm, compliance, audit, offers,
      messaging, meetings, alerting, integrations

core/         ← ZERO external module dependencies
  └── automation, voice
```

## Dependency Rules (enforced by dependency-cruiser)
1. `core/*` CANNOT import from `supporting/*`, `generic/*`, or `demos/*`
2. `supporting/*` CANNOT import from `generic/*` or `demos/*`
3. `supporting/*` CANNOT import from other `supporting/*` modules (use event bus)
4. `platform/` CANNOT import from any module
5. All modules communicate cross-domain via the event bus only
6. External API calls only via `platform/` adapters
7. Each module exports ONLY its public API via `index.ts`

## Module Template
```
{layer}/{module}/
├── domain/          # Entities, value objects (no framework deps)
├── application/     # Use cases, services
├── infrastructure/  # Repositories, external adapters
├── api/             # Colocated route handlers
│   └── handlers/    # Handler functions (exported via index.ts)
├── ui/              # Components, hooks, pages (client-side only)
├── events/          # Publishers + subscribers
└── index.ts         # PUBLIC API ONLY — never export internals
```

## Route Pattern
Next.js App Router requires routes in `src/app/api/`. Each route file is a
**thin wrapper** that re-exports handler functions from the owning module:

```ts
// src/app/api/offers/route.ts
export { handleListOffers as GET, handleCreateOffer as POST } from '@modules/supporting/offers';
```

Business logic, validation schemas, and auth checks live in the module's
`api/handlers/` directory — not in the route file.
