/**
 * createHandler — the single entry point for all API route handlers.
 *
 * Composes the middleware pipeline:
 *   1. Generate / extract request ID
 *   2. Authentication (vapi | jwt | internal | none)
 *   3. Rate limiting (configurable per-route)
 *   4. Content-Type validation for body routes (415)
 *   5. Request body / query-string parsing + Zod validation
 *   6. Business logic (the caller-supplied handler function)
 *   7. Wrap result in standard ApiSuccess envelope
 *   8. Attach observability headers (X-Request-Id, X-Version, X-Duration-Ms)
 *   9. Catch ApiError → RFC 9457 Problem Details
 *  10. Catch unknown error → 500 Problem Details (never leaks stack traces)
 *
 * RFC compliance:
 *   RFC 9110 §15.5.2  — 401 MUST include WWW-Authenticate
 *   RFC 9110 §15.5.6  — 405 MUST include Allow (via ApiError.headers)
 *   RFC 9110 §15.3.2  — 201 SHOULD include Location (via HandlerResult.headers)
 *   RFC 6585 §4       — 429 SHOULD include Retry-After
 *   RFC 9457          — Errors use application/problem+json
 *
 * Rate-limit headers follow the IETF draft-ietf-httpapi-ratelimit-headers spec:
 *   RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset (standard unprefixed)
 *   X-RateLimit-*  (legacy X- prefixed, kept for backward compatibility)
 *
 * Usage:
 *   export const POST = createHandler(
 *     { auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: MySchema, tag: 'AI:Thing' },
 *     async ({ body, meta }) => {
 *       const result = await doWork(body);
 *       return ok(result);         // or created('/api/v1/things/id'), paginated(), etc.
 *     }
 *   );
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateVapiAuth } from '@platform/auth/vapi-auth';
import { constantTimeEqual } from '@platform/security/sanitize';
import { verifyToken, isTokenBlacklisted, isUserBlacklisted, type JWTPayload } from '@platform/auth/jwt';
import { checkRateLimit } from '@platform/cache/rate-limiter';
import { logger } from '@platform/logging/logger';
import { BRAND_API_REALM } from '@shared/branding';
import { buildRateLimitKey, DEFAULT_RATE_LIMIT, resolveRateLimitBudget } from './rate-limit-policy';
import { ApiError, Errors, zodToIssues, type Problem } from './errors';
import {
  isHandlerResult,
  ok,
  type ApiSuccess,
  type HandlerResult,
  type RequestMeta,
} from './response';

// ─── Platform constants ────────────────────────────────────────────────────────

const CURRENT_VERSION = '2025-11-01';
const PROBLEM_CONTENT_TYPE = 'application/problem+json';

// ─── Auth strategies ───────────────────────────────────────────────────────────

type AuthStrategy = 'vapi' | 'jwt' | 'internal' | 'none';

// Exported so route handlers and middleware can reference it
export type { AuthStrategy };

// ─── Configuration ─────────────────────────────────────────────────────────────

type InferSchema<T extends z.ZodTypeAny | undefined> =
  T extends z.ZodTypeAny ? z.infer<T> : undefined;

export interface HandlerConfig<
  TBody extends z.ZodTypeAny | undefined = undefined,
  TQuery extends z.ZodTypeAny | undefined = undefined,
> {
  /** Logging tag, e.g. 'AI:CrmUpdate' */
  tag: string;

  /** Authentication strategy. Defaults to 'vapi'. */
  auth?: AuthStrategy;

  /**
   * Rate limiting config.
   * Set to false to disable entirely (only for internal routes).
   */
  rateLimit?: { max: number; windowMs: number } | false;

  /** Zod schema for the request body (POST/PUT/PATCH). */
  body?: TBody;

  /** Zod schema for query string parameters (GET). */
  query?: TQuery;

  /**
   * API version string for the response meta.
   * Defaults to the current platform version (CURRENT_VERSION).
   */
  version?: string;

  /**
   * Required permission for this route. Format: 'resource.action' (e.g. 'leads.write').
   * Checked after auth, before the handler executes.
   * Requires auth='jwt'. Skipped if omitted (backward-compatible — all existing routes unaffected).
   *
   * Phase 1: field is defined but enforcement is a no-op until RBAC seeding is complete.
   * Phase 2: enforced via hasPermission() from the auth module.
   */
  permission?: string;

  /**
   * Enforce that token.orgId matches the resource's organization context.
   * Defaults to true when permission is set. Set to false only for super-admin routes.
   * Phase 1: defined but not yet enforced. Phase 2: wired into middleware.
   */
  orgScoped?: boolean;

  /**
   * Require MFA completion in the access token's amr claim.
   * When true, the handler returns 403 if amr does not include 'otp' or 'hwk'.
   * Only meaningful when auth='jwt'.
   * Apply to admin routes, destructive operations, and sensitive data.
   */
  requireMfa?: boolean;
}

