# Kollegan — AI Automation Platform

An AI-native business automation platform built on Next.js 16 + React 19. The core product is **agentic workflows and voice AI** — automating business processes end-to-end. CRM, lead management, and ERP modules are value-add layers that integrate with and benefit from the automation engine.

> **Vision:** A single extensible platform where every business event can trigger an automated workflow. Sell automation. Include CRM, leads, team tools, and vertical demos as proof of value.

---

## Current Demo — Hotel AI Receptionist

The live demo shows the automation platform in a hotel context:

- **Voice AI receptionist** (Vapi) — answers calls, books rooms, updates CRM, triggers workflows
- **Real-time room dashboard** — live availability via Server-Sent Events
- **Bookings calendar** — week/month timeline with Google Calendar sync
- **CRM & activity log** — call transcripts, customer profiles, booking history
- **Hotel services** — restaurants, amenities, activities management
- **Staff authentication** — JWT-secured admin dashboard with MFA (TOTP + WebAuthn)
- **n8n workflow automation** — business process orchestration across all modules

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1 (App Router) |
| UI | React 19, TailwindCSS 4, Framer Motion 12, Radix UI |
| Database | PostgreSQL 18+ via Prisma 7 (driver adapter) |
| State | Zustand 5, SSE (real-time) |
| Auth | JWT (jose), bcrypt, TOTP (otpauth), WebAuthn (SimpleWebAuthn) |
| Cache / Rate limiting | Redis (ioredis) |
| Voice AI | Vapi Web SDK + webhook handlers |
| Automation | n8n (self-hosted or cloud) |
| Calendar | Google Calendar API (service account) |
| Testing | Vitest + supertest |

---

## Architecture

### Principles

1. **Automation-first** — every domain event can trigger a workflow; no module is exempt
2. **DDD module isolation** — each module owns its data; cross-module reads go through `index.ts` only
3. **Clean separation** — HTTP layer (`app/api/`) is thin; business logic lives in module `application/` services
4. **Infrastructure adapters** — every external service (Vapi, Slack, n8n, LLM) is behind an adapter interface; swap vendor, not code
5. **Multi-tenant from row 1** — `organizationId` on every table, enforced at query layer
6. **Event-driven by design** — in-process event bus today, extractable to message queue when needed

### Directory Structure

```
src/
├── app/                          Next.js App Router (routing + HTTP layer ONLY)
│   ├── api/
│   │   ├── ai/                   Vapi AI tool endpoints (availability, booking, CRM, transcripts)
│   │   ├── auth/                 Login, logout, refresh, MFA (TOTP + backup codes + WebAuthn)
│   │   ├── leads/                Lead CRUD + activities + conversion
│   │   ├── n8n/                  n8n webhook receivers (CRM, leads)
│   │   ├── demos/hotel/          Hotel demo CRUD endpoints
│   │   ├── admin/                Admin operations (access review)
│   │   ├── calendar/             Google Calendar sync
│   │   ├── sse/                  Server-Sent Events stream
│   │   ├── health/               Docker healthcheck endpoint
│   │   └── docs/                 OpenAPI spec + Swagger UI
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
│
├── modules/                      Business modules — DDD classified
│   │
│   ├── core/                     ★ Core domains — your competitive moat
│   │   ├── automation/           Workflow engine, tool registry, triggers
│   │   └── voice/                Vapi phone agent, LLM-callable ai-tools, call lifecycle
│   │
│   ├── supporting/               Supporting domains — solid DDD, no heroics
│   │   ├── auth/                 Unified user model, sessions, MFA, RBAC
│   │   │   ├── domain/           User + Session entities
│   │   │   ├── application/      login, logout, refreshTokens, completeMfaLogin
│   │   │   ├── infrastructure/   user.repository, session.repository
│   │   │   └── index.ts
│   │   ├── crm/                  Customer profiles, call transcripts, CRM records
│   │   ├── leads/                Lead pipeline, activity feed, stage transitions, conversion
│   │   │   ├── domain/           Lead + LeadActivity entities, LeadStatus / LeadSource types
│   │   │   ├── application/      createLead, listLeads, updateLead, convertLead, addLeadActivity
│   │   │   ├── infrastructure/   leadsRepository
│   │   │   ├── events/           LEAD_CREATED, LEAD_STAGE_CHANGED, LEAD_CONVERTED, LEAD_ASSIGNED
│   │   │   └── index.ts
│   │   ├── audit/                Append-only audit trail (SOC 2 evidence)
│   │   ├── identity/             Organizations, org settings
│   │   └── offers/               Quotation builder (stub)
│   │
│   └── generic/                  Generic domains — commodity, keep simple
│       ├── dashboard/            Shell UI — header, sidebar, navigation
│       └── team-hub/             SaaS collaboration (GitHub, Slack, meetings, announcements)
│
├── demos/                        Sales / showcase verticals (never rename or move)
│   └── hotel/                    Hotel AI Receptionist demo
│       ├── api/                  Demo-specific route handlers
│       ├── domain/               Hotel domain entities
│       ├── application/          Room booking, service management
│       ├── infrastructure/       room-store, hotel repositories
│       └── ui/                   Hotel dashboard components
│
├── core/                         Framework-agnostic application utilities
│   ├── api/                      createHandler() pipeline, RFC 9457 errors, response helpers
│   ├── auth/                     JWT sign/verify, Vapi webhook auth, token blacklist
│   ├── cache/                    Redis client, sliding-window rate limiter
│   ├── database/                 Prisma client singleton
│   ├── events/                   In-process typed event bus
│   ├── logging/                  Structured logger
│   ├── queue/                    Background job queue
│   └── resilience/               Exponential-backoff retry wrapper
│
├── infrastructure/               External system adapters
│   ├── calendar/                 Google Calendar API client
│   ├── sse/                      Server-Sent Events manager
│   └── persistence/              JSON file store (dev/demo fallback)
│
├── shared/                       Cross-cutting concerns
│   ├── ui/                       Reusable UI components (Button, Dialog, Toast…)
│   ├── hooks/                    Shared React hooks (useSSE)
│   ├── lib/                      Utility functions (dates, motion, cn)
│   ├── stores/                   Zustand stores (realtime-store)
│   └── styles/                   Design tokens, animations, component CSS
│
└── generated/                    Auto-generated Prisma client (do not edit)
    └── prisma/
```

