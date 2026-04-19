---
name: ddd-module-work
description: Use before adding or restructuring modules, services, repositories, handlers, or events.
---

# DDD Module Work

Read `docs/ARCHITECTURE.md` and `docs/AI_ENGINEERING.md`.

Rules:

- Domain types live in `domain/`.
- Use cases live in `application/`.
- Prisma lives in `infrastructure/`.
- HTTP validation/auth/rate limits live in `api/handlers/`.
- Events live in `events/`.
- Other modules import from `index.ts`, not internals.
- Browser code never imports application services or repositories.

