# ERP Platform — Architecture & Roadmap

This document defines the long-term architecture vision, domain model, integration strategy, data strategy, and 6–12 month execution roadmap for the Kollegan ERP Platform.

> Written for future collaborators and architects. Think in years, not sprints.

---

## 1. Vision & Core Philosophy

We are building a **modular ERP platform** — not a bundle of disconnected apps, and not a bloated monolith. Every module shares a common core, common design system, and common data model, while remaining independently deployable if needed.

### Core tenets:

1. **Domain isolation** — modules own their data and UI. They communicate through defined contracts, not shared database joins.
2. **AI-native from day one** — LLMs, voice AI, and automation are first-class citizens, not afterthoughts.
3. **Fast iteration now, clean structure always** — we don't design microservices we don't need, but we structure code so they can be extracted when the time comes.
4. **Integration over re-invention** — use n8n for automation orchestration, Vapi for voice, Slack/GitHub for team tooling. Build the connective tissue, not every brick.
5. **Single source of truth** — one database, one auth system, one design system.

---

## 2. Business Domains

The platform is organized around these primary business domains:

```
┌─────────────────────────────────────────────────────────────┐
│                     KOLLEGAN ERP PLATFORM                   │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│  HOTEL   │   CRM    │  LEADS   │  OFFERS  │   TEAM HUB      │
│ Rooms    │ Contacts │ Pipeline │ Quotes   │ GitHub / Slack  │
│ Bookings │ History  │ Scoring  │ PDF/Sign │ AI Meetings     │
│ Services │ Segments │ Assign   │ Delivery │ Announcements   │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│                       VOICE AI (Vapi)                       │
│          Phone receptionist · Tool calls · Transcripts      │
├─────────────────────────────────────────────────────────────┤
│               ACTIVITY LOG / AUDIT TRAIL                    │
│            Cross-module event stream · Real-time SSE        │
├─────────────────────────────────────────────────────────────┤
│                  SHARED CORE SERVICES                       │
│   Auth · Database · Cache · Logging · Rate limiting · API   │
└─────────────────────────────────────────────────────────────┘
```

### Core modules (ship with the system)
- **Hotel** — the current demo vertical; one feature directory (`features/hotel/`) with two sub-domains: `rooms/` (availability, bookings, calendar) and `services/` (restaurants, amenities, activities)
- **CRM** — customer profiles, call history, interaction timeline
- **Activity Log** — cross-module audit trail and real-time event feed
- **Voice AI** — Vapi integration, AI tool handlers, call transcripts
- **Dashboard** — shell UI, authentication, setup, staff management

### Optional/future modules (plugged in independently)
- **Leads** — inbound lead tracking, pipeline management, scoring
- **Offers** — quote builder, PDF generation, e-signature, delivery
- **Team Hub** — SaaS workspace model with sub-modules: multi-tenant workspace/billing, GitHub App (PRs/issues/CI), Slack App (channels/notifications), AI meeting pipeline (recording → transcript → Claude summary → action items), and internal announcements
- **Invoicing** — invoice generation, payment status, reminders
- **Analytics** — occupancy dashboards, revenue trends, forecasting
- **Multi-property** — tenant isolation for multiple hotel locations

---

## 3. Architecture Pattern: Modular Monolith

### Why modular monolith (not microservices)?

At this stage, microservices would add deployment complexity, network latency, and distributed transaction problems — without meaningful benefit. A **well-structured monolith** with clean module boundaries gives us:

- Fast iteration (no inter-service APIs to maintain)
- ACID transactions across modules
- Single deployment unit
- Easy local development
- Clear extraction path if/when scale demands it

### Extraction trigger points

Extract a module to a service when ANY of these are true:
- The module requires dramatically different scaling (e.g., analytics needs read replicas)
- The module has independent release cadence with a separate team
- The module has fundamentally different technology requirements

### Module communication

Within the monolith, modules communicate via:

1. **Direct function calls** (synchronous) — for reads and fast writes
2. **SSE events** (real-time broadcast) — for live dashboard updates
3. **n8n workflows** (async orchestration) — for multi-step business processes, emails, notifications