### Path Aliases (tsconfig)

| Alias | Resolves to | Use for |
|---|---|---|
| `@/*` | `src/*` | Anything in src (fallback) |
| `@modules/core/*` | `src/modules/core/*` | Core domain modules |
| `@modules/supporting/*` | `src/modules/supporting/*` | Supporting domain modules |
| `@modules/generic/*` | `src/modules/generic/*` | Generic domain modules |
| `@demos/*` | `src/demos/*` | Demo verticals |
| `@shared/*` | `src/shared/*` | Shared UI and utilities |
| `@core/*` | `src/core/*` | Auth, DB, cache, logging, API pipeline |
| `@infra/*` | `src/infrastructure/*` | External service adapters |

### Module Internal Structure

Every non-trivial module follows DDD layering:

```
modules/supporting/my-module/
├── domain/              Pure TypeScript types — no DB, no HTTP, no side effects
│   └── my-entity.ts
├── application/         Business logic — orchestrates domain + infrastructure
│   └── my.service.ts
├── infrastructure/      Database queries — all Prisma access lives here
│   └── my.repository.ts
├── api/handlers/        Thin HTTP handlers — delegate to application
│   └── my.handler.ts
├── events/              Domain event definitions + publishers
│   └── my.events.ts
└── index.ts             Public API — ONLY export what other modules need
```

The `index.ts` is the **module contract**. Other modules may only import from `index.ts`, never from internal files.

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 18+
- Redis (optional — rate limiting fails open without it)
- Vapi account (for voice features)
- Google Cloud service account (for calendar sync)
- n8n instance (for workflow automation)

### Docker (recommended)

```bash
git clone <repo>
cd kollegan-demo
cp .env.example .env
# Fill in .env values
docker compose up
```

The app runs at `http://localhost:3000` (or your configured domain via Caddy TLS).

### Manual

```bash
git clone <repo>
cd kollegan-demo
npm install
cp .env.example .env.local
# Fill in .env.local values
npx prisma migrate deploy
npm run dev
```

### Environment Variables

See `.env.example` for all required variables, grouped by concern:

```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/kollegan

# Cache
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=<256-bit random secret>

# Vapi (voice AI)
VAPI_WEBHOOK_SECRET=your-vapi-webhook-secret
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your-vapi-public-key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your-assistant-id

# Google Calendar (service account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_CALENDAR_ID=...

# Demo
DEMO_ORG_ID=demo
```

### Database Setup

```bash
npx prisma migrate deploy    # Apply all migrations
npx prisma studio            # Browse data
```

---

## Adding a New Module

### 1. Create the module folder

Follow the DDD layer template. Place it in the right classification:
- `src/modules/core/` — automation, voice (your competitive moat)
- `src/modules/supporting/` — crm, leads, auth, audit (important, not heroic)
- `src/modules/generic/` — dashboard, team-hub (commodity, keep simple)
- `src/demos/` — sales verticals (hotel, real-estate, etc.)

