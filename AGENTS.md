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
- Do not create or enlarge monolithic hand-written files.
- Update evidence docs for security-relevant changes.