Modules must NOT:
- Share database tables (each module owns its tables)
- Import each other's internal `lib/` or `store` files directly
- Bypass the API layer for cross-module writes

### Module interface contract

Each module exposes its public API via `src/features/<module>/index.ts`:

```typescript
// What other modules can import from this module
export type { Lead, LeadStatus } from './types';
export { createLead } from './api';
// Components are NOT exported between modules (use page.tsx composition)
```

---

## 4. Domain-Driven Design Structure

### Aggregate roots (per module)

| Module | Aggregate Root | Key Relations |
|---|---|---|
| Hotel/Rooms | `Room` | `HotelBooking[]` |
| CRM | `Customer` | `CrmRecord[]`, `CallTranscript[]`, `HotelBooking[]` |
| Voice | `CallTranscript` | `Customer`, `CrmRecord` |
| Leads (future) | `Lead` | `LeadActivity[]`, `Customer?` |
| Offers (future) | `Offer` | `OfferLineItem[]`, `Customer?`, `Lead?` |
| Staff | `StaffUser` | (auth only) |

### Value objects and shared types

- Dates: always ISO 8601 strings in API/DB, `Date` objects only in business logic
- Money: always integers in minor units (öre) for storage; formatted for display
- IDs: UUIDs v4 from the database

### Domain events (current and future)

Domain events are the backbone of cross-module communication:

```typescript
// Current (via SSE)
type RoomEvent = 'room_confirmed' | 'room_cancelled' | 'room_locked';
type CallEvent = 'call_started' | 'call_ended';
type CRMEvent  = 'crm_contact' | 'rooms_queried';

// Future (add to SSE event types)
type LeadEvent    = 'lead_created' | 'lead_stage_changed' | 'lead_converted';
type OfferEvent   = 'offer_sent' | 'offer_accepted' | 'offer_declined';
type MeetingEvent = 'meeting_completed' | 'summary_generated';
```

---

## 5. Database Strategy

### Current schema

PostgreSQL with Prisma 7 ORM. All current tables use the `demo_hotel_` prefix to signal their scope. As new modules are added, use module-specific prefixes:

```
demo_hotel_*    → hotel module tables (rooms, bookings, services)
crm_*           → CRM module tables
leads_*         → Leads module tables
offers_*        → Offers module tables
team_*          → Team hub tables
staff_*         → Auth/staff tables
```

### Multi-tenancy strategy

Current: single tenant (one hotel). Future multi-tenancy approach:

**Phase 1 (now):** Single tenant, no isolation needed.

**Phase 2 (multi-property):** Add `organizationId` to all tables. Use row-level security (PostgreSQL RLS) for data isolation. Single database.

**Phase 3 (true SaaS):** Schema-per-tenant using Prisma's multi-schema support, or a dedicated database per large customer. Determined by data isolation requirements and scale.

Never mix tenant data in the same table row — always use foreign key isolation.

### Event sourcing consideration

For the audit log / activity trail, consider moving to an append-only event log as volume grows:

- Current: `ActivityEvent[]` stored in memory (Zustand) and persisted via SSE
- Future: Dedicated `events` table as source of truth, replayed into Zustand on connect

This gives you a complete audit trail, time-travel debugging, and the ability to rebuild any derived state.

### Scaling read performance

When reporting/analytics queries slow down transactional queries:
1. Add read replica for reporting queries (Prisma supports multiple datasources)
2. Materialize summary tables via nightly jobs
3. Consider ClickHouse or TimescaleDB for time-series analytics data

---

## 6. API Layer

### Internal vs. external APIs

```
External (Vapi tool calls) → /api/ai/*       → Requires x-vapi-secret
External (n8n webhooks)    → /api/n8n/*      → Requires HMAC signature
External (client app)      → /api/*          → Requires JWT (future)
Internal (SSE)             → /api/sse        → Requires JWT (future)
Public (docs)              → /api/docs       → No auth
```

### API design principles

