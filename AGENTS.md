# Codex Instructions

Read [docs/AI_ENGINEERING.md](docs/AI_ENGINEERING.md) before making code, schema, API, security, public offer, signing, or architecture changes.

Core rules:

- Start with `git status`.
- Treat existing offers, projects, companies, products, users, signatures, and customer data as production data.
- Do not create destructive migrations without explicit approval, backup, rollback plan, and evidence entry.
- Keep DDD boundaries: Prisma in repositories, use cases in services, HTTP in handlers, route files as thin re-exports.
- Browser code must use HTTP API clients, not repositories, Prisma, or application services.
- Preserve existing behavior unless the task explicitly changes it.
- Use shared UI primitives and semantic CSS tokens.
- Before creating or refactoring non-login UI, read `docs/DESIGN_SYSTEM.md` and `docs/ai/UI_GENERATION_CHECKLIST.md`.
- Non-login UI must use `--ui-*` tokens, shared primitives, documented templates, and Lucide icons.
- Do not invent UI colors, radii, shadows, icon systems, or page-local primitive variants.
- Do not create or enlarge monolithic hand-written files.
- Update evidence docs for security-relevant changes.