export interface HandlerContext<
  TBody extends z.ZodTypeAny | undefined = undefined,
  TQuery extends z.ZodTypeAny | undefined = undefined,
> {
  body:  InferSchema<TBody>;
  query: InferSchema<TQuery>;
  meta:  RequestMeta;
  req:   NextRequest;
  /** Verified JWT payload — available when auth='jwt', null otherwise. */
  auth:  JWTPayload | null;
}

type HandlerFn<
  TBody extends z.ZodTypeAny | undefined,
  TQuery extends z.ZodTypeAny | undefined,
> = (ctx: HandlerContext<TBody, TQuery>) => Promise<unknown>;

// ─── Request ID ────────────────────────────────────────────────────────────────

function generateRequestId(): string {
  // Format: req_<timestamp_base36><4_random_chars>
  const ts  = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `req_${ts}${rnd}`;
}

// ─── WWW-Authenticate challenge builder ────────────────────────────────────────

/**
 * Produces the WWW-Authenticate challenge for a given auth strategy.
 *
 * RFC 9110 §15.5.2: A server generating a 401 response MUST send a
 * WWW-Authenticate header field containing at least one challenge.
 *
 * Challenge formats follow RFC 7235 §2.1 syntax:
 *   Bearer — RFC 6750 (OAuth 2.0 Bearer Token)
 *   ApiKey — de facto scheme used for shared-secret APIs
 */
function wwwAuthChallenge(strategy: AuthStrategy): string {
  const realm = BRAND_API_REALM;
  switch (strategy) {
    case 'jwt':      return `Bearer realm="${realm}", charset="UTF-8"`;
    case 'vapi':     return `ApiKey realm="${realm}"`;
    case 'internal': return `ApiKey realm="${realm}"`;
    case 'none':     return '';
  }
}

// ─── Problem Details response builder ─────────────────────────────────────────

function problemResponse(
  problem: Omit<Problem, 'timestamp'>,
  headers: Record<string, string> = {}
): NextResponse {
  const body: Problem = {
    ...problem,
    timestamp: new Date().toISOString(),
  };
  return new NextResponse(JSON.stringify(body), {
    status:  problem.status,
    headers: {
      'Content-Type':    PROBLEM_CONTENT_TYPE,
      'X-Request-Id':    problem.requestId ?? '',
      ...headers,
    },
  });
}

// ─── Success envelope builder ──────────────────────────────────────────────────