```
src/modules/supporting/my-module/
├── domain/
│   └── my-entity.ts         # TypeScript types only — no imports from outside domain/
├── application/
│   └── my.service.ts        # Business logic — imports domain + infrastructure
├── infrastructure/
│   └── my.repository.ts     # All Prisma queries — no Prisma outside this file
├── api/handlers/
│   └── my.handler.ts        # HTTP: thin, delegates to service
├── events/
│   └── my.events.ts         # Domain event definitions
└── index.ts                 # Public barrel — only export what consumers need
```

### 2. Add database models

Edit `prisma/schema.prisma`, run:

```bash
npx prisma migrate dev --name add-my-module
```

### 3. Add API routes

```
src/app/api/my-module/
├── route.ts             GET/POST
└── [id]/route.ts        GET/PATCH/DELETE
```

Use `createHandler()` from `@core/api/handler` — it provides auth, Zod validation, rate limiting, and RFC 9457 error responses for free:

```typescript
export const GET = createHandler(
  { auth: 'jwt', tag: 'MyModule:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    // ... business logic via service
    return ok({ result });
  },
);
```

### 4. Register in the dashboard sidebar

Edit `src/modules/generic/dashboard/components/dashboard-sidebar.tsx`.

### 5. Register event subscribers at startup

Add subscribers in `instrumentation.ts` so they wire up when the app boots.

---

## Integration Architecture

### Vapi Voice AI

```
Caller → Vapi → LLM tool call → POST /api/ai/* → modules/core/voice/ai-tools/* → DB + SSE
```

Auth: `x-vapi-secret` header → `@core/auth/vapi-auth`
Rate limiting: Redis sliding window → `@core/cache/rate-limiter`

### n8n Automation

```
n8n Workflow → POST /api/n8n/crm   → CRM module
             → POST /api/n8n/leads → Leads module
```

### Google Calendar

```
Booking created → calendar adapter → Google Calendar API → Event created
```

Adapter: `src/infrastructure/calendar/google-calendar.ts`
Retry: `@core/resilience/with-retry`

### Real-time Dashboard (SSE)

```
Any state change → logActivity() → SSE Manager → Event stream → Zustand → UI
```

Manager: `src/infrastructure/sse/sse-manager.ts`
Client hook: `src/shared/hooks/use-sse.ts`

---

## Module Status

| Module | Layer | Status | Description |
|---|---|---|---|
| Voice AI | core | Live | Vapi phone receptionist, LLM tool calls |
| Automation engine | core | Partial | Workflow model, tool registry, domain events |
| CRM | supporting | Live | Customer profiles, call transcripts, auto-lead on new caller |
| Auth | supporting | Live | JWT, MFA (TOTP + backup codes + WebAuthn), opaque refresh tokens |
| Leads | supporting | Live | Full pipeline: CRUD, stage transitions, activities, conversion |
| Audit | supporting | Live | Append-only audit trail, actor tracking |
| Identity / Orgs | supporting | Live (basic) | Organization model, multi-tenancy |
| Offers | supporting | Stub | Quotation builder — not yet implemented |
| Hotel demo | demos | Live | Rooms, services, bookings, calendar, real-time |
| Team hub | generic | Stub | GitHub/Slack/meetings — not yet implemented |
| Dashboard | generic | Live | Shell UI, navigation, activity feed |
| Billing | generic | Planned | Stripe, seat limits, usage billing |
| Analytics | generic | Planned | Occupancy, revenue, workflow volumes |
| Plugin API | core | Planned | External tool registration |

See `docs/ARCHITECTURE.md` for the full domain model, security architecture, and roadmap.

---

## API Documentation

- **JSON spec:** `GET /api/docs`
- **Swagger UI:** `GET /api/docs/ui`

All Vapi AI tool endpoints require `x-vapi-secret` header.
All authenticated endpoints accept either `Authorization: Bearer <token>` or the httpOnly `token` cookie.

---

## Development Guidelines

- TypeScript strict mode — no implicit `any`
- Absolute imports only — use path aliases, never deep relative paths
- Route handlers are thin — business logic lives in `application/` services, not in `app/api/`
- Infrastructure adapters never import from `@modules/*`
- One Prisma client instance via `@core/database/prisma`
- Module boundaries enforced by dependency-cruiser: `npm run lint:deps`

```bash
npm test           # Vitest unit tests
npm run lint       # ESLint
npm run lint:deps  # dependency-cruiser module boundary check
npm run build      # Production build
npx tsc --noEmit   # TypeScript type check only
```

---

## License

Private — all rights reserved.
