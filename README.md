# Kollegan ERP Platform

A modular, scalable ERP platform built on Next.js 16 + React 19. Currently ships as a **hotel management demo** integrating Vapi AI voice, n8n automation, and Google Calendar — but the architecture is designed from day one for full ERP expansion.

> **Vision:** A single, extensible platform covering hotel operations, CRM, lead management, quotation builders, team collaboration, AI integrations, and more — all in one cohesive system.

---

## Current Scope — Hotel Demo

The live demo powers a real hotel front desk:

- **Voice AI receptionist** (Vapi) — takes calls, books rooms, updates CRM
- **Real-time room dashboard** — live availability via Server-Sent Events
- **Bookings calendar** — week/month timeline with Google Calendar sync
- **CRM & activity log** — call transcripts, customer profiles, booking history
- **Hotel services** — manage restaurants, amenities, and activities
- **Staff authentication** — JWT-secured admin dashboard
- **n8n workflow automation** — webhook-driven business process automation

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

1. **Vertical slice architecture** — each ERP module is self-contained (types, components, API logic, stores)
2. **Clean separation** — HTTP layer (`app/api/`) is thin; business logic lives in `features/` and `core/`
3. **Infrastructure adapters** — external services (Google, n8n, Vapi) are isolated in `infrastructure/`
4. **Shared kernel** — common UI, hooks, and utilities in `shared/`
5. **ERP-ready stubs** — future modules are scaffolded with types and documentation from day one

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
├── features/                     ERP Domain Modules — one folder per vertical
│   ├── activity/                 Activity log / audit trail
│   ├── crm/                      Customer relationship management
│   ├── dashboard/                Dashboard shell (header, sidebar, setup, splash)
│   ├── hotel/                    Hotel vertical (one domain, two sub-domains)
│   │   ├── rooms/                Room availability, bookings, calendar
│   │   ├── services/             Restaurants, amenities, activities
│   │   └── index.ts              Combined barrel export for the hotel vertical
│   ├── voice/                    Voice AI (Vapi) + ai-tools (LLM-callable functions)
│   │   └── ai-tools/             Functions called by Vapi during phone calls
│   │
│   ├── leads/           [PLANNED] Lead management & pipeline tracking
│   ├── offers/          [PLANNED] Quotation / proposal builder
│   └── team-hub/        [PLANNED] SaaS collaboration hub
│       ├── workspace/            Multi-tenant workspaces, members, billing, invites
│       ├── integrations/
│       │   ├── github/           GitHub App: PRs, issues, CI status
│       │   └── slack/            Slack App: channel feed, notification rules
│       ├── meetings/             Video calls + AI transcription + Claude summaries
│       └── announcements/        Internal comms — pinned notices, policy updates
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

## Adding a New ERP Module

### 1. Create the feature folder

```
src/features/my-module/
├── components/
│   └── my-tab.tsx
├── api.ts               Client-side fetch wrappers
├── lib/
│   └── my-store.ts      Zustand store (if real-time state needed)
├── types.ts             TypeScript domain types
└── index.ts             Public barrel export
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

Route handlers must be thin — business logic goes in `@features/my-module/`.

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

## ERP Module Roadmap

| Module | Status | Description |
|---|---|---|
| Hotel (`hotel/rooms/`) | Live | Availability, bookings, real-time status |
| Hotel services (`hotel/services/`) | Live | Restaurants, amenities, activities |
| Voice AI | Live | Vapi phone receptionist |
| CRM | Live (basic) | Customer profiles, call history |
| Activity log | Live | Full audit trail |
| Lead management | Planned | Pipeline, scoring, assignment |
| Offer builder | Planned | Quotations, PDF, e-signature |
| Team hub | Planned | SaaS workspace: GitHub, Slack, AI meetings, announcements |
| Invoicing | Future | Invoice generation, payment tracking |
| Analytics | Future | Occupancy trends, revenue, forecasting |
| Multi-property | Future | Multiple locations |

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
