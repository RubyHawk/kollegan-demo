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
- **Staff authentication** — JWT-secured admin dashboard
- **n8n workflow automation** — business process orchestration across all modules

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1 (App Router) |
| UI | React 19, TailwindCSS 4, Framer Motion 12 |
| Database | PostgreSQL 18+ via Prisma 7 (driver adapter) |
| State | Zustand 5, SSE (real-time) |
| Auth | JWT (jose), bcrypt |
| Cache / Rate limiting | Redis (ioredis) |
| Voice AI | Vapi Web SDK + webhook handlers |
| Automation | n8n (self-hosted or cloud) |
| Calendar | Google Calendar API (service account) |
| UI Primitives | Radix UI |
| Testing | Vitest + supertest |

---

## Architecture

### Principles

1. **Automation-first** — every domain event can trigger a workflow; no module is exempt
2. **Vertical slice architecture** — each module owns its types, components, service, repository, and events
3. **Clean separation** — HTTP layer (`app/api/`) is thin; business logic lives in `features/*/service.ts`
4. **Infrastructure adapters** — every external service (Vapi, Slack, n8n, LLM) is behind an adapter interface; swap vendor, not code
5. **Multi-tenant from row 1** — `organizationId` on every table, enforced at query layer
6. **Event-driven by design** — in-process event bus today, extractable to message queue when needed

### Directory Structure