function envelopeResponse<T>(
  result: HandlerResult<T>,
  meta:   RequestMeta
): NextResponse {
  const status = result.data === null ? 204 : result.status;
  const sharedHeaders: Record<string, string> = {
    'X-Request-Id':  meta.requestId,
    'X-Version':     meta.version,
    'X-Duration-Ms': String(meta.durationMs),
    ...(result.headers ?? {}),
  };

  // RFC 9110 §8.6: null-body statuses (204, 205, 304) MUST NOT include
  // a message body. Passing any body to NextResponse with these statuses
  // violates the WHATWG Fetch spec and throws a TypeError at runtime.
  if (status === 204) {
    return new NextResponse(null, { status: 204, headers: sharedHeaders });
  }

  const body: ApiSuccess<T> = {
    data: result.data as T,
    meta,
    ...(result.pagination ? { pagination: result.pagination } : {}),
  };
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...sharedHeaders,
    },
  });
}

function decorateRawResponse(res: NextResponse, meta: RequestMeta): NextResponse {
  res.headers.set('X-Request-Id', meta.requestId);
  res.headers.set('X-Version', meta.version);
  res.headers.set('X-Duration-Ms', String(meta.durationMs));
  return res;
}

// ─── createHandler ─────────────────────────────────────────────────────────────

/**
 * Creates a Next.js route handler with full middleware pipeline.
 *
 * @param config  Route-level configuration: auth, rate limiting, schemas
 * @param fn      Your business logic — receives validated inputs, returns data
 */
export function createHandler<
  TBody extends z.ZodTypeAny | undefined = undefined,
  TQuery extends z.ZodTypeAny | undefined = undefined,
