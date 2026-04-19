# Architecture

Kollegan is an ERP platform with DDD-style module boundaries. The architecture goal is to keep business rules in modules, HTTP contracts in handlers, and browser UI behind API clients.

## Layers

```txt
src/app/                 Next.js routing and presentation
src/app/api/             thin route wrappers
src/modules/             business modules
src/platform/            platform services and integration primitives
src/shared/              shared UI, hooks, utilities, and browser-safe helpers
prisma/schema/           database model definitions
```

## Module Shape

```txt
src/modules/supporting/feature/
  domain/
  application/
  infrastructure/
  api/handlers/
  events/
  index.ts
```

Rules:

- `domain/` owns business types and invariants.
- `application/` owns use cases and orchestration.
- `infrastructure/` owns Prisma and external persistence.
- `api/handlers/` owns HTTP auth, Zod validation, rate limits, and response shape.
- `events/` owns event constants and subscribers.
- `index.ts` is the public module contract.

## Dependency Rules

- Core modules may not depend on supporting, generic, or demo modules.
- Supporting modules may not depend on generic or demo modules.
- Generic ERP modules may use supporting/core contracts but not demo internals.
- ERP modules may not import demo modules.
- Shared code may not import feature/domain modules.
- Browser code may not import Prisma, repositories, or application services.

Dependency boundaries are enforced with dependency-cruiser and documented in `src/modules/README.md`.

## API Rules

`src/app/api/**/route.ts` files should thinly re-export handlers from modules.

New browser clients should use `/api/v1/**` through feature API clients. Legacy `/api/**` routes remain only as compatibility wrappers until usage is verified gone.

## Data Rules

All tenant-owned tables must include `organizationId` where applicable. Soft-deleted models must consistently filter by `deletedAt`.

Schema work must follow [Production data safety](PRODUCTION_DATA_SAFETY.md).

## UI Rules

Dashboard routes should converge toward:

```txt
page.tsx
loading.tsx
error.tsx
_api/
_components/
_containers/
_dialogs/
_panels/
_store/
_types/
```

See [Frontend guidelines](FRONTEND_GUIDELINES.md).

