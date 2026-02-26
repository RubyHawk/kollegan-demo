# Agentic API Platform Architecture

> **Platform:** Kollegan AI Automation Platform
> **Stack:** Next.js 16 · PostgreSQL (Prisma 7) · Zod 4 · Redis · TypeScript 5
> **Authors:** Platform Engineering
> **Version:** 2025-11-01
> **Status:** Living document — update with every breaking change

---

## Table of Contents

1. [Current State & Gap Analysis](#0-current-state--gap-analysis)
2. [Part 1 — Modern API Architecture](#part-1--modern-api-architecture)
3. [Part 2 — Standardised Response System](#part-2--standardised-response-system)
4. [Part 3 — Developer Experience & Automation](#part-3--developer-experience--automation)
5. [Part 4 — Implementation in Next.js](#part-4--implementation-in-nextjs)
6. [Part 5 — Long-Term Platform Vision](#part-5--long-term-platform-vision)
7. [Part 6 — Practical Roadmap](#part-6--practical-roadmap)

---

## 0. Current State & Gap Analysis

Before building forward, understand the exact gap between where the codebase is today and where the platform needs to go.

### What exists today

| Component | State |
|---|---|
| Zod validation | ✅ Used in most routes |
| Auth middleware | ✅ `validateVapiAuth` exists |
| Rate limiting | ✅ Redis sliding window |
| OpenAPI spec | ✅ Manually maintained at `/api/docs` |
| Logger | ✅ Structured tag-based logger |
| Domain events | ✅ In-process EventBus |
| Error format | ❌ Inconsistent — `{ error: string }` or `{ error: ZodFlatError }` |
| Response envelope | ❌ Raw business objects — no `data`, no `meta`, no `requestId` |
| Request IDs | ❌ Not generated, not propagated |
| RFC 7807 errors | ❌ Non-existent |
| Retry hints for agents | ❌ Non-existent |
| Route middleware reuse | ❌ Each route manually copies 20 lines of boilerplate |
| API versioning | ❌ No version header, no version routing |
| SDK / typed clients | ❌ Non-existent |
| Breaking change detection | ❌ Non-existent |
| Schema-driven OpenAPI | ❌ Spec written by hand, diverges from code |

### What was just implemented

The following files form the core of the new API platform:

```
src/core/api/
  errors.ts      — ApiError class + RFC 7807 Problem Details factories
  response.ts    — ApiSuccess envelope + ok/created/paginated helpers
  handler.ts     — createHandler: full middleware pipeline in one function
  index.ts       — public barrel
  openapi.ts     — updated with Problem and RequestMeta schemas
```

Two routes have been migrated as reference implementations:
- `src/app/api/ai/crm/update/route.ts`
- `src/app/api/ai/customer/get/route.ts`

---

## Part 1 — Modern API Architecture

### 1.1 REST as the correct choice for this platform

The platform handles three categories of API consumer:

1. **LLM tool callers** — Vapi, n8n, custom ReAct agents making tool calls mid-workflow
2. **Internal services** — Next.js server-side code, background job handlers
3. **Future SDK consumers** — third-party developers integrating with the platform

For all three, **REST with OpenAPI 3.1** is the right choice in 2026. Here is the reasoning:

**Why not GraphQL:**
GraphQL excels when clients have diverse, overlapping data needs and you want to avoid over-fetching. For an agentic tool API, each endpoint is a specific, narrow action. An LLM calling `crm.update_record` does not need to compose queries — it needs a predictable, self-describing endpoint. OpenAPI tooling (code generation, validation, Swagger UI, breaking change detection) is significantly more mature for REST. GraphQL also adds resolver complexity, N+1 risk, and schema stitching overhead that provides no benefit here.

**Why not tRPC:**
tRPC is excellent for same-codebase full-stack TypeScript (Next.js + client). For an agentic platform that will expose a public API, ship SDKs, and integrate with third-party automation tools (n8n, Zapier, VAPI), you need an HTTP-standard interface. tRPC's RPC-over-HTTP is not OpenAPI-compatible by default.

**Why REST wins:**
- Every LLM, every automation tool, every integration platform speaks REST
- OpenAPI 3.1 is the universal contract format for 2026
- Tooling maturity: SDK generation, schema validation, Spectral linting, oasdiff breaking change detection
- Each tool call maps to one route — clean, cacheable, observable

### 1.2 Contract-first, schema-first development

**The principle:** The contract (OpenAPI spec + Zod schemas) is written before the implementation, not derived from it after.

**The problem with code-first in practice:**
When route handlers are written first and the spec is generated or maintained manually afterwards, the spec drifts from reality within weeks. The spec becomes documentation for what the API *was*, not what it *is*. This is fatal for SDK consumers and LLM agents that rely on schema accuracy.

**This platform's approach — Zod as the single source of truth:**

```
Zod Schema
    │
    ├─── TypeScript types (z.infer<>) ──────→ handler function parameters
    │
    ├─── Runtime validation ────────────────→ request body / query parsing in createHandler
    │
    └─── JSON Schema (future: zod-to-openapi) → OpenAPI components/schemas
```

The current `createHandler` takes a Zod schema as `body` or `query`. This means:
1. The schema validates the actual request at runtime
2. The same schema can generate the OpenAPI request body definition
3. TypeScript infers the handler parameter types from the schema — no manual interface duplication

```typescript
// One Zod schema drives everything
const BodySchema = z.object({
  email: z.string().email(),
  name:  z.string().min(1).max(100),
});

// Types are inferred — never written by hand
export const POST = createHandler(
  { body: BodySchema, tag: 'Example', auth: 'vapi' },
  async ({ body }) => {
    // body: { email: string; name: string } — fully typed
    return ok(await processRequest(body));
  }
);
```

**Next step — full schema-driven OpenAPI:**

Install `@asteasolutions/zod-to-openapi` and register schemas:

```typescript
import { extendZodWithOpenApi, OpenApiGeneratorV31, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const WorkflowSchema = registry.register('Workflow', z.object({
  id:   z.string().openapi({ example: 'wf_abc123' }),
  name: z.string().openapi({ example: 'Customer Onboarding' }),
}));

// The generator produces the full OpenAPI spec from the registry
const generator = new OpenApiGeneratorV31(registry.definitions);
export const spec = generator.generateDocument({ ... });
```

This eliminates the manually-maintained `openapi.ts` entirely. The spec is always in sync with runtime validation because they share the same Zod definition.

### 1.3 LLM-friendly and automation-friendly API design

Designing for LLM agents is different from designing for human developers. Agents need:

**1. Deterministic response shapes**

An LLM must be able to predict the structure of a response from the schema alone, without seeing examples. This means:
- No polymorphic responses where shape changes based on state
- No `{ success: true, data: ... }` sometimes and `{ error: ... }` other times
- Always: success → `{ data, meta }`, failure → Problem Details

**2. Machine-readable error codes**

When an LLM's tool call fails with `{ error: "Room 101 is locked" }`, the agent cannot decide whether to retry or route to a different path without parsing English text. With structured errors:

```json
{
  "type": "https://docs.kollegan.ai/problems/conflict",
  "status": 409,
  "retryable": true,
  "retryAfter": null,
  "detail": "Room 101 is currently locked by another session"
}
```

The agent reads `retryable: true` and knows to re-check room status before retrying. The `type` URI identifies the error class for conditional logic.

**3. Retry guidance**

Rate limits (`429`) must include `retryAfter`. Transient errors (`503`) must include `retryable: true` with a suggested delay. The agent should never need to parse the `detail` string to decide retry behaviour.

**4. Idempotency**

POST endpoints that perform mutations should accept an `Idempotency-Key` header. If the same key is seen twice, return the cached response without re-executing. Critical for agents that retry on network timeout.

```typescript
// Future: add to createHandler
if (config.idempotent) {
  const key = req.headers.get('idempotency-key');
  if (key) {
    const cached = await redis.get(`idempotency:${key}`);
    if (cached) return NextResponse.json(JSON.parse(cached));
  }
}
```

**5. Request correlation**

Every response includes `meta.requestId` and the `X-Request-Id` header. When an agent logs a failed tool call, the engineer can grep server logs by requestId in seconds.

**6. Tool schemas in OpenAPI**

The OpenAPI spec is directly consumable by LLM systems. Vapi reads the spec to understand what parameters a tool accepts. The `operationId` becomes the function name in the agent's tool use block. Field descriptions are used as function argument descriptions by the LLM.

This means: **write descriptions as if explaining to a reasoning model, not a junior developer.**

```typescript
// Bad — describes syntax, not semantics
z.string().openapi({ description: 'String up to 30 chars' })

// Good — guides agent reasoning
z.string().openapi({ description: 'Guest phone number in E.164 format (+46701234567). Used as the unique customer key. Pass null if unknown.' })
```

### 1.4 API versioning strategy

This platform uses **date-based versioning**, matching Stripe and Anthropic's approach:

```
Version format: YYYY-MM-DD
Current:        2025-11-01
```

**Why date-based over semantic versioning:**

Semantic versioning (`v1`, `v2`) creates ambiguity about what constitutes a "major" change. Teams argue about whether adding a required field is major or minor. Date-based versions make the release cadence explicit — clients know exactly when a behaviour changed and can audit the changelog between their pinned version and the latest.

**Version negotiation:**

```
Client request:  Kollegan-Version: 2025-11-01
Server response: { meta: { version: "2025-11-01", ... } }
```

If the client specifies a version, the server uses that version's behaviour. If not, the server uses the latest version but includes a `Sunset` header warning of any deprecations.

**Version routing in the handler:**

```typescript
// src/core/api/version.ts — future implementation
const VERSIONS = ['2025-11-01', '2026-01-01'] as const;
type Version = typeof VERSIONS[number];

function resolveVersion(req: NextRequest): Version {
  const requested = req.headers.get('kollegan-version');
  if (requested && VERSIONS.includes(requested as Version)) {
    return requested as Version;
  }
  return VERSIONS[VERSIONS.length - 1]; // latest
}
```

**Breaking vs non-breaking changes:**

| Change | Breaking? | Version bump? |
|---|---|---|
| Add optional response field | No | No |
| Add optional request field | No | No |
| Remove response field | Yes | New date version |
| Change field type | Yes | New date version |
| Change error code / type URI | Yes | New date version |
| Add required request field | Yes | New date version |
| Change HTTP status on success | Yes | New date version |
| Rename endpoint | Yes | New date version |
| Add new endpoint | No | No |

**Deprecation process:**

1. Add `Deprecation: true` and `Sunset: <date>` headers to deprecated endpoints
2. Communicate via changelog and developer newsletter
3. Keep deprecated behaviour for minimum 6 months post-Sunset date
4. Remove in a new version bump

### 1.5 Multi-tenant API design

Every resource in this platform belongs to an organisation (`organizationId`). The API enforces this at the middleware level, not the service level.

**Tenant isolation principles:**

1. **Every database query must include `organizationId`** — enforced via Prisma middleware, not caller discipline
2. **The `orgId` comes from the auth token**, not the request body — callers cannot spoof tenant identity
3. **Row-Level Security in PostgreSQL** is the defence-in-depth layer (planned, see architecture doc)

**Current implementation (demo mode):**

The `DEMO_ORG_ID` env variable identifies the single tenant. When multi-tenancy is activated, the JWT payload includes `orgId` and the handler extracts it:

```typescript
// src/core/api/handler.ts — future expansion
if (authStrategy === 'jwt') {
  const { payload } = await verifyToken(token);
  ctx.orgId = payload.orgId; // extracted from verified token
}
```

**Multi-tenant query pattern:**

```typescript
// repository.ts — tenant scope always applied at query level
export async function findWorkflows(orgId: string) {
  return prisma.workflow.findMany({
    where: { organizationId: orgId }, // never omit this
  });
}
```

### 1.6 Internal vs external API surfaces

This platform has two distinct API surfaces with different contracts:

| Surface | Path prefix | Auth | Consumers | Versioned? |
|---|---|---|---|---|
| AI Tool API | `/api/ai/*` | VAPI secret | Vapi voice agent, n8n | Yes |
| Internal API | `/api/*` | JWT | Dashboard, SSE | Partial |
| n8n webhooks | `/api/n8n/*` | Internal key | n8n workflows | No |
| Future public API | `/v1/*` | API key + JWT | Third-party developers | Yes |

**Naming principle:** Internal routes do not need perfect REST conventions. External routes (future `/v1/*`) must be RFC-clean, versioned, and fully documented.

### 1.7 Backward compatibility rules

Backward compatibility is a **contract with your callers** — breaking it silently is the most damaging thing an API team can do.

**The golden rules:**

1. **Never remove a field from a response** — add fields freely, remove only in a new version
2. **Never change the type of an existing field** — `string` to `number` is a breaking change
3. **Never change the meaning of an existing field** — changing `status: "active"` semantics is breaking
4. **Never change the error type URI** for an existing error condition
5. **Never make an optional field required** — the reverse (required → optional) is safe
6. **Always treat new enum values as breaking** — clients may have exhaustive switches

---

## Part 2 — Standardised Response System

### 2.1 The success envelope

Every successful response has this shape:

```typescript
interface ApiSuccess<T> {
  data: T;                    // The business payload — always unwrapped
  meta: RequestMeta;          // Platform metadata — always present
  pagination?: Pagination;    // Only present for list endpoints
}

interface RequestMeta {
  requestId:  string;   // "req_lk5s8f2a" — correlate with server logs
  timestamp:  string;   // ISO 8601 UTC — when request was received
  version:    string;   // "2025-11-01" — API version used
  durationMs: number;   // 42 — server-side processing time
}
```

**Why this matters for agentic workflows:**

An LLM agent calling a tool deserves to know more than just the business result. `meta.requestId` lets the engineer find the exact server log for any tool call the agent made. `meta.durationMs` lets the orchestration engine detect slow tool calls and apply timeouts. `meta.version` lets the agent log which version of the API it used, enabling version-specific debugging.

**Example response:**

```json
{
  "data": {
    "customerId": "cust_abc123",
    "crmRecordId": "crm_def456",
    "success": true,
    "message": "CRM uppdaterad för Anna Svensson."
  },
  "meta": {
    "requestId": "req_lk5s8f2a",
    "timestamp": "2026-02-26T14:32:01.000Z",
    "version": "2025-11-01",
    "durationMs": 38
  }
}
```

**Before (current state):**
```json
{
  "success": true,
  "message": "CRM uppdaterad för Anna Svensson.",
  "customerId": "cust_abc123"
}
```

No requestId. No duration. No version. An agent failure is undebuggable.

### 2.2 RFC 7807 Problem Details

**RFC 7807** is the IETF standard for HTTP error responses. It solves the "how do I return structured errors" problem that every API team re-invents badly.

The content type is `application/problem+json` — distinct from `application/json`. This allows clients to detect error responses by content type alone, without inspecting HTTP status codes.

```typescript
interface Problem {
  type:       string;             // "https://docs.kollegan.ai/problems/validation-error"
  title:      string;             // "Validation Error"
  status:     number;             // 400
  detail:     string;             // "Request body failed validation"
  instance?:  string;             // "/api/ai/crm/update"
  requestId?: string;             // "req_lk5s8f2a"
  timestamp:  string;             // "2026-02-26T14:32:01.000Z"
  errors?:    ValidationIssue[];  // field-level validation issues
  retryable:  boolean;            // false — caller must fix the request
  retryAfter?: number;            // null — no retry guidance
}
```

**The `type` URI is the most important field.** It is a stable, versioned identifier for the problem class. An LLM agent or SDK can switch on `type` to apply different handling:

```typescript
// Example: agent error handling
if (problem.type === 'https://docs.kollegan.ai/problems/conflict') {
  await recheckRoomAvailability();
  return retry();
}
if (problem.type === 'https://docs.kollegan.ai/problems/rate-limit-exceeded') {
  await sleep(problem.retryAfter * 1000);
  return retry();
}
if (!problem.retryable) {
  return escalate(problem.detail);
}
```

### 2.3 Structured validation errors

When a request body fails validation, the error must include field-level detail — not just "validation failed".

```json
{
  "type": "https://docs.kollegan.ai/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Request body failed validation",
  "instance": "/api/ai/crm/update",
  "requestId": "req_lk5s8f2a",
  "timestamp": "2026-02-26T14:32:01.000Z",
  "errors": [
    { "field": "email",   "message": "Invalid email address",    "code": "invalid_string" },
    { "field": "phone",   "message": "Expected string, received number", "code": "invalid_type" }
  ],
  "retryable": false
}
```

The `field` uses dot notation for nested paths: `address.postcode`, `items.0.price`. This makes it possible for an agent to identify exactly which field caused the failure and attempt a corrected value.

### 2.4 Error categorisation and the retry decision

The platform categorises all errors into three classes from the caller's perspective:

**Class A — Caller error (fix the request)**
- 400 Validation Error — schema mismatch, fix the body
- 400 Bad Request — semantically invalid (dates out of order)
- 401 Unauthorized — provide valid credentials
- 403 Forbidden — you don't have permission, don't retry
- `retryable: false` for all

**Class B — State conflict (check state, then decide)**
- 409 Conflict — resource is in the wrong state (room locked, workflow running)
- 422 Unprocessable — the request is valid but cannot be actioned now
- `retryable: true` — but agent must re-check state first

**Class C — Platform error (retry with backoff)**
- 429 Rate Limited — wait `retryAfter` seconds
- 500 Internal Error — transient; retry with exponential backoff
- 503 Unavailable — wait 30s then retry
- `retryable: true` with `retryAfter` guidance

### 2.5 Rate limiting response design

Rate limit responses include both the RFC 7807 body and standard HTTP headers:

```
HTTP/1.1 429 Too Many Requests
Content-Type: application/problem+json
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1740572400000
Retry-After: 47
```

```json
{
  "type": "https://docs.kollegan.ai/problems/rate-limit-exceeded",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Retry after 47 seconds.",
  "retryable": true,
  "retryAfter": 47
}
```

Headers are for HTTP-aware clients (load balancers, proxies). The body is for application-level clients (agents, SDKs). Both are always set.

### 2.6 Status code semantics

| Status | Meaning | retryable |
|---|---|---|
| 200 | Successful GET, POST (mutation completed) | — |
| 201 | Resource created | — |
| 202 | Accepted for async processing | — |
| 204 | No Content (successful DELETE) | — |
| 400 | Bad request / validation failure | false |
| 401 | Authentication required | false |
| 403 | Forbidden (authenticated but not authorised) | false |
| 404 | Resource not found | false |
| 409 | Conflict — state mismatch | true |
| 422 | Unprocessable — semantically invalid | false |
| 429 | Rate limited | true + retryAfter |
| 500 | Internal error | true |
| 503 | Service unavailable | true + retryAfter: 30 |

**Do not use:** 200 for errors (the "200 OK with error body" anti-pattern). Do not return 400 for server-side state conflicts — 409 is correct. Do not return 500 for validation errors — 400 is correct.

### 2.7 Logging and tracing integration

Every handler log line includes the `requestId`:

```
[2026-02-26T14:32:01.000Z] [INFO] [AI:CrmUpdate] POST /api/ai/crm/update { requestId: "req_lk5s8f2a" }
[2026-02-26T14:32:01.038Z] [INFO] [AI:CrmUpdate] POST /api/ai/crm/update → 200 { requestId: "req_lk5s8f2a", durationMs: 38 }
```

**The requestId is the single correlation key.** Given a requestId from an agent's log output, an engineer can find:
- The full request parameters (from structured log entry)
- The handler that processed it
- The duration and outcome
- Any errors thrown during processing
- Database queries triggered (if query logging is enabled)

**Distributed tracing (future — OpenTelemetry):**

When the platform evolves to multiple services, the `requestId` transitions to a W3C Trace Context `traceparent` header:

```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

The `createHandler` factory is the correct place to initialise and propagate the span — a single change propagates to all routes. This is why centralising middleware matters.

---

## Part 3 — Developer Experience & Automation

### 3.1 SDK generation

The platform will publish typed SDK clients generated directly from the OpenAPI spec. This means every API change automatically produces updated SDK code.

**Generation toolchain:**

```bash
# Generate TypeScript types from spec
npx openapi-typescript ./src/core/api/openapi.ts -o ./sdk/types.ts

# Or from the live endpoint
npx openapi-typescript http://localhost:3001/api/docs -o ./sdk/types.ts
```

**SDK structure:**

```
sdk/
  types.ts           # Generated — never edit by hand
  client.ts          # Handwritten thin wrapper around fetch
  errors.ts          # Re-export Problem type, add helpers
  index.ts           # Public barrel
```

```typescript
// sdk/client.ts — thin wrapper that unpacks the envelope
import type { paths } from './types';

export class KolleganClient {
  constructor(private baseUrl: string, private apiKey: string) {}

  async updateCrm(body: paths['/api/ai/crm/update']['post']['requestBody']['content']['application/json']): Promise<CrmUpdateResult> {
    const res = await fetch(`${this.baseUrl}/api/ai/crm/update`, {
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'x-vapi-secret':  this.apiKey,
        'X-Request-Id':   generateRequestId(),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const problem: Problem = await res.json();
      throw new ApiError(problem);
    }

    const envelope: ApiSuccess<CrmUpdateResult> = await res.json();
    return envelope.data; // SDK unwraps the envelope
  }
}
```

The SDK client:
1. Sets request headers automatically (auth, content type, request ID)
2. Throws `ApiError` on any non-2xx response with the full Problem object
3. Unwraps the envelope — SDK callers receive `data` directly
4. Provides `retryable` and `retryAfter` from the Problem on errors

### 3.2 Validation pipeline

The validation pipeline runs in this order:

```
HTTP Request
    │
    ▼
[1] Rate Limit Check         ← Redis sliding window, per-IP or per-key
    │
    ▼
[2] Authentication            ← VAPI secret / JWT / Internal key / None
    │
    ▼
[3] Query String Parsing      ← Zod schema, convert to typed object
    │
    ▼
[4] Body Parsing + Validation ← Zod schema, produce typed body
    │
    ▼
[5] Handler Execution         ← Business logic, receives fully typed inputs
    │
    ▼
[6] Envelope Wrapping         ← Inject requestId, timestamp, durationMs
    │
    ▼
HTTP Response (with X-Request-Id, X-Version headers)
```

Each stage catches its own error type and converts to the appropriate Problem Detail. No stage can produce an unstructured error.

### 3.3 Schema linting with Spectral

[Spectral](https://stoplight.io/open-source/spectral) enforces API design rules at CI time. Install:

```bash
npm install --save-dev @stoplight/spectral-cli
```

`.spectral.yaml`:

```yaml
extends:
  - spectral:oas

rules:
  # Every operation must have an operationId (required for SDK generation)
  operation-operationId: error

  # Every operation must have at least one tag (required for SDK grouping)
  operation-tags: error

  # All responses must have content
  oas3-valid-media-example: warn

  # Custom rule: no 200 response without a schema
  response-schema-required:
    given: "$.paths[*][*].responses['200'].content"
    severity: error
    then:
      field: "application/json.schema"
      function: defined

  # Custom rule: all errors must reference Problem schema
  error-uses-problem-schema:
    given: "$.paths[*][*].responses['4*'].content"
    severity: error
    then:
      field: "application/problem+json"
      function: defined
```

Run in CI:
```bash
npx spectral lint src/core/api/openapi.ts --format=junit > spectral-report.xml
```

### 3.4 Breaking change detection with oasdiff

[oasdiff](https://github.com/oasdiff/oasdiff) compares two OpenAPI specs and reports breaking changes:

```bash
# Install
npm install --save-dev oasdiff

# Check for breaking changes against main branch
npx oasdiff breaking \
  https://api.kollegan.ai/api/docs \   # baseline (production)
  ./src/core/api/openapi.ts            # current (PR branch)
```

**CI integration (GitHub Actions):**

```yaml
# .github/workflows/api-check.yml
- name: Check for API breaking changes
  run: |
    npx oasdiff breaking \
      https://api.kollegan.ai/api/docs \
      ./src/core/api/openapi.ts \
      --fail-on ERR    # fail CI on breaking changes, warn on deprecations
```

Breaking changes block the PR merge. This enforces the versioning discipline automatically.

### 3.5 Automated documentation

The OpenAPI spec is served live at `/api/docs` (JSON) and `/api/docs/ui` (Swagger UI). This means documentation is always in sync with deployment.

**Future: publish to a developer portal:**

```typescript
// scripts/publish-docs.ts
import { openApiSpec } from './src/core/api/openapi';

// Publish to Stoplight, Readme.io, or a static site
await fetch('https://api.readme.io/api/v1/api-specification', {
  method: 'POST',
  headers: { 'x-readme-api-key': process.env.README_API_KEY! },
  body: JSON.stringify(openApiSpec),
});
```

---

## Part 4 — Implementation in Next.js

### 4.1 Folder structure

```
src/
├── core/
│   ├── api/
│   │   ├── errors.ts        ← ApiError class + RFC 7807 factories     ✅ DONE
│   │   ├── response.ts      ← Envelope types + ok/created/paginated   ✅ DONE
│   │   ├── handler.ts       ← createHandler middleware pipeline        ✅ DONE
│   │   ├── index.ts         ← Public barrel                           ✅ DONE
│   │   └── openapi.ts       ← OpenAPI 3.1 spec (manual → generated)   ✅ UPDATED
│   ├── auth/
│   │   ├── jwt.ts
│   │   └── vapi-auth.ts
│   ├── cache/
│   │   ├── rate-limiter.ts
│   │   └── redis.ts
│   └── logging/
│       └── logger.ts
│
├── features/
│   ├── automation/          ← Core domain (workflow orchestration)
│   ├── crm/                 ← Supporting domain
│   │   ├── repository.ts    ← All Prisma queries
│   │   ├── service.ts       ← Business logic
│   │   ├── events.ts        ← Domain events
│   │   └── index.ts         ← Public barrel (service + types)
│   └── voice/               ← Core domain (voice AI)
│
└── app/
    └── api/
        ├── ai/
        │   ├── crm/update/route.ts      ← Migrated to createHandler   ✅ DONE
        │   └── customer/get/route.ts    ← Migrated to createHandler   ✅ DONE
        └── docs/route.ts                ← Serves OpenAPI spec
```

### 4.2 The createHandler pattern

Every route handler in this codebase should use `createHandler`. The pattern eliminates the repetitive boilerplate that currently appears in every route:

**Before (repeated in every route):**

```typescript
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'vapi';
  const rl = await checkRateLimit(ip, 30, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const authError = validateVapiAuth(req);
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // ... business logic
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
```

**After (with createHandler):**

```typescript
export const POST = createHandler(
  { tag: 'AI:MyEndpoint', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: BodySchema },
  async ({ body }) => {
    const result = await doWork(body);
    return ok(result);
  }
);
```

This is 5 lines vs 20. The middleware pipeline is correct by default. Error responses are automatically RFC 7807. The request ID is generated and propagated. The response is wrapped in the standard envelope.

### 4.3 Using the error factories

Throw `Errors.*` from handlers to produce structured error responses:

```typescript
export const POST = createHandler(
  { tag: 'Bookings:Lock', auth: 'vapi', body: LockSchema },
  async ({ body }) => {
    const room = await findRoom(body.roomId);
    if (!room) throw Errors.notFound(`Room ${body.roomId}`);
    if (room.status !== 'available') throw Errors.conflict(`Room ${body.roomId} is ${room.status}`);

    const result = await lockRoom(body.roomId);
    return ok(result);
  }
);
```

The `createHandler` wrapper catches `ApiError` and converts it to a Problem Details response. Unknown errors are caught and converted to `Errors.internal()` — no stack trace ever leaks to the caller.

### 4.4 Pagination example

```typescript
const ListSchema = z.object({
  cursor:   z.string().optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const GET = createHandler(
  { tag: 'Workflows:List', auth: 'jwt', query: ListSchema },
  async ({ query }) => {
    const { items, nextCursor, total } = await listWorkflows({
      cursor:   query.cursor,
      take:     query.pageSize,
    });

    return paginated(items, {
      count:      items.length,
      total,
      hasNext:    !!nextCursor,
      hasPrev:    !!query.cursor,
      nextCursor,
    });
  }
);
```

Response:
```json
{
  "data": [{ "id": "wf_abc", "name": "Onboarding" }, ...],
  "meta": { "requestId": "req_xyz", ... },
  "pagination": {
    "count": 20,
    "total": 142,
    "hasNext": true,
    "hasPrev": false,
    "nextCursor": "cur_lm9q2r"
  }
}
```

### 4.5 Response headers

Every response from `createHandler` includes:

| Header | Value | Purpose |
|---|---|---|
| `X-Request-Id` | `req_lk5s8f2a` | Log correlation |
| `X-Version` | `2025-11-01` | API version used |
| `X-Duration-Ms` | `42` | Performance observability |
| `Retry-After` | `47` | Set on 429/503 responses |
| `X-RateLimit-Limit` | `30` | Set on 429 responses |
| `X-RateLimit-Remaining` | `0` | Set on 429 responses |
| `X-RateLimit-Reset` | `1740572400000` | Set on 429 responses |

### 4.6 Observability hooks (future)

The `createHandler` factory is the correct place to add OpenTelemetry instrumentation. When the platform matures to this point, add inside the factory:

```typescript
// Future: OpenTelemetry span wrapping
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('kollegan-api');
const span   = tracer.startSpan(`${req.method} ${instance}`);
span.setAttributes({ 'http.method': req.method, 'api.version': version });

try {
  const result = await fn(ctx);
  span.setStatus({ code: SpanStatusCode.OK });
  return envelopeResponse(result, meta);
} catch (err) {
  span.recordException(err as Error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  throw err;
} finally {
  span.end();
}
```

Because all routes use `createHandler`, this is a **single-file change** that instruments the entire API surface. This is the leverage that centralised middleware provides.

---

## Part 5 — Long-Term Platform Vision

### 5.1 Evolution phases

The platform evolves through four phases. Each phase is triggered by a specific scaling or capability threshold — not by a calendar date.

```
Phase 1 (NOW):       Modular monolith + createHandler platform
Phase 2 (at 10 RPS): External API surface + API key management
Phase 3 (at 50 RPS): API gateway + rate limiting at edge
Phase 4 (at 200 RPS): Service extraction — start with automation engine
```

### 5.2 Phase 2 — External API and API key management

**Trigger:** First paying developer who wants to integrate with the platform programmatically.

**What changes:**

1. New URL namespace: `/v1/*` for the external, public API
2. API key model in Postgres:
   ```
   api_keys: { id, orgId, keyHash, name, scopes, rateLimit, createdAt, lastUsedAt, revokedAt }
   ```
3. New auth strategy `'api-key'` in `createHandler`
4. Rate limiting keyed by API key, not IP
5. Usage logging to Postgres (for billing and analytics)
6. API key management dashboard (create, rotate, revoke, view usage)

```typescript
// src/core/auth/api-key.ts
export async function validateApiKey(req: NextRequest): Promise<ApiKeyPayload | null> {
  const key = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!key) return null;

  const hash = await sha256(key);
  const record = await prisma.apiKey.findFirst({
    where: { keyHash: hash, revokedAt: null },
  });
  if (!record) return null;

  // Log usage async — don't block the request
  void prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } });

  return { orgId: record.orgId, scopes: record.scopes, keyId: record.id };
}
```

### 5.3 Phase 3 — API gateway

**Trigger:** Rate limiting needs to move to the edge (before Next.js processes the request). Custom domains for white-label customers. SSL termination at scale.

**Candidates:**

| Gateway | Best for | Notes |
|---|---|---|
| Vercel Edge Middleware | Existing Vercel deployment | Zero-config, limited features |
| Kong Gateway | Self-hosted, plugin ecosystem | Full-featured, complex |
| AWS API Gateway + Lambda@Edge | AWS-native stack | High ops overhead |
| Traefik | Docker/k8s deployments | Good for container-based deploys |
| Cloudflare Workers | Edge compute at global scale | Excellent for rate limiting + auth |

**Recommendation for this stack:** Start with Vercel Edge Middleware (already available, zero cost). Migrate to Cloudflare Workers + Workers KV for global rate limiting when you hit multi-region needs.

**What the gateway owns:**
- Rate limiting (per API key, per IP, per tenant)
- SSL termination
- DDoS protection
- Request logging (access log level)
- API key validation (cache in edge KV)
- Route configuration

**What the application keeps:**
- Business logic validation (Zod schemas)
- Domain logic errors (409 conflict, 422 unprocessable)
- Response formatting

### 5.4 Phase 4 — Service extraction (when and why)

**The wrong reason to extract a service:** "Microservices are best practice."
**The right reason to extract a service:** A specific module has deployment, scaling, or team ownership requirements that cannot be met inside the monolith.

**Extraction candidates and their triggers:**

| Module | Extract when | Why |
|---|---|---|
| Automation engine | Workflow runs need separate compute (GPU, long-running) | Cannot share Node.js process with HTTP server |
| AI orchestration | LLM API calls need separate rate limit pool + billing | Isolation from main app budget |
| Event bus | In-process EventEmitter cannot survive process crash | Need durable event log (PostgreSQL events table → Kafka) |
| File storage | Blobs grow large | Move to S3 + CDN, not Next.js |

**Extraction pattern:**

The module boundary discipline we already have (each module only exports via `index.ts`, never internal files) makes extraction feasible without a big-bang rewrite:

1. The module's `service.ts` calls are replaced with HTTP/RPC calls to the extracted service
2. The `index.ts` barrel stays the same — callers do not change
3. The extracted service implements the same interface as the original `service.ts`

```typescript
// Before extraction (monolith)
import { runWorkflow } from '@features/automation/service';

// After extraction (service is remote)
import { runWorkflow } from '@features/automation/service'; // same import
// service.ts now calls the remote service:
export async function runWorkflow(input: WorkflowInput) {
  return fetch('https://automation-service.internal/run', { ... });
}
```

### 5.5 Plugin ecosystem and AI tool registry

The `automation/tools/registry.ts` already exists as the foundation. Every capability in the platform is registered as a tool:

```typescript
// src/features/automation/tools/registry.ts
registerTool({
  name:        'crm.update_record',
  description: 'Create a CRM record for a completed call session...',
  schema:      CrmUpdateSchema,  // Zod schema → JSON Schema for LLM
  fn:          async (args, ctx) => updateCrm(args),
});
```

**The tool registry becomes the plugin entry point.** Third-party developers register tools that appear in the agent's tool set:

```typescript
// Future: plugin SDK
import { registerPlugin } from '@kollegan/plugin-sdk';

registerPlugin({
  name:    'my-crm-integration',
  version: '1.0.0',
  tools: [
    {
      name:   'mycrm.sync_contact',
      fn:     async (args) => await myCrmApi.sync(args),
    },
  ],
  webhooks: [
    { on: 'crm.contact_upserted', fn: async (event) => await myCrmApi.push(event) },
  ],
});
```

The tool registry maps to the OpenAPI spec: each registered tool generates an entry in the `paths` object. This means the agent's available tool set is always in sync with the spec.

### 5.6 Event-driven evolution

The current in-process EventBus is Phase 1. The evolution path:

```
Phase 1: InProcessEventBus (EventEmitter)
          → Fast, zero-infrastructure, survives nothing
          → Suitable: single process, development, demo

Phase 2: Persisted Event Log (PostgreSQL evt_domain_events table)
          → Events survive process restart
          → Suitable: production single-server, audit trail required
          → Schema already in prisma/schema.prisma

Phase 3: BullMQ (Redis-backed queue)
          → Distributed workers, retry logic, dead-letter queue
          → Suitable: multiple worker processes, high reliability needed
          → Redis already in the stack

Phase 4: NATS / Kafka
          → True event streaming, fan-out, replay
          → Trigger: multiple independent services need the same events
          → Extract only when Phase 3 becomes the bottleneck
```

The `eventBus.publish()` and `eventBus.subscribe()` API does not change between phases — only the implementation behind it. This is the same principle as the `createHandler` middleware centralisation: change the infrastructure once, all consumers update automatically.

---

## Part 6 — Practical Roadmap

### 6.1 30-day implementation plan

**Week 1 — Foundation (complete)**

| Day | Task | Output |
|---|---|---|
| 1-2 | Implement `errors.ts`, `response.ts`, `handler.ts` | ✅ Done |
| 3 | Migrate `ai/crm/update`, `ai/customer/get` | ✅ Done |
| 4 | Update OpenAPI spec schemas | ✅ Done |
| 5 | Run tsc, verify clean build | ✅ Done |

**Week 2 — Route migration**

Migrate all remaining `/api/ai/*` routes to `createHandler`. The goal: zero manual middleware boilerplate in any route.

| Route | Priority | Notes |
|---|---|---|
| `ai/availability/check` | High | GET + POST, query schema |
| `ai/rooms/lock` | High | POST, needs Errors.conflict on failure |
| `ai/rooms/cancel` | High | POST |
| `ai/transcripts/start` | High | POST, already uses crmService |
| `ai/calendar/check` | Medium | POST, external API (Google) |
| `ai/calendar/book` | Medium | POST, complex |
| `ai/hotel-info` | Low | GET + POST, no body needed |

**Week 3 — Schema-driven OpenAPI**

Replace manual `openapi.ts` with `@asteasolutions/zod-to-openapi`:

```bash
npm install @asteasolutions/zod-to-openapi
```

Steps:
1. Extend each Zod schema with `.openapi({ ... })` metadata
2. Register schemas with `OpenAPIRegistry`
3. Generate spec from registry
4. Add Spectral lint to CI
5. Add oasdiff breaking change detection to CI

**Week 4 — SDK and documentation**

1. Generate TypeScript types: `npx openapi-typescript /api/docs -o sdk/types.ts`
2. Write thin `KolleganClient` wrapper (envelope unpacking, error handling)
3. Publish SDK to internal npm registry
4. Set up developer documentation (Mintlify or Stoplight)

### 6.2 Common mistakes (and how to avoid them)

**1. Inconsistent error shapes**

_Mistake:_ Some routes return `{ error: "string" }`, others return `{ error: { fieldErrors: ... } }`, others return `{ success: false, message: "..." }`.

_Why it matters:_ LLM agents and SDK callers cannot handle polymorphic error shapes. They must parse English text to understand what went wrong.

_Fix:_ `createHandler` + `Errors.*` factories. Never `return NextResponse.json({ error: ... })` directly.

**2. Missing request IDs**

_Mistake:_ Returning errors without a correlation ID. The agent logs "CRM update failed" but there is no way to find the corresponding server log.

_Fix:_ The `createHandler` generates and propagates `requestId`. Every error response includes it.

**3. Leaking internal errors to callers**

_Mistake:_ `return NextResponse.json({ error: err.message }, { status: 500 })` exposes stack traces, database error messages, and internal paths.

_Fix:_ `createHandler` catches all non-ApiError exceptions and replaces them with `Errors.internal()`. The original error is logged server-side; only "An unexpected error occurred" goes to the caller.

**4. Rate limiting only in the handler**

_Mistake:_ Rate limiting in the application handler means expensive computation (auth, database) happens before the rate limit check.

_Fix:_ Rate limiting is the **first** step in `createHandler` — before auth, before body parsing. At Phase 3 maturity, move to edge middleware or API gateway.

**5. Premature versioning**

_Mistake:_ Creating `/v1/`, `/v2/` namespaces before you have breaking changes or external callers. This adds routing complexity for zero benefit.

_Fix:_ Embed the version in the response `meta.version` from day one. Add version-specific routing only when you have a real reason to maintain two parallel behaviours.

**6. Forgetting cursor-based pagination**

_Mistake:_ Implementing offset pagination (`?page=2&perPage=20`) for large datasets. Agents iterate pages in a loop; if a new record is inserted during iteration, they skip items or duplicate them.

_Fix:_ Cursor-based pagination from the start. The `paginated()` helper enforces the correct structure.

**7. Treating OpenAPI as documentation**

_Mistake:_ Writing the spec after the code, or not keeping it updated. The spec diverges from reality within weeks.

_Fix:_ Generate the spec from Zod schemas. The runtime validation schema and the API contract are the same object — they cannot diverge.

**8. Not setting Retry-After on 429 and 503**

_Mistake:_ Returning 429 without `Retry-After`. The agent retries immediately, triggering another 429, creating a retry storm.

_Fix:_ `Errors.rateLimit(retryAfter)` always requires the retry delay. `Errors.unavailable()` includes `retryAfter: 30` by default.

### 6.3 Technical debt warnings

These are the debt items that will cause pain if not addressed:

**Debt 1: Manual OpenAPI spec maintenance**

Current state: `openapi.ts` is written by hand. It already misses the new envelope schemas added this sprint.

Risk: High — spec will diverge from implementation, breaking SDK generation and Vapi tool definitions.

Fix timeline: Week 3 of the roadmap above. Use `zod-to-openapi`.

---

**Debt 2: Unmigrated routes**

Remaining routes still use manual boilerplate. Each one is a potential inconsistency — some use `{ error: ... }`, some use `{ success: false, message: ... }`.

Risk: Medium — inconsistent errors will confuse any agent or client that hits a non-migrated route.

Fix timeline: Week 2. Complete route migration before adding new routes.

---

**Debt 3: No idempotency keys**

VAPI and n8n may retry tool calls on network timeout. Without idempotency, this can create duplicate CRM records or double-bookings.

Risk: High for production. Low for demo.

Fix timeline: Add `Idempotency-Key` header support to `createHandler` for mutation endpoints (`hotel.lock_room`, `crm.update_record`).

---

**Debt 4: logActivity coupling**

`features/crm/service.ts` imports `logActivity` from `@features/hotel/rooms/lib/room-store`. This is a DDD violation: CRM (Supporting domain) depends on hotel/rooms (Generic domain) for activity broadcasting.

Risk: Medium — prevents extracting CRM as an independent service later.

Fix timeline: Extract `logActivity` into `@infra/activity` or `@core/events/activity`. The SSE broadcast should live in an infrastructure module, not a domain module.

---

**Debt 5: In-process event bus**

The current `EventEmitter`-based bus loses all events on process restart. If a workflow triggers mid-crash, the event is lost.

Risk: Low for demo, High for production automations.

Fix timeline: Before first production workflow: persist events to `evt_domain_events` table (schema already exists in Prisma). Consume from table with a worker process.

---

**Debt 6: No API key model**

Currently, authentication is either VAPI secret (shared secret, not per-caller) or JWT (for staff). There is no mechanism for external developers or n8n automations to authenticate with scoped, revocable keys.

Risk: Low now, critical at first external integration.

Fix timeline: Phase 2 (when first external developer needs access).

---

## Quick Reference

### Migration checklist — converting a route to createHandler

```typescript
// 1. Remove these imports:
//    - NextResponse (from next/server)
//    - validateVapiAuth (from @core/auth/vapi-auth)
//    - checkRateLimit (from @core/cache/rate-limiter)
//    - logger (from @core/logging/logger) — handled internally

// 2. Add:
import { createHandler, ok, Errors } from '@core/api';

// 3. Replace the export function with createHandler:
export const POST = createHandler(
  {
    tag:       'Module:Action',   // e.g. 'AI:CrmUpdate'
    auth:      'vapi',             // or 'jwt' | 'internal' | 'none'
    rateLimit: { max: 30, windowMs: 60_000 },
    body:      BodySchema,         // Zod schema
  },
  async ({ body }) => {
    // Throw Errors.* for expected failures
    // Return ok(data) for success
    return ok(await doWork(body));
  }
);
```

### Error factory reference

```typescript
// 400 — validation (auto-generated by createHandler from Zod)
throw Errors.validation('Request body failed validation', issues);

// 400 — business logic rejection
throw Errors.badRequest('Check-out date must be after check-in date');

// 401 — missing/invalid credentials (auto by createHandler)
throw Errors.unauthorized();

// 403 — insufficient permissions
throw Errors.forbidden('Only managers can cancel confirmed bookings');

// 404 — resource not found
throw Errors.notFound('Workflow wf_abc123');

// 409 — state conflict (agent should re-check, then retry)
throw Errors.conflict('Room 101 is currently locked by another session');

// 429 — rate limit (auto by createHandler)
throw Errors.rateLimit(47); // 47 seconds until reset

// 500 — unexpected (never throw manually — let createHandler catch)
// 503 — dependency unavailable
throw Errors.unavailable('Google Calendar API is temporarily unavailable');
```

### Response helper reference

```typescript
return ok(data);                        // 200 — standard success
return created(data);                   // 201 — resource created
return accepted({ runId, pollUrl });    // 202 — async operation started
return noContent();                     // 204 — delete with no body
return paginated(items, pagination);    // 200 — list with cursor pagination
```