- **Thin handlers** — route files import from `@features/`, never duplicate logic
- **Zod validation** at the boundary — validate all incoming data before it touches the domain
- **Consistent error format** — `{ error: string }` for all 4xx/5xx responses
- **Rate limiting** — all external endpoints rate-limited via Redis sliding window

### Authentication roadmap

Current: JWT stored in cookies (staff auth). Future expansion:

1. **Staff auth** (done) — email/password → JWT → HttpOnly cookie
2. **API keys** — for external integrations (replace `x-vapi-secret` with proper API key system)
3. **OAuth 2.0** — for Slack/GitHub integrations
4. **Role-based access control (RBAC)** — `admin`, `manager`, `receptionist` roles already in DB; enforce in middleware

### OpenAPI spec

Maintained in `src/core/api/openapi.ts`. Served at `/api/docs`. Keep this updated as new AI tool endpoints are added — Vapi's LLM uses it to understand tool capabilities.

---

## 7. Integration Strategy

### n8n — Automation Orchestration

n8n is our automation backbone. Keep n8n workflows for:
- Multi-step processes (e.g., booking confirmation → send email → update CRM → notify Slack)
- Scheduled jobs (e.g., daily occupancy report)
- Data sync between services
- Error handling and retry flows

Our app exposes webhooks; n8n calls them. n8n also calls us back via `/api/n8n/*`.

Workflow files are version-controlled in `n8n/`. Export from n8n and commit after changes.

### Vapi — Voice AI

Vapi handles telephony and LLM orchestration. We provide:
- Tool definitions (in Vapi dashboard or via API)
- Tool endpoints at `/api/ai/*`
- Webhook handlers for call lifecycle events

Assistant configuration: `vapi/assistant-config.json` (version-controlled).

As new ERP modules are added, add corresponding Vapi tools:
- Lead management → `create_lead`, `update_lead_status`
- CRM lookup → already exists (`get_customer`)
- Offers → `get_offer_status`, `confirm_offer`

### Slack Integration (future)

