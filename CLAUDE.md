# Claude Instructions

Read [docs/AI_ENGINEERING.md](docs/AI_ENGINEERING.md) before making code, schema, API, security, public offer, signing, or architecture changes.

Claude-specific skills live in [.claude/skills](.claude/skills). Use the relevant skill before touching migrations, security evidence, DDD module boundaries, API contracts, branding, theming, or frontend architecture.

Core rules:

- Start with `git status`.
- Treat existing business data as production data.
- Never create destructive migrations without explicit approval and rollback evidence.
- Preserve offer/signing/project/company/product/auth behavior unless the task explicitly changes it.
- Keep ERP code independent from demo modules.
- Do not create giant files; split by ownership.