>(
  config: HandlerConfig<TBody, TQuery>,
  fn: HandlerFn<TBody, TQuery>
): (req: NextRequest) => Promise<NextResponse> {
  const version      = config.version ?? CURRENT_VERSION;
  const authStrategy = config.auth ?? 'vapi';

  return async (req: NextRequest): Promise<NextResponse> => {
    const startMs    = Date.now();
    const requestId  = req.headers.get('x-request-id') ?? generateRequestId();
    const instance   = new URL(req.url).pathname;

    // ── Meta (grows as we add duration at the end) ──────────────────────────
    const buildMeta = (): RequestMeta => ({
      requestId,
      timestamp: new Date(startMs).toISOString(),
      version,
      durationMs: Date.now() - startMs,
    });

    /**
     * Convert an ApiError to a Problem Details response.
     *
     * Merges (in order of priority):
     *   1. err.headers  — RFC 9110 required headers (Allow, etc.)
     *   2. Retry-After  — derived from problem.retryAfter when retryable
     *   3. WWW-Authenticate — RFC 9110 §15.5.2 MUST on 401
     */
    const problem = (err: ApiError): NextResponse => {
      const p = err.problem;
      const extraHeaders: Record<string, string> = { ...(err.headers ?? {}) };

      // RFC 6585 §4 / RFC 9110 §10.2.4: include Retry-After when retryable
      if (p.retryable && p.retryAfter) {
        extraHeaders['Retry-After'] = String(p.retryAfter);
      }

      // RFC 9110 §15.5.2: 401 MUST include WWW-Authenticate
      if (p.status === 401) {
        const challenge = wwwAuthChallenge(authStrategy);
        if (challenge) extraHeaders['WWW-Authenticate'] = challenge;
      }

      return problemResponse({ ...p, requestId, instance }, extraHeaders);
    };

    try {
      // ── 1. Rate limiting ────────────────────────────────────────────────────
      let jwtPayload: JWTPayload | null = null;

      const enforceRateLimit = async (payload: JWTPayload | null): Promise<NextResponse | null> => {
        if (config.rateLimit === false) return null;

        const configured = config.rateLimit ?? DEFAULT_RATE_LIMIT;
        const budget = resolveRateLimitBudget(configured, authStrategy, authStrategy === 'jwt' && Boolean(payload?.sub));
        const rlKey = buildRateLimitKey(config.tag, authStrategy, req, payload);
        const rl = await checkRateLimit(rlKey, budget.max, budget.windowMs);

        if (!rl.allowed) {
          const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
          const err = Errors.rateLimit(retryAfter);
          const headers: Record<string, string> = {
            // Standard unprefixed rate-limit headers (IETF draft-ietf-httpapi-ratelimit-headers)
            'RateLimit-Limit':     String(budget.max),
            'RateLimit-Remaining': '0',
            'RateLimit-Reset':     String(retryAfter),
            'Retry-After':         String(retryAfter),
            // Legacy X-prefixed headers (backward compat)
            'X-RateLimit-Limit':     String(budget.max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset':     String(rl.resetAt),
          };
          return problemResponse({ ...err.problem, requestId, instance }, headers);
        }

        return null;
      };

      // ── 2. Authentication ───────────────────────────────────────────────────
      if (authStrategy === 'vapi') {
        const authError = validateVapiAuth(req);
        if (authError) {
          const rateLimited = await enforceRateLimit(null);
          if (rateLimited) return rateLimited;
          const detail = authError.status === 500
            ? 'Server misconfiguration — VAPI_WEBHOOK_SECRET not set'
            : 'Invalid or missing x-vapi-secret header';
          const err = authError.status === 500
            ? Errors.internal(detail)
            : Errors.unauthorized(detail);
          return problem(err);
        }
      }

      if (authStrategy === 'jwt') {
        const authHeader = req.headers.get('authorization') ?? '';
        // Primary: Bearer token from Authorization header (API-to-API, mobile)
        const bearer = authHeader.match(/^Bearer\s+(.+)$/i);
        let token = bearer?.[1] ?? '';
        // Fallback: httpOnly `at` cookie (access JWT) for same-origin browser requests.
        // Note: `token`/`portal_token` are opaque refresh tokens — not JWTs, not usable here.
        if (!token) {
          token = req.cookies.get('at')?.value ?? '';
        }
        if (!token) {
          const rateLimited = await enforceRateLimit(null);
          if (rateLimited) return rateLimited;
          return problem(Errors.unauthorized('Authentication required'));
        }

        try {
          jwtPayload = await verifyToken(token);
        } catch {
          const rateLimited = await enforceRateLimit(null);
          if (rateLimited) return rateLimited;
          return problem(Errors.unauthorized('Invalid or expired token'));
        }
        if (!jwtPayload) return problem(Errors.unauthorized('Invalid or expired token'));

        // Token-level blacklist: catches individually revoked tokens (logout).
        // Fail-open if Redis is unavailable (see isTokenBlacklisted for rationale).
        if (await isTokenBlacklisted(jwtPayload.jti)) {
          return problem(Errors.unauthorized('Token has been revoked'));
        }

        // User-level blacklist: catches revokeAllSessions (GDPR erasure, "sign out all devices").
        // Rejects tokens whose iat predates the revocation timestamp stored in Redis.
        if (jwtPayload.sub && await isUserBlacklisted(jwtPayload.sub, jwtPayload.iat)) {
          return problem(Errors.unauthorized('Session has been revoked'));
        }

        // MFA enforcement: if requireMfa=true, the amr claim must include 'otp' or 'hwk'.
        if (config.requireMfa) {
          const amr: string[] = jwtPayload.amr ?? [];
          if (!amr.includes('otp') && !amr.includes('hwk')) {
            return problem(Errors.forbidden('This action requires multi-factor authentication'));
          }
        }

        // Rate-limit authenticated JWT requests before RBAC so a low-privilege
        // user cannot hammer a protected endpoint without consuming their budget.
        const jwtRateLimited = await enforceRateLimit(jwtPayload);
        if (jwtRateLimited) return jwtRateLimited;

        // RBAC permission check: enforce when a route declares a required permission.
        // Skipped when permission is omitted (backward-compatible — existing routes unaffected).
        if (config.permission) {
          const { hasPermission } = await import('@modules/supporting/auth/application/rbac.service');
          const allowed = await hasPermission(jwtPayload.roles, config.permission);
          if (!allowed) {
            return problem(Errors.forbidden('Insufficient permissions'));
          }
        }
      }

      if (authStrategy === 'internal') {
        const internalKey = req.headers.get('x-internal-key') ?? '';
        if (!constantTimeEqual(internalKey, process.env.INTERNAL_API_KEY ?? '')) {
          const rateLimited = await enforceRateLimit(null);
          if (rateLimited) return rateLimited;
          return problem(Errors.unauthorized('Invalid internal API key'));
        }
      }

      // JWT requests were already rate-limited above (before RBAC); only apply
      // the per-request budget here for other auth strategies (internal, vapi).
      if (authStrategy !== 'jwt') {
        const rateLimited = await enforceRateLimit(jwtPayload);
        if (rateLimited) return rateLimited;
      }

      // ── 3. Content-Type validation (RFC 9110 §15.5.15) ─────────────────────
      // For requests with a body schema, require application/json.
      // Allows omitting Content-Type on GET/HEAD/DELETE when there's no body.
      if (config.body && req.method !== 'GET' && req.method !== 'HEAD') {
        const ct = req.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) {
          return problem(Errors.unsupportedMediaType());
        }
      }

      // ── 4. Parse query string ───────────────────────────────────────────────
      let parsedQuery: InferSchema<TQuery> = undefined as InferSchema<TQuery>;
      if (config.query) {
        const { searchParams } = new URL(req.url);
        const rawQuery: Record<string, string> = {};
        searchParams.forEach((v, k) => { rawQuery[k] = v; });

        const result = config.query.safeParse(rawQuery);
        if (!result.success) {
          const err = Errors.validation(
            'Query string parameters failed validation',
            zodToIssues(result.error)
          );
          return problem(err);
        }
        parsedQuery = result.data as InferSchema<TQuery>;
      }

      // ── 5. Parse request body ───────────────────────────────────────────────
      let parsedBody: InferSchema<TBody> = undefined as InferSchema<TBody>;
      if (config.body) {
        let raw: unknown;
        try {
          raw = await req.json();
        } catch {
          return problem(Errors.badRequest('Request body is not valid JSON'));
        }

        const result = config.body.safeParse(raw);
        if (!result.success) {
          const err = Errors.validation(
            'Request body failed validation',
            zodToIssues(result.error)
          );
          return problem(err);
        }
        parsedBody = result.data as InferSchema<TBody>;
      }

      // ── 6. Execute handler ──────────────────────────────────────────────────
      const ctx: HandlerContext<TBody, TQuery> = {
        body:  parsedBody,
        query: parsedQuery,
        meta:  buildMeta(),
        req,
        auth:  jwtPayload,
      };

      logger.info(config.tag, `${req.method} ${instance}`, { requestId });

      const raw = await fn(ctx);
      const meta = buildMeta();

      if (raw instanceof NextResponse) {
        const res = decorateRawResponse(raw, meta);

        logger.info(config.tag, `${req.method} ${instance} → ${res.status}`, {
          requestId,
          durationMs: meta.durationMs,
        });

        return res;
      }

      // ── 7. Wrap in envelope ─────────────────────────────────────────────────
      const handlerResult: HandlerResult<unknown> = isHandlerResult(raw)
        ? raw
        : ok(raw);

      const res  = envelopeResponse(handlerResult, meta);

      logger.info(config.tag, `${req.method} ${instance} → ${handlerResult.status}`, {
        requestId,
        durationMs: meta.durationMs,
      });

      return res;

    } catch (err) {
      // ── 8. Handle ApiError (expected) ───────────────────────────────────────
      if (err instanceof ApiError) {
        logger.warn(config.tag, `API error ${err.problem.status}: ${err.problem.detail}`, {
          requestId,
          type: err.problem.type,
        });
        return problem(err);
      }

      // ── 9. Handle unexpected errors (never leak internals) ──────────────────
      logger.error(config.tag, 'Unhandled error', { requestId, err });
      return problem(Errors.internal());
    }
  };
}