Pattern:
1. Install Slack App with Bot token + Events API
2. Add `src/infrastructure/slack/slack-client.ts` (thin wrapper around Slack Web API)
3. Webhook receiver at `/api/integrations/slack/webhook` (verify with signing secret)
4. Post notifications from domain events (e.g., new booking → #bookings channel)
5. Slash commands for quick actions from Slack

### GitHub Integration (future)

Pattern:
1. Create GitHub App (preferred over OAuth for team use)
2. Add `src/infrastructure/github/github-client.ts`
3. Webhook receiver at `/api/integrations/github/webhook`
4. Display PRs/issues/CI in Team Hub tab
5. Link commits to ERP activities (e.g., feature deployment triggers activity log entry)

### LLM / AI Strategy

Current: Vapi manages the LLM for voice calls (GPT-4o or equivalent).

Future direct LLM integration:
- **Meeting summaries** — send transcript to Claude/GPT → extract summary + action items → store in `Meeting` model
- **Lead scoring** — periodically run LLM over lead interactions → update score
- **Offer generation** — LLM drafts offer text based on lead/customer context
- **Analytics narratives** — LLM generates natural language summaries of occupancy/revenue data

Add `src/infrastructure/ai/` with adapters for Claude API, OpenAI, etc. Keep LLM calls outside of the critical request path (async via background jobs or n8n).

---

## 8. Frontend Architecture

### Design system

Token-based CSS design system in `src/shared/styles/`:
- `tokens.css` — CSS custom properties (colors, spacing, radii, shadows)
- `components.css` — reusable utility classes (`.glass-panel`, `.nav-active`, `.card-interactive`)
- `animations.css` — keyframe animations
- `voice-widget.css` — voice contact widget styles

All colors use CSS variables. Light/dark mode via `.dark` class on `<html>`.

### Component hierarchy

```
Page (app/page.tsx)
└── Layout (app/layout.tsx)
    ├── DashboardHeader     @features/dashboard
    ├── DashboardSidebar    @features/dashboard
    └── Tab content         @features/<module>
        └── Feature UI
            └── @shared/ui  (Button, Dialog, Badge, Toast…)
```

### State management

| Type | Solution | Where |
|---|---|---|
| Server state | Fetch + Zustand | `@features/*/lib/*-store.ts` |
| Real-time state | SSE → Zustand | `@shared/stores/realtime-store.ts` |
| UI state | React useState | Component-local |
| Form state | React useState | Component-local (no heavy form library) |
| Global UI (toasts) | React Context | `@shared/ui/toast/toast-context.tsx` |

As modules grow, consider React Query (TanStack Query) for server state — it handles loading/error/stale states elegantly and is already in `package.json`.

### Adding UI to a new module

1. Build the tab component in `src/features/<module>/components/<module>-tab.tsx`
2. Use `@shared/ui/` for primitives (Button, Dialog, Badge, etc.)
3. Follow the existing design token conventions (use CSS vars, not hardcoded colors)
4. Animate with Framer Motion using constants from `@shared/lib/motion`
5. Export from `src/features/<module>/index.ts`

---

## 9. Development Workflow

### Branching strategy

```
main          Production-ready code. Protected.
develop       Integration branch. All features merge here first.
feature/*     Feature branches. One per ticket/feature.
fix/*         Bug fixes.
chore/*       Non-functional changes (deps, docs, config).
```

For the AI development sessions, use `claude/*` branches as designated.

### Commit conventions

```
feat: add lead pipeline view
fix: resolve calendar timezone offset bug
chore: update Prisma to v8
refactor: move ai-tools to voice feature
docs: update architecture roadmap
```

### CI/CD (recommended setup)

```yaml
# GitHub Actions
on: [push, pull_request]
jobs:
  quality:
    - npm run lint
    - npm run build
    - npm test
  deploy:
    - on: merge to main
    - npx prisma migrate deploy
    - Deploy to Vercel/Docker
```

### Code quality gates

- TypeScript strict mode — CI fails on type errors
- ESLint with Next.js config — no console.logs in production code (use logger)
- Test coverage targets (aim for >80% on `src/core/` and `src/features/*/lib/`)

---

## 10. Security Model

### Authentication layers

| Surface | Mechanism | Notes |
|---|---|---|
| Staff dashboard | JWT (HttpOnly cookie, 15m access + 7d refresh) | Rotation on use |
| Vapi tool calls | `x-vapi-secret` shared secret | Per-environment |
| n8n webhooks | HMAC-SHA256 signature | Verify in middleware |
| Slack webhooks | Signing secret | `@infra/slack` adapter |
| GitHub webhooks | Webhook secret | `@infra/github` adapter |

### Authorization (RBAC)

Current roles in DB: `receptionist`, `manager`, `admin`.

Enforce in middleware:
```typescript
// src/core/auth/middleware.ts (future)
export function requireRole(role: 'receptionist' | 'manager' | 'admin') {
  return (handler) => async (req) => {
    const user = await verifyJWT(req);
    if (!hasRole(user, role)) return unauthorized();
    return handler(req);
  };
}
```

### Rate limiting

All external endpoints rate-limited. Current config:
- Vapi tool calls: 30 req/min per endpoint
- Fail-open if Redis unavailable (acceptable for demo)

Production: make rate limiting hard (fail-closed) and tune limits per endpoint.

---

## 11. 6–12 Month Roadmap

### Phase 1: Foundation (Months 1–2) — DONE
- [x] Hotel room management + real-time dashboard
- [x] Vapi voice AI receptionist
- [x] CRM with call transcripts
- [x] Google Calendar sync
- [x] n8n workflow integration
- [x] Clean ERP architecture (core/, features/, infrastructure/)
- [x] ERP module stubs (leads, offers, team-hub)
- [x] Comprehensive documentation

### Phase 2: CRM Expansion (Months 2–3)
- [ ] Full customer profile page (booking history, call timeline, notes)
- [ ] Customer search and filtering
- [ ] Customer segments/tags
- [ ] CRM data export (CSV)
- [ ] Email integration (send confirmation emails via n8n)

### Phase 3: Lead Management (Months 3–4)
- [ ] Lead capture from voice calls (auto-create from Vapi transcripts)
- [ ] Pipeline view (kanban or table with stages)
- [ ] Lead-to-customer conversion flow
- [ ] Assignment to staff members
- [ ] Lead scoring (simple rules-based first, LLM-enhanced later)

### Phase 4: Offer Builder (Months 4–5)
- [ ] Offer creation UI (line items, pricing, discounts)
- [ ] PDF generation (react-pdf)
- [ ] Email delivery via n8n
- [ ] Offer status tracking (sent, viewed, accepted)
- [ ] Link offers to leads and CRM contacts

### Phase 5: Team Hub (Months 5–7)
- [ ] Workspace model (multi-tenant: slug, plan, members, invites, settings)
- [ ] GitHub App integration (PRs, issues, CI runs per repo — App model, not OAuth)
- [ ] Slack App integration (Bot token → channel feed, notification rules, slash commands)
- [ ] Meeting scheduler (link to Google Meet or Zoom; track participants)
- [ ] AI meeting pipeline: recording → Whisper/Deepgram transcription → Claude summary → action items → Slack notify (via n8n `meeting-summary-pipeline.json`)
- [ ] Team announcements with priority tiers (normal / important / urgent), pinning, optional Slack mirror
- [ ] Workspace billing tiers (Free / Pro / Enterprise)

### Phase 6: Analytics & Multi-property (Months 7–9)
- [ ] Occupancy analytics dashboard (charts, trends, forecasting)
- [ ] Revenue tracking per room type
- [ ] Staff performance metrics
- [ ] Multi-property support (`organizationId` on all tables)
- [ ] Property switching in the dashboard

### Phase 7: Invoicing & Payments (Months 9–12)
- [ ] Invoice generation from bookings/offers
- [ ] Stripe or Klarna integration for payment links
- [ ] Payment status tracking
- [ ] Automated payment reminders via n8n

---

## 12. Technical Debt to Avoid

1. **Don't skip Prisma migrations** — always use `prisma migrate dev`, never `db push` in anything resembling production.

2. **Don't put business logic in route handlers** — `app/api/` routes should be 20 lines max. Extract to features.

3. **Don't use relative imports across feature boundaries** — always use path aliases. `../../features/rooms` is a bug waiting to happen.

4. **Don't share Zustand stores across modules** — each module gets its own store. `realtime-store.ts` is the one exception (SSE events affect multiple modules).

5. **Don't hardcode tenant context** — even in single-tenant mode, pass `organizationId` through the call stack from day one. Retrofitting multi-tenancy is expensive.

6. **Don't build synchronous LLM calls in the hot path** — voice calls are already real-time; adding LLM latency will kill call quality. Use async patterns (background jobs, queues) for LLM work.

7. **Don't let `src/lib/` grow back** — `src/lib/` is now a shim layer pointing to `src/core/`. New utilities go in `src/core/<category>/`. Eventually remove the shims.

8. **Don't skip OpenAPI updates** — when you add a Vapi tool endpoint, update `src/core/api/openapi.ts`. The LLM needs accurate docs to use tools correctly.

---

## 13. Infrastructure Checklist for Production

| Concern | Solution | Notes |
|---|---|---|
| Database | PostgreSQL 18+ (Supabase, Neon, or self-hosted) | Enable RLS for multi-tenant |
| Cache | Redis (Upstash for serverless, or self-hosted) | Rate limiting + session blacklist |
| File storage | S3-compatible (offer PDFs, meeting recordings) | Not yet implemented |
| Email | SMTP via n8n or Resend | Not yet implemented |
| Monitoring | Sentry + Vercel Analytics | Not yet implemented |
| Logging | Structured logs → Datadog/Axiom | logger.ts already structured |
| Secrets | Environment variables (never in code) | Use Doppler or Vault in production |
| Backups | Daily PostgreSQL dumps | Automated via cron or Supabase |

---

*Last updated: 2026-02. Maintained by the Kollegan development team.*
