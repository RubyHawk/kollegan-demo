# Kollegan ERP

Kollegan is an ERP platform for sales, offers, projects, companies, product libraries, customers, and future operational workflows. Demo verticals, including the hotel demo, are isolated showcase surfaces and do not define the ERP architecture.

## Current Direction

- Next.js app with DDD-style modules under `src/modules`.
- Thin API routes under `src/app/api`.
- Prisma access isolated to repositories.
- Browser UI moving toward `/api/v1` and feature API clients.
- Mobile-ready responsive web patterns.
- Platform/company/user branding and theme separation.
- AI-native engineering rules for Codex, Claude, and Copilot.
- ISO/IEC 27001:2022 readiness evidence for engineering and change control.

## Start Here

- [ERP refactor plan](docs/ERP_REFACTOR_PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API platform](docs/API_PLATFORM.md)
- [Platform architecture](docs/PLATFORM_ARCHITECTURE.md)
- [AI engineering](docs/AI_ENGINEERING.md)
- [Production data safety](docs/PRODUCTION_DATA_SAFETY.md)
- [Frontend guidelines](docs/FRONTEND_GUIDELINES.md)
- [Branding and theming](docs/BRANDING_AND_THEMING.md)
- [Security evidence index](docs/security/AUDIT_EVIDENCE_INDEX.md)

## Development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm run lint:deps
npm run typecheck
npm test
npm run build
npm run check:migrations
npm run check:file-size
npm run check:ai-proxies
```

## Non-Negotiables

- Existing business data is production data.
- Do not create destructive migrations without approval, backup, rollback, and evidence.
- Do not bypass module boundaries.
- Do not create new monolithic source files.
- Public offer/signing flows are critical and need rollback-safe rollout.

