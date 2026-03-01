# Platform Architecture — Kollegan

> **Framing:** We are building an AI-driven business automation platform. Workflows and agents are
> the core product. CRM, leads, offers, and ERP modules are value-add layers that feed into and
> benefit from automation — not the other way around.
>
> Written for architects and senior engineers. Think in years, not sprints. Be critical.

---

## Table of Contents

1. [Vision & Strategic Positioning](#1-vision--strategic-positioning)
2. [Domain Classification (DDD)](#2-domain-classification-ddd)
3. [Modular Monolith Strategy](#3-modular-monolith-strategy)
4. [Module Communication Patterns](#4-module-communication-patterns)
5. [Multi-Tenancy Strategy](#5-multi-tenancy-strategy)
6. [Event-Driven Architecture Evolution](#6-event-driven-architecture-evolution)
7. [Integration Architecture](#7-integration-architecture)
8. [AI & Automation Platform](#8-ai--automation-platform)
9. [Plugin & Extension Strategy](#9-plugin--extension-strategy)
10. [Scalability & Microservices Readiness](#10-scalability--microservices-readiness)
11. [Data, Observability & Audit Strategy](#11-data-observability--audit-strategy)
12. [Development Workflow](#12-development-workflow)
13. [Risks & Technical Debt](#13-risks--technical-debt)
14. [6–18 Month Roadmap](#14-618-month-roadmap)

---

## 1. Vision & Strategic Positioning

### What we are

An **AI-native business automation platform**. We sell workflows, voice agents, and automation
primitives. CRM, leads, hotel management, and team tools are modules that sit on top of and
integrate with the automation core — they are compelling value-add features, not the product.

This distinction matters architecturally: the automation engine must never depend on CRM or leads.
CRM and leads depend on automation.

### Core tenets

| # | Tenet | What it means in practice |
|---|---|---|
| 1 | **Automation-first** | Every domain event can trigger a workflow. No module is exempt. |
| 2 | **Module isolation** | Modules own their data. Cross-module reads go through a service interface, not a SQL join. |
| 3 | **AI is infrastructure** | LLM calls, embeddings, vector search — these are infrastructure concerns, not feature code. |
| 4 | **Multi-tenant from row 1** | `organizationId` on every table, enforced at the query layer, never bolted on later. |
| 5 | **Events over coupling** | Prefer publishing a domain event over calling another module's service directly. |
| 6 | **Adapters over integrations** | Every external service (Vapi, Slack, n8n, GitHub) is behind an adapter. Swap the vendor, not the code. |
| 7 | **Extraction readiness** | Structure modules so any one of them can become a separate service. Don't need to, but must be able to. |

---

## 2. Domain Classification (DDD)

DDD categorizes domains by strategic value. This determines where you invest in design quality.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CORE DOMAINS                                  │
│         Highest strategic value — your competitive moat              │
├──────────────────────────┬───────────────────────────────────────────┤
│  AUTOMATION / WORKFLOWS  │           VOICE & AGENTS                  │
│  ─────────────────────   │  ──────────────────────────               │
│  Workflow definitions    │  Vapi phone agent                         │
│  Step execution engine   │  LLM tool orchestration                   │
│  Trigger system          │  Call lifecycle management                │
│  Run history & replay    │  Transcript processing                    │
│  Memory/context store    │  Agent routing & handoff                  │
└──────────────────────────┴───────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                      SUPPORTING DOMAINS                              │
│     Important, but not your moat — solid DDD, not heroic             │
├──────────┬──────────┬──────────┬──────────┬───────────────────────── │
│   CRM    │  LEADS   │  OFFERS  │ IDENTITY │   INTEGRATIONS           │
│ Contacts │ Pipeline │ Quotes   │ Auth     │   Connectors             │
│ History  │ Scoring  │ PDF/Sign │ Orgs     │   Webhooks               │
│ Segments │ Assign   │ Delivery │ Roles    │   OAuth flows            │
└──────────┴──────────┴──────────┴──────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                       GENERIC DOMAINS                                │
│     Commodity — implement simply, consider off-the-shelf             │
├──────────────┬───────────────┬──────────────┬─────────────────────── │
│  TEAM HUB    │   VERTICALS   │   BILLING    │   ANALYTICS            │
│ GitHub/Slack │ Hotel demo    │ Stripe/Lemon │ Occupancy, revenue     │
│ AI meetings  │ Future SaaS   │ Seat limits  │ Funnel reporting       │
│ Announce.    │ demos         │ Feature flags│ LLM usage costs        │
└──────────────┴───────────────┴──────────────┴────────────────────────┘
```

### Why classification matters

- **Core domains** get the most rigorous architecture: clean domain models, rich events, full test coverage. This is where you build moats.
- **Supporting domains** get solid structure but pragmatic shortcuts are acceptable. Import the CRM service, don't re-architect it.
- **Generic domains** can be 80% scaffolding. Buy a billing library (Stripe, LemonSqueezy). Don't build invoicing from scratch.

### Domain dependency rule

```
Generic  →  can import  →  Supporting  →  can import  →  Core
Core  MUST NOT  import from Supporting or Generic
Supporting  MUST NOT  import from Generic (except identity/billing)
```

This is enforced by convention and linting (see §12). If `automation/` ever imports `crm/`, that's
an architecture violation.

---

## 3. Modular Monolith Strategy

### Directory structure

```
src/
├── app/                          Next.js App Router — HTTP layer ONLY
│   └── api/                      Thin handlers, delegate to module application services
│
├── modules/                      Business modules — DDD classified
│   │
│   ├── core/                     ★ Core domains — your competitive moat
│   │   ├── automation/           Workflow engine, tool registry, triggers
│   │   └── voice/                Vapi phone agent, LLM tool calls, call lifecycle
│   │
│   ├── supporting/               Supporting domains — solid DDD, pragmatic shortcuts OK
│   │   ├── auth/                 Unified user model, sessions, MFA (TOTP+WebAuthn), RBAC
│   │   ├── crm/                  Customer profiles, call transcripts, CRM records
│   │   ├── leads/                Lead pipeline, stage transitions, activities, conversion
│   │   ├── audit/                Append-only audit trail (SOC 2)
│   │   ├── identity/             Organizations, org settings, multi-tenancy
│   │   └── offers/               Quotation builder (stub)
│   │
│   └── generic/                  Generic domains — commodity, keep simple
│       ├── dashboard/            Shell UI — header, sidebar, navigation
│       └── team-hub/             SaaS collaboration (GitHub, Slack, meetings)
│
├── demos/                        Sales / showcase verticals (never rename or move)
│   └── hotel/                    Hotel AI Receptionist demo
│
├── core/                         Framework-agnostic application utilities
│   ├── api/                      createHandler() pipeline, RFC 9457 errors, response helpers
│   ├── auth/                     JWT sign/verify, Vapi webhook auth, token blacklist
│   ├── cache/                    Redis client, rate limiter
│   ├── database/                 Prisma singleton
│   ├── events/                   In-process typed event bus
│   ├── logging/                  Structured logger
│   ├── queue/                    Background job queue
│   └── resilience/               Retry, circuit breaker
│
├── infrastructure/               External system adapters
│   ├── calendar/                 Google Calendar
│   ├── sse/                      Server-Sent Events manager
│   └── persistence/              JSON fallback store
│
└── shared/                       Cross-cutting UI + utilities
    ├── ui/
    ├── hooks/
    ├── lib/
    ├── stores/
    └── styles/
```

### Module internal structure

Every non-trivial module follows DDD layering:

```
modules/supporting/my-module/
├── domain/              Pure TypeScript types — no DB, no HTTP, no imports from outside domain/
│   └── my-entity.ts
├── application/         Business logic — orchestrates domain + infrastructure
│   └── my.service.ts    ★ All business rules live here
├── infrastructure/      All database access — no Prisma outside this layer
│   └── my.repository.ts ★ All Prisma queries
├── api/
│   └── handlers/        Thin HTTP handlers — delegate to application service
│       └── my.handler.ts
├── events/              Domain event type definitions
│   └── my.events.ts
├── ui/                  React components (optional — only for display modules)
│   └── components/
└── index.ts             Public barrel — ONLY export what other modules need
```

The `index.ts` is the **module contract**. Other modules may only import from `index.ts`, never
from internal paths (`application/`, `infrastructure/`, `domain/`). Enforced by dependency-cruiser.

### The service layer

```typescript
// modules/supporting/crm/application/crm.service.ts — business logic only
export async function upsertCustomerFromCall(
  orgId: string,
  data: CrmUpdateInput,
): Promise<CrmUpdateResult> {
  const customer = await upsertCustomer({ ...data, organizationId: orgId });
  eventBus.publish<CrmContactUpsertedEvent>({ type: CRM_CONTACT_UPSERTED, orgId, ... });
  return { success: true, customerId: customer.id };
}

// modules/supporting/crm/infrastructure/contact.repository.ts — database only
export async function upsertCustomer(input: UpsertCustomerInput): Promise<Customer> {
  return prisma.customer.upsert({
    where: { phone: input.phone },
    create: { ...input, organizationId: input.organizationId },
    update: { ...input },
  });
}
```

This separation means:
- Service is unit-testable without a database
- Repository is swappable (different DB, caching layer)
- Business rules never leak into route handlers

---

## 4. Module Communication Patterns

Three legitimate patterns. Use them in priority order:

### Pattern 1 — Direct service call (synchronous)

Use when: module A needs data from module B as part of a user request.

```typescript
// Allowed: CRM auto-creates a lead for new voice-call customers
import { createLead } from '@modules/supporting/leads';  // public index.ts only

await createLead({ organizationId: orgId, name, source: 'voice_call' }, 'system');
```

Rule: only import from `@modules/<layer>/<module>/index.ts`, never from internal files.

### Pattern 2 — Domain events (async, decoupled)

Use when: something happened in module A, and module B should react — but A doesn't need to know B exists.

```typescript
// modules/supporting/leads/application/leads.service.ts
eventBus.publish<LeadConvertedEvent>({
  type: LEAD_CONVERTED,
  orgId,
  occurredAt: new Date().toISOString(),
  payload: { leadId: lead.id, customerId, convertedBy: actorId },
});

// modules/core/automation/ — subscribes in instrumentation.ts
eventBus.subscribe(LEAD_CONVERTED, async (event) => {
  await automationEngine.triggerWorkflow('lead_converted', event);
});
```

Neither `leads` nor `crm` imports each other. Automation doesn't know CRM exists.
This is the target pattern for cross-domain side effects.

### Pattern 3 — n8n orchestration (async, external)

Use when: multi-step business process spanning multiple systems (email + CRM + Slack + wait-for-reply).

```
Domain event → webhook → n8n workflow → our API endpoints + external services
```

n8n is the escape valve for complex, stateful, multi-system processes. Don't replicate its
orchestration capability inside the app.

### What is never allowed

```typescript
// ❌ Never — direct cross-module internal import (bypass index.ts)
import { leadsRepository } from '@modules/supporting/leads/infrastructure/leads.repository';

// ❌ Never — HTTP call to your own API from inside a module
fetch('/api/leads/123');  // from inside crm/ application service

// ❌ Never — shared mutable state between modules
import { leadsStore } from '@modules/supporting/leads/lib/leads-store';  // from crm/
```

---

## 5. Multi-Tenancy Strategy

### Decision: Row-Level Isolation with PostgreSQL RLS

**Chosen approach:** `organizationId` on every tenant-owned table, enforced by PostgreSQL
Row Level Security (RLS) policies, with additional application-layer checks.

**Why not schema-per-tenant:**
- Prisma has limited multi-schema support today
- Schema creation/migration per new org is operationally complex
- At current scale, row isolation is sufficient and fast with proper indexing

**Why not application-only filtering:**
- A single missing `WHERE organizationId = ?` leaks all tenant data
- RLS provides defense-in-depth at the database layer

### Implementation

```sql
-- Every tenant-owned table gets RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON customers
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Set at connection time (via Prisma middleware)
SET LOCAL app.current_org_id = 'org_abc123';
```

```typescript
// core/database/prisma.ts — set org context on every request
export function withOrgContext(orgId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          await prisma.$executeRaw`SET LOCAL app.current_org_id = ${orgId}`;
          return query(args);
        },
      },
    },
  });
}
```

### Prisma schema conventions

```prisma
// Every tenant-owned model includes:
model Customer {
  id             String   @id @default(uuid())
  organizationId String   // ← NEVER nullable on tenant data
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])           // ← always index this
  @@index([organizationId, createdAt]) // ← compound index for list queries
}

// Table naming: module prefix
// hotel_*    → hotel module
// crm_*      → CRM module
// lead_*     → leads module
// wf_*       → automation/workflow module
// org_*      → identity/org module
// voice_*    → voice/agent module
```

### Postgres indexing rules

1. Every `organizationId` column gets an index
2. Every `organizationId` + `createdAt` pair gets a compound index (list queries always sort by time)
3. Every foreign key gets an index (Prisma doesn't add these automatically)
4. Every `status` or `stage` column used in `WHERE` clauses: add `[organizationId, status]` compound
5. `EXPLAIN ANALYZE` any query touching > 10k rows before shipping it

### Data ownership

| Concern | Rule |
|---|---|
| Each org's data | Never leaves org boundary without explicit `organizationId` scoping |
| Cross-org reads | Forbidden at application layer; blocked by RLS |
| Admin/system | Use a separate Prisma client without RLS for internal jobs |
| Billing events | Stored separately from business data; org is billed, not queried |
| Backups | Per-org export is a feature to build; full DB dumps are operational |

---

## 6. Event-Driven Architecture Evolution

### Phase 1 — In-process event bus (now)

Start with a typed, in-process EventEmitter. Zero infrastructure, same process:

```typescript
// core/events/event-bus.ts
import { EventEmitter } from 'events';

type EventHandler<T> = (event: T) => Promise<void>;

class EventBus {
  private emitter = new EventEmitter();

  publish<T extends DomainEvent>(event: T): void {
    this.emitter.emit(event.type, event);
    // Fire-and-forget: errors in listeners must be caught and logged internally
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
  ): void {
    this.emitter.on(eventType, async (event: T) => {
      try {
        await handler(event);
      } catch (err) {
        logger.error({ event, err }, 'Event handler failed');
      }
    });
  }
}

export const eventBus = new EventBus();
```

```typescript
// core/events/domain-event.ts
export interface DomainEvent {
  type: string;          // e.g. 'lead.converted'
  orgId: string;
  occurredAt: string;    // ISO 8601
  payload: unknown;
}

// Module-specific events (in modules/<layer>/<module>/events/)
// e.g. modules/supporting/leads/events/lead.events.ts
export const LEAD_CONVERTED = 'lead.converted' as const;
export interface LeadConvertedEvent extends DomainEvent {
  type: typeof LEAD_CONVERTED;
  payload: { leadId: string; customerId: string; convertedBy: string };
}
```

### Phase 2 — Persisted event log (3–6 months)

When you need: replay, audit, guaranteed delivery, cross-request correlation.

Add an `events` table:

```prisma
model DomainEventRecord {
  id          String   @id @default(uuid())
  type        String
  orgId       String
  aggregateId String   // The entity this event is about (leadId, customerId...)
  payload     Json
  occurredAt  DateTime
  processedAt DateTime?

  @@index([orgId, type])
  @@index([orgId, occurredAt])
  @@index([aggregateId])
}
```

The in-process bus writes to this table. Listeners can be re-run from history.
This is your foundation for event sourcing patterns — without the full complexity of ES upfront.

### Phase 3 — Message queue (6–12 months, when needed)

When in-process fan-out causes latency problems, or you need durable async:

```
BullMQ (Redis-backed) → workers process jobs from the queue
```

The domain event interface stays identical. Only the `EventBus.publish()` implementation
changes — instead of `emitter.emit()`, it calls `queue.add()`.

The feature code that publishes and subscribes never changes.

### Phase 4 — Extract to message broker (12+ months, if needed)

When: multiple services need to share events.

```
Redis Streams → pub/sub at service boundary
or
NATS / RabbitMQ if you need complex routing
```

Again: feature code doesn't change. Infrastructure swaps under the bus abstraction.

### Background jobs

```typescript
// core/queue/job-queue.ts
export const jobQueue = {
  async add<T>(jobType: string, payload: T, options?: JobOptions): Promise<void> {
    // Phase 1: in-process setTimeout (acceptable for demos)
    // Phase 2: BullMQ job
    // Phase 3: distributed queue
  }
};

// Usage (automation/engine/workflow-runner.ts)
await jobQueue.add('workflow.run', { workflowId, triggerPayload, orgId });
```

Job types to implement early:
- `workflow.run` — execute an automation workflow
- `transcript.process` — send recording to transcription service
- `summary.generate` — send transcript to LLM for summary
- `email.send` — dispatch email (n8n or direct)
- `report.generate` — heavy analytics queries

---

## 7. Integration Architecture

### Adapter pattern — hard rule

Every external service is behind an adapter interface. The application calls the interface.
The concrete implementation lives in `src/infrastructure/`.

```typescript
// infrastructure/ai/types.ts — the interface (never changes)
export interface LLMProvider {
  complete(prompt: string, options?: LLMOptions): Promise<string>;
  embed(text: string): Promise<number[]>;
}

// infrastructure/ai/claude-adapter.ts — one implementation
export class ClaudeAdapter implements LLMProvider { ... }

// infrastructure/ai/openai-adapter.ts — another
export class OpenAIAdapter implements LLMProvider { ... }

// Features use the interface, not the adapter
import type { LLMProvider } from '@infra/ai/types';
```

### Integration registry

Each integration has:

```
src/infrastructure/<integration>/
├── types.ts         Interface that the adapter implements
├── adapter.ts       Concrete implementation
├── webhook.ts       Incoming webhook handler (signature verification)
└── index.ts         Exports the interface + factory function
```

The factory reads env vars and returns the configured adapter. Features never touch env vars directly.

### Current integrations

| Integration | Purpose | Adapter location | Webhook receiver |
|---|---|---|---|
| Vapi | Voice AI, phone calls | `@infra/vapi/` | `/api/ai/*` |
| n8n | Workflow orchestration | `@infra/n8n/` | `/api/n8n/*` |
| Google Calendar | Event sync | `@infra/calendar/` | None (polling) |
| LLM (Claude/GPT) | Summaries, tools | `@infra/ai/` | None |

### Planned integrations

| Integration | Purpose | Webhook receiver |
|---|---|---|
| Slack | Team notifications, slash commands | `/api/integrations/slack/events` |
| GitHub | PR/issue/CI feed in Team Hub | `/api/integrations/github/webhook` |
| Stripe | Billing, subscriptions | `/api/integrations/stripe/webhook` |
| Resend/SMTP | Transactional email | None (outbound only) |
| Deepgram/Whisper | Meeting transcription | None (outbound only) |
| S3-compatible | Recording/file storage | None |

### Webhook security — non-negotiable

Every inbound webhook verifies its signature before any processing:

```typescript
// core/auth/webhook-verify.ts
export function verifySlackSignature(req: Request): boolean {
  const sig = req.headers.get('x-slack-signature');
  const ts  = req.headers.get('x-slack-request-timestamp');
  const body = await req.text();
  const expected = `v0:${ts}:${body}`;
  return crypto.timingSafeEqual(
    Buffer.from(sig),
    Buffer.from(hmac('sha256', SLACK_SIGNING_SECRET, expected)),
  );
}
```

Fail before parsing body. Never process unauthenticated payloads.

### Avoiding vendor lock-in

- Never import `Anthropic` SDK directly in feature code — always via `@infra/ai/`
- Never import `Slack` SDK in feature code — always via `@infra/slack/`
- n8n workflows are version-controlled in `n8n/` — treat them like migrations
- If a vendor changes its API, only the adapter file changes

---

## 8. AI & Automation Platform

This is the core domain. It deserves the most architectural investment.

### Automation engine concepts

```
Workflow = a directed graph of Steps, triggered by an Event or Schedule
Step     = an atomic unit of work (call tool, send message, wait, branch, LLM call)
Run      = a single execution of a Workflow with a specific trigger payload
Memory   = persistent context available to agents across runs
Tool     = a function callable by an LLM during a run
```

### Data model

```prisma
model Workflow {
  id             String         @id @default(uuid())
  organizationId String
  name           String
  description    String?
  trigger        Json           // TriggerConfig (event name, schedule, webhook)
  steps          Json           // StepConfig[] — the DAG definition
  isActive       Boolean        @default(true)
  version        Int            @default(1)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  runs           WorkflowRun[]
  @@index([organizationId, isActive])
}

model WorkflowRun {
  id             String         @id @default(uuid())
  organizationId String
  workflowId     String
  status         RunStatus      // pending | running | completed | failed | cancelled
  trigger        Json           // What triggered this run
  context        Json           // Current execution state (step outputs, variables)
  startedAt      DateTime       @default(now())
  completedAt    DateTime?
  error          String?
  steps          WorkflowRunStep[]
  @@index([organizationId, workflowId, status])
}

model WorkflowRunStep {
  id          String     @id @default(uuid())
  runId       String
  stepId      String     // References step in workflow.steps DAG
  status      StepStatus // pending | running | completed | failed | skipped
  input       Json?
  output      Json?
  startedAt   DateTime   @default(now())
  completedAt DateTime?
  error       String?
  retryCount  Int        @default(0)
}
```

### Tool registry

The tool registry is a map of name → async function. All LLM-callable tools register here:

```typescript
// features/automation/tools/registry.ts
type ToolFn = (args: unknown, ctx: RunContext) => Promise<unknown>;

const tools = new Map<string, ToolFn>();

export function registerTool(name: string, fn: ToolFn): void {
  tools.set(name, fn);
}

export function getTool(name: string): ToolFn | undefined {
  return tools.get(name);
}

// features/crm/tools.ts — CRM registers its tools on startup
registerTool('crm.find_customer', async (args, ctx) => {
  return crmService.findByEmail(ctx.orgId, args.email);
});

// features/hotel/rooms/tools.ts
registerTool('hotel.check_availability', async (args, ctx) => {
  return roomService.checkAvailability(ctx.orgId, args.checkIn, args.checkOut);
});
```

This is the same tool registry used by Vapi's AI tool calls. Voice agents and automation
workflows share the same tool interface.

### Agent memory

```typescript
// features/automation/memory/types.ts
interface AgentMemory {
  sessionMemory: Record<string, unknown>;  // per-run, discarded after
  orgMemory: Record<string, unknown>;      // persisted per-org (preferences, history)
  vectorMemory?: VectorSearchResult[];     // semantic search over past interactions
}
```

Phase 1: key-value in Redis (session) + Postgres JSON (org).
Phase 2: pgvector for semantic memory (embeddings of past conversations + documents).

### LLM orchestration patterns

```
Simple tool call:    User input → LLM → tool call → result → LLM → response
ReAct loop:         User input → [LLM → tool → observe] × N → final answer
Parallel tools:     LLM requests multiple tools simultaneously → gather results → continue
Human in the loop:  Workflow pauses → sends notification → waits for approval → resumes
```

All of these are variations of the same workflow engine. The LLM decides which tools to call;
the engine executes them and returns results.

### Vapi → Automation bridge

```
Phone call → Vapi LLM → tool call → /api/ai/<tool>
                                         ↓
                               features/automation/tools/registry
                                         ↓
                               Domain logic + DB write + SSE event
                                         ↓
                               Optionally: trigger a workflow
```

The voice agent and the automation engine share the same tool registry. A Vapi tool call
can trigger a multi-step workflow (e.g., "book this room" → Workflow: create booking +
update CRM + send confirmation email + notify Slack).

---

## 9. Plugin & Extension Strategy

### Phase 1 — Internal module registration (now)

Modules self-register at startup. The core never has a hard import of feature code.

```typescript
// app/bootstrap.ts — runs at startup, not in route handlers
import '@features/crm/register';          // registers CRM tools + event listeners
import '@features/leads/register';        // registers leads tools + listeners
import '@features/hotel/rooms/register';  // registers hotel tools + listeners
import '@features/voice/register';        // registers voice tools

// features/crm/register.ts
import { registerTool } from '@features/automation/tools/registry';
import { eventBus }      from '@core/events/event-bus';
import { crmService }    from './service';
import { LeadConvertedEvent } from '@features/leads/events';

// Register tools
registerTool('crm.find_customer', ...);

// Subscribe to cross-module events
eventBus.subscribe(LeadConvertedEvent.type, async (event) => {
  await crmService.onLeadConverted(event);
});
```

### Phase 2 — External plugin interface (future)

When you want third-party modules or customer-specific extensions:

```typescript
// core/plugins/plugin-api.ts
export interface Plugin {
  id: string;
  name: string;
  version: string;
  register(api: PluginAPI): Promise<void>;
}

export interface PluginAPI {
  registerTool(name: string, fn: ToolFn): void;
  onEvent(type: string, handler: EventHandler): void;
  addApiRoute(path: string, handler: RouteHandler): void;
  getService<T>(token: ServiceToken<T>): T;
}
```

Third-party plugins get a sandboxed PluginAPI — they cannot reach Prisma directly or call
other plugins' internals.

### Versioning and isolation

- Tool names are namespaced: `crm.find_customer` not `find_customer`
- Event types are namespaced: `crm.contact_created` not `contact_created`
- Plugin IDs are scoped to vendor: `@acme/my-plugin`
- Breaking changes to tool signatures must bump the tool version: `crm.find_customer.v2`

---

## 10. Scalability & Microservices Readiness

### Don't extract prematurely. Do extract when you see these signals.

| Module | Extract when... |
|---|---|
| **Automation/Workflow** | Workflow runs cause DB contention with transactional queries; you need dedicated workers |
| **Voice/Vapi** | Call volume needs dedicated infrastructure; latency SLAs conflict with app deploys |
| **LLM/AI** | Token costs need separate tracking; LLM calls need dedicated rate limits/queues |
| **Analytics** | Reporting queries start degrading transactional performance; read replica isn't enough |
| **Billing** | Compliance requirements demand audit isolation; Stripe webhooks need dedicated processing |

### How to prepare now

1. **Service classes not static functions** — `new CrmService(repo, events)` can be deployed
   separately trivially. `crmService.createContact()` cannot if it directly imports Prisma.

2. **No shared state between modules** — each module's Zustand store is local. SSE is the
   only shared channel.

3. **Tool registry is stateless** — tools are pure functions over injected services. They can
   run in any process.

4. **HTTP-ready module contracts** — the `index.ts` public interface maps cleanly to a REST API.
   If `leadsService.createLead()` becomes a network call, feature code doesn't change.

5. **Event payloads are serializable** — all `DomainEvent.payload` must be JSON-serializable.
   Never put class instances or Promises in events.

### Infrastructure scaling path

```
Phase 1: Single Next.js process (now)
         └─ All modules, Postgres, Redis in one deployment

Phase 2: Separate background worker
         ├─ Next.js (HTTP + SSE)
         └─ Worker process (BullMQ consumers: workflow runs, transcription, LLM jobs)

Phase 3: Extract high-load modules
         ├─ Next.js (HTTP layer)
         ├─ Automation service (workflow engine)
         └─ Worker pool (parallel job execution)

Phase 4: Full service mesh (only if justified)
         ├─ API gateway
         ├─ Individual domain services
         └─ Event bus (NATS or Redis Streams)
```

---

## 11. Data, Observability & Audit Strategy

### Structured logging

```typescript
// core/logging/logger.ts — already exists, enforce everywhere
logger.info({ orgId, userId, action: 'booking.created', bookingId }, 'Booking created');

// Never:
console.log('booking created', booking);
```

Log format: JSON, always. Fields: `level`, `msg`, `orgId`, `userId`, `action`, `duration`,
`traceId`, `error?`. Ship to Datadog or Axiom in production.

### Request tracing

Add a `traceId` to every request and propagate it through the call stack:

```typescript
// app/api/middleware.ts
const traceId = crypto.randomUUID();
AsyncLocalStorage.run({ traceId, orgId }, () => next());
```

Every log line, every event, every job carries this trace ID.

### Audit trail

The `activity` feature is the audit trail. Every write operation across all modules should
emit an audit event:

```typescript
// Pattern: service emits audit event after every state change
await this.events.publish(new AuditEvent({
  orgId,
  actorId: userId,        // who did it
  action: 'lead.stage_changed',
  resourceType: 'Lead',
  resourceId: lead.id,
  before: { stage: 'new' },
  after: { stage: 'qualified' },
}));
```

The activity module subscribes to all `AuditEvent` types and persists them. This gives you:
- Complete audit trail for compliance
- Timeline view per entity
- Anomaly detection (future)
- Debug replays

### Analytics strategy

Phase 1: Materialized counts stored on parent records (e.g., `_count` via Prisma relations).
Phase 2: Dedicated `analytics_*` tables aggregated by nightly job. Never run OLAP queries on transactional tables.
Phase 3: ClickHouse or TimescaleDB sidecar for time-series data (LLM costs, workflow volumes, booking trends).

### LLM cost tracking

Every LLM call must record tokens used and cost:

```typescript
// infrastructure/ai/adapter.ts
const result = await llm.complete(prompt);
await jobQueue.add('billing.record_llm_usage', {
  orgId,
  model: result.model,
  inputTokens: result.usage.input_tokens,
  outputTokens: result.usage.output_tokens,
  costUsd: calculateCost(result),
});
```

You will need this for billing, rate limiting per org, and cost attribution.

---

## 12. Development Workflow

### Path aliases (tsconfig)

| Alias | Resolves to |
|---|---|
| `@features/*` | `src/features/*` |
| `@core/*` | `src/core/*` |
| `@infra/*` | `src/infrastructure/*` |
| `@shared/*` | `src/shared/*` |
| `@/*` | `src/*` (fallback only) |

### Linting module boundaries (add to ESLint config)

```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        {
          "group": ["@features/*/service", "@features/*/repository"],
          "message": "Import from the module's index.ts only."
        },
        {
          "group": ["@features/automation/*/node_modules"],
          "message": "Core domain must not import from supporting domains."
        }
      ]
    }]
  }
}
```

### Testing strategy

| Layer | What to test | Tool |
|---|---|---|
| `core/` | Auth, cache, retry logic | Vitest unit tests |
| `features/*/service.ts` | Business rules, edge cases | Vitest + mock repository |
| `features/*/repository.ts` | SQL correctness | Integration tests against test DB |
| `app/api/` | Request/response shape, auth | supertest |
| Workflows | Trigger → step → output | Integration tests with mocked tools |
| E2E | Critical user paths | Playwright (future) |

Target: >90% coverage on `core/` and `features/*/service.ts`. Lower bar acceptable on UI.

### Database migrations

```bash
# Development: always use migrate dev (creates migration file)
npx prisma migrate dev --name add_workflow_table

# Production: apply migrations (CI/CD step before deploy)
npx prisma migrate deploy

# Never use db push in any environment resembling production
```

Migration files are code. Review them in PRs. Never edit a deployed migration.

### Branching strategy

```
main          Protected. Production. Linear history.
develop       Integration. All features merge here first.
feature/*     Feature branches. Short-lived (< 1 week).
fix/*         Bug fixes.
chore/*       Deps, docs, config.
claude/*      AI-assisted development sessions.
```

### CI/CD pipeline (recommended)

```yaml
quality:
  - npx tsc --noEmit          # type check
  - npm run lint               # ESLint
  - npm test                   # Vitest
  - npm run build              # Next.js build

deploy:
  trigger: merge to main
  steps:
    - npx prisma migrate deploy
    - Deploy to Vercel or Docker
    - Run smoke tests against production
```

---

## 13. Risks & Technical Debt

### Critical risks

**R1 — No isolation around Prisma yet**
Every feature can call `prisma` directly. One missing `WHERE organizationId = ?` leaks all tenant data.
Fix: add the `withOrgContext()` Prisma extension. Enforce it in code review. No query
should reach the DB without org scoping.

**R2 — `src/lib/` shim layer will rot**
`src/lib/*.ts` files are shims pointing to `src/core/*`. Developers will eventually import both.
Fix: delete `src/lib/` entirely after confirming zero references. Don't leave the ladder hanging.

**R3 — Event bus is in-process (no persistence, no retry on handler failure)**
`core/events/event-bus.ts` exists and is used. However, events are fire-and-forget in the same
process. A handler failure does not retry, and events are lost on restart.
Fix: persist events to `evt_domain_events` before Phase 4 automation work. BullMQ is already
available (ioredis installed).

**R4 — LLM calls are synchronous in the request path**
Any timeout or provider outage blocks the HTTP response.
Fix: wrap all LLM calls in `jobQueue.add('llm.complete', ...)` before they're in production flows.

**R5 — Multi-tenancy enforcement is application-layer only**
`organizationId` is on all tenant tables and queries filter by it in every repository.
PostgreSQL RLS policies have not yet been applied — defense-in-depth at the DB layer is missing.
Fix: Enable RLS on `wf_*` tables first (cleanest — all have non-nullable orgId), then extend.

### Technical debt to avoid

1. **Never put Prisma calls in route handlers.** They belong in `infrastructure/` repositories.

2. **Never import from a module's internal layers.** Public interface is `index.ts` only — never import from `application/`, `infrastructure/`, or `domain/` directly.

3. **Never store secrets in code.** `.env.local` for development; Doppler/Vault in production.

4. **Never let tools grow inside route handlers.** Vapi tools live in `modules/core/voice/ai-tools/`. New LLM-callable tools belong in the automation tool registry.

5. **Never build synchronous analytics queries.** Any `COUNT(*)`, `GROUP BY`, or multi-join reporting query gets its own background job and materialized result.

6. **Never add workflow logic to n8n that should be in the app.** n8n handles orchestration between systems. Business rules (e.g., lead scoring) belong in the service layer.

7. **Never share Zustand stores between modules.** State isolation is part of module isolation.

8. **Never skip OpenAPI updates when adding AI tools.** Vapi's LLM reads the spec. Outdated docs = broken voice agent.

---

## 14. 6–18 Month Roadmap

### Phase 1 — Foundation (Done)
- [x] Hotel vertical with rooms + services
- [x] Vapi voice agent + AI tools
- [x] CRM with call transcripts
- [x] Google Calendar sync
- [x] n8n integration
- [x] DDD module structure (`modules/core/`, `modules/supporting/`, `modules/generic/`, `demos/`)
- [x] ERP stubs (leads, offers, team-hub)
- [x] Multi-module documentation

### Phase 2 — Auth + Security Hardening (Done)
- [x] `core/events/` — typed in-process event bus
- [x] `core/queue/` — background job queue (simple in-process, BullMQ-ready)
- [x] `modules/supporting/auth/` — unified User model, sessions, email verification
- [x] MFA: TOTP (otpauth), backup codes, WebAuthn (SimpleWebAuthn)
- [x] Opaque refresh tokens (SHA-256 hash stored in DB, raw value in httpOnly cookie)
- [x] `mfaMethod` persisted on session — AMR correctly reconstructed on token rotation
- [x] `modules/supporting/audit/` — append-only audit log (`aud_audit_logs`)
- [x] `modules/supporting/identity/` — Organization model, multi-tenancy foundation
- [x] JWT extended: `userType`, `orgId`, `roles`, `aud`, `amr`
- [x] `createHandler()` extended: cookie fallback auth, `permission`/`orgScoped` fields
- [x] Critical security fixes: auth on `/api/staff`, `passwordHash` excluded from responses
- [x] Docker Compose with Caddy, Postgres 16, Redis 7
- [x] `/api/health` endpoint for container healthchecks

### Phase 3 — CRM + Leads (Done)
- [x] Full customer profile (booking history, call timeline, interaction log)
- [x] Lead pipeline: CRUD, kanban stages, assignment, activity feed, soft delete
- [x] Lead-to-customer conversion with `LEAD_CONVERTED` domain event
- [x] Domain events: `LEAD_CREATED`, `LEAD_STAGE_CHANGED`, `LEAD_CONVERTED`, `LEAD_ASSIGNED`
- [x] Voice agent auto-creates lead from call transcript for new customers
- [x] n8n lead ingestion webhook (`POST /api/n8n/leads`)
- [x] `POST /api/leads/:id/activities` — activity timeline for sales pipeline

### Phase 4 — Automation Builder (Months 3–6)
- [ ] Workflow definition schema and storage
- [ ] Step executor (sequential, parallel, conditional branch)
- [ ] Tool registry with CRM + hotel + leads tools registered
- [ ] Trigger system (domain event trigger, webhook trigger, schedule trigger)
- [ ] Run history and replay
- [ ] Basic UI for workflow inspection (read-only first, then builder)

### Phase 5 — Offers + Team Hub (Months 5–8)
- [ ] Offer builder (line items, pricing, PDF generation)
- [ ] Email delivery via n8n or Resend
- [ ] GitHub App integration (Team Hub)
- [ ] Slack App integration (Team Hub + notification routing)
- [ ] AI meeting pipeline (recording → transcript → summary → action items)
- [ ] Workspace model for Team Hub (multi-tenant)

### Phase 6 — Scale + Billing (Months 8–12)
- [ ] Billing module (Stripe/LemonSqueezy, seat limits, usage quotas)
- [ ] LLM cost tracking per org
- [ ] Background worker process extracted from Next.js
- [ ] Analytics dashboard (occupancy, revenue, workflow volumes)
- [ ] Multi-property support for hotel vertical
- [ ] pgvector for agent semantic memory

### Phase 7 — Platform Maturity (Months 12–18)
- [ ] External plugin API (third-party tool registration)
- [ ] Public webhook integration framework (any system → trigger workflow)
- [ ] Workflow template marketplace
- [ ] SDK for building custom tools
- [ ] Enterprise: SSO (SAML/OIDC), audit export, SLA dashboard
- [ ] Evaluate extraction of automation engine to separate service

---

*Last updated: 2026-02. Maintained by the Kollegan development team.*
