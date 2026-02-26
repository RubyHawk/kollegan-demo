# Domain Modules

This directory contains all domain modules organized by DDD classification.

## Layer Hierarchy

```
generic/      ← can import supporting + core
  └── hotel, team-hub, billing, analytics

supporting/   ← can import core only
  └── crm, leads, identity, offers, integrations

core/         ← ZERO external module dependencies
  └── automation, voice
```

## Dependency Rules (enforced by ESLint)
1. `core/*` CANNOT import from `supporting/*` or `generic/*`
2. `supporting/*` CANNOT import from `generic/*`
3. All modules communicate cross-domain via the event bus only
4. External API calls only via `infrastructure/adapters/*`
5. Each module exports ONLY its public API via `index.ts`

## Module Template
```
{layer}/{module}/
├── domain/          # Entities, value objects (no framework deps)
├── application/     # Use cases, services
├── infrastructure/  # Repositories, external adapters
├── api/             # Colocated route handlers + internal router
├── ui/              # Components, hooks, pages (client-side only)
├── events/          # Publishers + subscribers
└── index.ts         # PUBLIC API ONLY — never export internals
```

## Migration Status
Modules are currently in `src/features/` and migrating phase by phase.
See the full migration plan in `ARCHITECTURE.md`.
