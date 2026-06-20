# Risk Register

Owner: ISMS Manager  
Review cadence: Monthly during refactor, quarterly after stabilization  
Status: Baseline in progress

| ID | Risk | Asset/process | Likelihood | Impact | Score | Treatment | Owner | Evidence | Next review |
|---|---|---|---:|---:|---:|---|---|---|---|
| R-001 | Destructive migration deletes business data | Production database | 3 | 5 | 15 | Mitigate with migration scanner, backup gate, staging migration, evidence | Engineering lead | `docs/PRODUCTION_DATA_SAFETY.md`, `docs/security/AUDIT_EVIDENCE_INDEX.md` | 2026-05-24 |
| R-002 | Public offer rewrite breaks customer signing | Public offer/signing | 3 | 5 | 15 | Mitigate with feature flags, contract tests, rollback path | Product/Engineering | `docs/REFACTORING_PLAYBOOK.md`, `tests/unit/public-offer-api-contract.test.ts`, `tests/unit/public-offer-renderer.service.test.ts` | 2026-05-24 |
| R-003 | AI-generated code violates architecture boundaries | Development process | 3 | 4 | 12 | Mitigate with AI rules, skills, dependency checks | Engineering lead | `docs/AI_ENGINEERING.md`, `.github/workflows/quality-gates.yml`, `package.json` | 2026-05-24 |
| R-004 | User theme preference affects public documents | Branding/theming | 2 | 4 | 8 | Mitigate with resolver precedence and tests | Product/Engineering | `docs/BRANDING_AND_THEMING.md`, `tests/unit/branding-profile.test.ts`, `tests/unit/theme-bootstrap.test.ts` | 2026-05-24 |
| R-005 | Legacy API consumers break during `/api/v1` migration | API contracts | 3 | 4 | 12 | Mitigate with compatibility wrappers and contract tests | Engineering lead | `docs/API_VERSIONING.md`, `tests/unit/api-client.test.ts`, `docs/security/AUDIT_EVIDENCE_INDEX.md` | 2026-05-24 |
| R-006 | Production deploy script or release artifact drifts away from the Git-reviewed version | Change and release process | 2 | 4 | 8 | Mitigate by shipping the tracked deploy script in the deploy bundle, installing it to the fixed VPS path before release, and keeping deploy artifacts in `.deploy-state` | Engineering lead | `.github/workflows/deploy.yml`, `scripts/deploy-release.sh`, `docs/security/AUDIT_EVIDENCE_INDEX.md` | 2026-05-24 |
| R-007 | Online payment mishandles funds, or a forged/replayed provider callback marks a public order paid without payment | Customer payments / public ordering | 2 | 4 | 8 | Off by default (env-gated; new suppliers Stripe + Swish); Stripe webhooks verified with HMAC signature + replay window; Swish callbacks re-verified server-side over mutual TLS before trust; order id (not prices) carried in provider metadata; mark-paid is amount-guarded, idempotent, and scoped to `source='public'`. Swish callback host/IP allowlisting to be added before live use | Engineering lead | `src/modules/supporting/restaurant-orders/application/payment/*`, `tests/unit/restaurant-payment.test.ts`, `docs/security/AUDIT_EVIDENCE_INDEX.md` | 2026-09-20 |

