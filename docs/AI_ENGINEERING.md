# AI Engineering Rules

This is the canonical instruction source for Codex, Claude, Copilot, and future AI-assisted development.

Tool proxies:

- `AGENTS.md` points Codex here.
- `CLAUDE.md` points Claude here and to `.claude/skills`.
- `.github/copilot-instructions.md` points Copilot here.

## Mandatory Workflow

1. Start with `git status`.
2. Read the relevant docs before touching architecture, Prisma, API handlers, public offer, signing, auth, or security evidence.
3. Preserve behavior unless the task explicitly changes it.
4. Keep changes small and reviewable.
5. Run the relevant checks and report anything not run.

## Data Safety

Treat offers, accepted offers, public tokens, signatures, customers, leads, companies, products, projects, purchase orders, users, and organization data as production data.

Never create destructive migrations or destructive repository operations without explicit approval, a backup plan, a rollback plan, and an evidence entry.

## Architecture Rules

- Prisma is allowed only in infrastructure repositories.
- Application services orchestrate use cases, repositories, events, and cross-module contracts.
- HTTP handlers own auth, Zod validation, rate limits, and response shape.
- `src/app/api/**/route.ts` files stay thin re-exports.
- Browser code uses feature API clients, not services, repositories, or Prisma.
- ERP modules must not import demo modules.
- Other modules import from a module's `index.ts`, not its internals.

## Frontend Rules

- Use shared UI primitives from `src/shared/ui`.
- Use semantic CSS variables, not hardcoded color families.
- Build mobile-first and enhance upward.
- Do not create desktop-only critical workflows.
- Avoid nested cards and decorative backgrounds in ERP workflows.
- Do not create giant files; split by ownership.

## AI Data Handling

- Do not paste secrets, `.env` values, production customer data, signatures, tokens, or private business data into external tools.
- Use synthetic or redacted examples in prompts and docs.
- AI-generated code must be reviewed like human-written code.
- Security-relevant AI changes must update evidence docs when appropriate.

