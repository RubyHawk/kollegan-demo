# Core Domain Modules

Core domains contain the primary business logic that makes this platform valuable.

## Modules
- **automation** — Workflow engine: triggers, steps, execution, tool registry
- **voice** — AI voice agents (Vapi), real-time call handling, AI tools

## Dependency Rule
Core modules have ZERO dependencies on supporting or generic modules.
They may only import from:
- `@/infrastructure/*` — database, cache, events, external adapters
- `@/shared/*` — UI primitives, utilities, types

Cross-domain communication happens exclusively through the event bus
(`@/infrastructure/events/event-bus`).

## Current Status
Modules are migrating from `src/features/` during Phase 3 of the architecture migration.
Migration tracker: see `ARCHITECTURE.md` at project root.
