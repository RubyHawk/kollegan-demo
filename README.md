# Kollegan Demo

Kollegan Demo is the production-style app behind the Soleria offer portal and the Fluffy's restaurant surfaces. It is not only a generic ERP prototype: the same Next.js codebase serves public pages, authenticated staff portals, offer signing links, and internal business workflows depending on the hostname and runtime surface.

The repo is used for real operational flows, so treat offers, companies, users, organizations, products, projects, signatures, restaurant menu items, bookings, and orders as production data.

## Deployed surfaces

| Host | What it is | Audience | Runtime notes |
| --- | --- | --- | --- |
| `offert.soleria.se` | Soleria/Kollegan portal and public offer-signing host | Soleria staff, customers opening signed offer links | Portal runtime. Bare token URLs are rewritten to public offer views. |
| `fluffys.se` | Public Fluffy's website | Restaurant guests | Public runtime. Serves guest-facing pages such as menu, contact/opening-hours, and public booking/order surfaces when they are enabled. |
| `portal.fluffys.se` | Fluffy's staff portal | Restaurant staff, kitchen, owner/manager roles | Portal runtime. Serves login, POS/kitchen, reservations, menu/admin, schedule, staff, and operational pages. |

## Demo access

These accounts are intentionally shared demo credentials for walkthroughs and technical review. They should stay scoped to fake or demo data only; if either account can reach real customer/company data, rotate it and fix the tenant isolation before sharing the README.

| Surface | URL | Email | Password | Scope |
| --- | --- | --- | --- | --- |
| Soleria/Kollegan portal | [offert.soleria.se/logga-in](https://offert.soleria.se/logga-in) | `test@soleria.se` | `test1234` | Isolated Soleria demo workspace with realistic fake offer, company, project, and product data. |
| Fluffy's staff portal | [portal.fluffys.se/logga-in](https://portal.fluffys.se/logga-in) | `test@fluffys.se` | `test1234` | Restaurant portal demo account for staff/POS/kitchen workflows. Public ordering and booking should remain disabled unless intentionally opened for a launch test. |

The Fluffy's split is documented in [docs/FLUFFYS_GO_LIVE.md](docs/FLUFFYS_GO_LIVE.md). In production the public site and portal are separate systemd services from one built artifact:

```txt
fluffys.se         -> reverse proxy -> 127.0.0.1:3100, APP_SURFACE=public
portal.fluffys.se  -> reverse proxy -> 127.0.0.1:3000, APP_SURFACE=portal
offert.soleria.se  -> reverse proxy -> portal runtime, PUBLIC_OFFER_HOSTS includes offert.soleria.se
```

Unset `APP_SURFACE` is for local development, where the combined historical behavior is still useful.

## What lives here

Kollegan is built as a modular business system:

- offers, public signing, customers, companies, products, projects, dashboard, and portal workflows;
- authentication and authorization, including role-based access and MFA/WebAuthn where configured;
- restaurant-specific public and staff workflows for Fluffy's;
- deployment, safety, and security evidence scripts used by GitHub Actions.

Business code is under `src/modules`. Route files in `src/app` and `src/app/api` should stay thin: they call handlers/API clients rather than owning business rules directly. Prisma belongs in repositories, use cases belong in services, and browser code must go through HTTP API clients.

For the exact layering rules, read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/PLATFORM_ARCHITECTURE.md](docs/PLATFORM_ARCHITECTURE.md), and [src/modules/README.md](src/modules/README.md).

## Deployment model

Pull requests run the [Quality Gates](.github/workflows/quality-gates.yml) workflow. Runtime-affecting changes run linting, tests, typecheck, dependency-boundary checks, and a Next.js build; docs-only changes skip the heavy runtime lanes but still run lightweight safety checks.

Merges to `main` run [Deploy to VPS](.github/workflows/deploy.yml):

1. GitHub Actions classifies the change so docs-only changes do not redeploy the app.
2. Runtime releases build a Next.js artifact and release metadata.
3. The artifact is copied to the VPS over SSH using GitHub repository secrets.
4. The VPS release script at [scripts/deploy-release.sh](scripts/deploy-release.sh) checks out the exact commit, installs production dependencies when needed, runs `prisma generate` and `prisma migrate deploy`, restarts the configured systemd services, and checks all configured health URLs.

The default production app directory is `/var/www/offert`. The release script can restart multiple services with `SERVICE_NAMES`, for example `kollegan,fluffys-public`, and health checks are intentionally strict: every configured service must come back healthy.

The repo also contains [docker-compose.yml](docker-compose.yml) and [Caddyfile](Caddyfile) as a self-contained app/Postgres/Redis/Caddy baseline. The current Fluffy's production split is described in the go-live runbook instead of the sample Caddy file.

## VPS and WireGuard safety model

The VPS is treated as an internet-facing web host, not as a place where every service should be public.

The intended network shape is:

- HTTP/HTTPS are public through the reverse proxy.
- SSH is restricted and used for admin/deploy access.
- WireGuard provides the private admin network for sensitive operational access.
- PostgreSQL, Redis, and similar internal services must not be exposed directly to the public internet.
- Firewall rules should fail closed: if WireGuard is down, private database/admin access should not silently fall back to public exposure.

The detailed hardening notes live in [docs/vps-security-guide.html](docs/vps-security-guide.html) and the security standards under [docs/security](docs/security). Do not commit real WireGuard keys, VPS IPs, GitHub tokens, database URLs, `.env` files, backups, or customer exports to this repo.

## Local development

Install dependencies and start the local Next.js server:

```bash
npm install
npm run dev
```

Useful local checks:

```bash
npm run lint
npm run lint:deps
npm run typecheck
npm test
npm run build
npm run check:migrations
npm run check:file-size
npm run check:encoding
npm run check:ai-proxies
```

Local environment values should come from a private source, not from committed files. If schema work is needed, follow [docs/PRODUCTION_DATA_SAFETY.md](docs/PRODUCTION_DATA_SAFETY.md) before touching migrations.

## Non-negotiables

- Existing data is production data, even when the repository name says demo.
- Do not delete, reset, or rewrite customer/business data without explicit approval, a backup, a rollback plan, and an evidence entry.
- Public offer links and signing flows are customer-facing and rollback-sensitive.
- Restaurant ordering and booking flows are customer-facing once enabled.
- Do not bypass module boundaries or import Prisma/application services into browser code.
- Do not commit secrets, private keys, tokens, real backups, or production exports.
- Do not create new monolithic source files.

## Start here

- [AI engineering rules](docs/AI_ENGINEERING.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Platform architecture](docs/PLATFORM_ARCHITECTURE.md)
- [API platform](docs/API_PLATFORM.md)
- [Fluffy's go-live runbook](docs/FLUFFYS_GO_LIVE.md)
- [Production data safety](docs/PRODUCTION_DATA_SAFETY.md)
- [Frontend guidelines](docs/FRONTEND_GUIDELINES.md)
- [Public site design](docs/PUBLIC_SITE_DESIGN.md)
- [Branding and theming](docs/BRANDING_AND_THEMING.md)
- [Security evidence index](docs/security/AUDIT_EVIDENCE_INDEX.md)
- [VPS security guide](docs/vps-security-guide.html)