```
src/
├── app/                          Next.js App Router (routing + HTTP layer ONLY)
│   ├── api/                      Thin route handlers — delegate to features
│   │   ├── ai/                   Vapi AI tool endpoints (availability, booking, CRM)
│   │   ├── rooms/                Room CRUD
│   │   ├── staff/                Staff user management
│   │   ├── calendar/             Google Calendar sync
│   │   ├── n8n/                  n8n webhook receivers
│   │   ├── sse/                  Server-Sent Events stream
│   │   ├── docs/                 OpenAPI spec + Swagger UI
│   │   └── demo/                 Demo seed endpoints
│   ├── layout.tsx                Root layout (fonts, providers, body)
│   ├── page.tsx                  Main dashboard page
│   └── providers.tsx             React context providers
│
├── features/                     Business modules — vertical slices
│   │
│   ├── automation/      [CORE ★] Workflow engine, tool registry, triggers, memory
│   ├── voice/           [CORE ★] Vapi phone agent + LLM-callable ai-tools
│   │   └── ai-tools/             Tool handlers registered into the automation tool registry
│   │
│   ├── identity/        [PLANNED] Orgs, members, auth, RBAC
│   ├── crm/                      Customer profiles, call history, segments
│   ├── leads/           [PLANNED] Pipeline, scoring, lead-to-customer conversion
│   ├── offers/          [PLANNED] Quotation builder, PDF, e-signature
│   │
│   ├── integrations/    [PLANNED] Connector registry (Slack, GitHub, webhooks)
│   │
│   ├── hotel/                    Hotel demo vertical (one domain, two sub-domains)
│   │   ├── rooms/                Room availability, bookings, calendar
│   │   ├── services/             Restaurants, amenities, activities
│   │   └── index.ts              Combined barrel export
│   │
│   ├── team-hub/        [PLANNED] SaaS collaboration hub
│   │   ├── workspace/            Multi-tenant workspaces, members, billing
│   │   ├── integrations/github/  GitHub App: PRs, issues, CI status
│   │   ├── integrations/slack/   Slack App: channels, notification rules
│   │   ├── meetings/             Video + AI transcription + Claude summaries
│   │   └── announcements/        Internal comms — pinned notices, policy updates
│   │
│   ├── activity/                 Cross-module audit trail + real-time SSE feed
│   └── dashboard/                Shell UI (header, sidebar, setup, splash)
│
├── core/                         Application core — framework-agnostic utilities
│   ├── auth/                     JWT token management, Vapi webhook auth
│   ├── cache/                    Redis client, sliding-window rate limiter
│   ├── database/                 Prisma client singleton
│   ├── logging/                  Structured logger
│   ├── resilience/               Exponential-backoff retry wrapper
│   └── api/                      OpenAPI specification
│
├── infrastructure/               External system adapters
│   ├── calendar/                 Google Calendar API client
│   ├── persistence/              JSON file store (dev/demo fallback)
│   └── sse/                      Server-Sent Events manager
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
| `@features/*` | `src/features/*` | Domain module imports |
| `@shared/*` | `src/shared/*` | Shared UI and utilities |
| `@core/*` | `src/core/*` | Auth, DB, cache, logging |
| `@infra/*` | `src/infrastructure/*` | External service adapters |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 18+
- Redis (optional — rate limiting fails open without it)
- Vapi account (for voice features)
- Google Cloud service account (for calendar sync)
- n8n instance (for workflow automation)

### Installation

```bash
git clone <repo>
cd kollegan-demo
npm install
cp .env.local.example .env.local
# Fill in .env.local values
npx prisma migrate dev
npm run dev
```

The app runs at `http://localhost:3000`.

### Environment Variables

See `.env.local.example` for all required variables:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/kollegan
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-here

# Vapi (voice AI)
VAPI_WEBHOOK_SECRET=your-vapi-webhook-secret
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your-vapi-public-key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your-assistant-id

# Google Calendar (service account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_CALENDAR_ID=...

# App URL (for OpenAPI server URL)
NEXTJS_PUBLIC_URL=https://your-domain.com
```

### Database Setup

```bash
npx prisma migrate dev --name init
# Seed demo staff
curl -X POST http://localhost:3000/api/demo/seed-staff
# Explore data
npx prisma studio
```

---

## Adding a New Module

### 1. Create the feature folder

```
src/features/my-module/
├── components/
│   └── my-tab.tsx
├── service.ts           Business logic — all domain rules live here
├── repository.ts        Database queries — no Prisma outside this file
├── events.ts            Domain event definitions + publish helpers
├── register.ts          Self-registration: tools, event listeners
├── api.ts               Client-side fetch wrappers (for React)
├── lib/
│   └── my-store.ts      Zustand store (if real-time UI state needed)
├── types.ts             TypeScript domain types
└── index.ts             Public barrel — ONLY export what other modules need
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
└── [id]/route.ts        GET/PUT/DELETE
```

Route handlers must be thin — delegate immediately to `@features/my-module/service.ts`.

### 4. Register in the sidebar

Edit `src/features/dashboard/components/dashboard-sidebar.tsx`:
- Add to `Tab` type
- Add to `NAV_ITEMS` array

### 5. Add to page.tsx

```tsx
import MyTab from '@features/my-module/components/my-tab';

{activeTab === 'my-module' && (
  <motion.div key="my-module" {...TAB_TRANSITION}>
    <MyTab />
  </motion.div>
)}
```

---

## Integration Architecture

### Vapi Voice AI

```
Caller → Vapi → LLM tool call → Our API endpoint → Business logic → DB + SSE
```

AI tool functions: `src/features/voice/ai-tools/`
Auth: `x-vapi-secret` header → `@core/auth/vapi-auth`
Rate limiting: Redis sliding window → `@core/cache/rate-limiter`

### n8n Automation

```
n8n Workflow → POST /api/n8n/crm → Domain logic → SSE broadcast
```

Workflow file: `n8n/vapi-hotel-workflow.json`

### Google Calendar

```
Booking created → calendar.ts → Google Calendar API → Event created
```

Adapter: `src/infrastructure/calendar/google-calendar.ts`
Retry: `@core/resilience/with-retry`

### Real-time Dashboard (SSE)

```
Any state change → SSE Manager → Event stream → Zustand → UI
```

Manager: `src/infrastructure/sse/sse-manager.ts`
Client: `src/shared/hooks/use-sse.ts`

---

## Module Roadmap

| Module | Domain | Status | Description |
|---|---|---|---|
| Voice AI | Core | Live | Vapi phone receptionist + LLM tool calls |
| Hotel rooms | Generic | Live | Availability, bookings, real-time status |
| Hotel services | Generic | Live | Restaurants, amenities, activities |
| CRM | Supporting | Live (basic) | Customer profiles, call history |
| Activity log | Generic | Live | Cross-module audit trail |
| Automation engine | Core | Planned | Workflow definitions, step executor, tool registry |
| Identity / Orgs | Supporting | Planned | Multi-tenancy, RBAC, org management |
| Lead management | Supporting | Planned | Pipeline, scoring, conversion |
| Offer builder | Supporting | Planned | Quotations, PDF, e-signature |
| Team hub | Generic | Planned | SaaS workspace: GitHub, Slack, AI meetings |
| Billing | Generic | Future | Stripe, seat limits, LLM usage billing |
| Analytics | Generic | Future | Occupancy, revenue, workflow volumes |
| Plugin API | Core | Future | External tool registration, third-party modules |

See `docs/ARCHITECTURE.md` for the full ERP vision, domain model, and 6–12 month roadmap.

---

## API Documentation

- **JSON spec:** `GET /api/docs`
- **Swagger UI:** `GET /api/docs/ui`

All AI tool endpoints require `x-vapi-secret` header.

---

## Development Guidelines

- TypeScript strict mode — no implicit `any`
- Absolute imports only — use path aliases, never deep relative paths
- Route handlers are thin — business logic lives in `@features/`
- Infrastructure adapters never import from `@features/`
- One Prisma client instance via `@core/database/prisma`

```bash
npm test           # Run all tests
npm run lint       # ESLint
npm run build      # Production build
```

---

## License

Private — all rights reserved.
