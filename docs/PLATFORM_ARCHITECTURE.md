# Platform Architecture

Kollegan platform architecture supports ERP modules, demos, AI-assisted engineering, and ISO/IEC 27001:2022 readiness evidence.

## Platform Responsibilities

- HTTP handler platform helpers.
- Shared API response helpers.
- Event bus and cross-module event delivery.
- Authentication and authorization primitives.
- Deployment/runtime integration points.
- Compliance and audit evidence support.

## ERP Vs Demo

ERP modules live under `src/modules/core`, `src/modules/supporting`, and `src/modules/generic`.

Demo code lives under `src/modules/demos` and demo routes. Demo naming must not leak into ERP domain models or shared platform vocabulary.

## Security And Evidence

Security readiness docs live under `docs/security`.

Engineering changes that affect migrations, access, releases, incidents, suppliers, AI usage, or secure development should update evidence links in `docs/security/AUDIT_EVIDENCE_INDEX.md`.

## Release Safety

High-risk changes should use progressive delivery:

- feature flag,
- owner,
- expiry,
- rollback path,
- audit event,
- cleanup PR after rollout.

Public offer and signing changes are always high-risk.

## Monolith Control

Hand-written production files above 1000 lines are not acceptable after the monolith split phases unless listed as approved exceptions in `docs/CODEBASE_CLEANUP_INVENTORY.md`.

