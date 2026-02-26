/**
 * createHandler — the single entry point for all API route handlers.
 *
 * Composes the middleware pipeline:
 *   1. Generate / extract request ID
 *   2. Rate limiting (configurable per-route)
 *   3. Authentication (vapi | jwt | internal | none)
 *   4. Request body / query-string parsing + Zod validation
 *   5. Business logic (the caller-supplied handler function)
 *   6. Wrap result in standard ApiSuccess envelope
 *   7. Attach observability headers (X-Request-Id, X-Version, X-Duration-Ms)
 *   8. Catch ApiError → RFC 7807 Problem Details
 *   9. Catch unknown error → 500 Problem Details (never leaks stack traces)
 *
 * Usage:
 *   export const POST = createHandler(
 *     { auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: MySchema, tag: 'AI:Thing' },
 *     async ({ body, meta }) => {
 *       const result = await doWork(body);
 *       return ok(result);         // or created(), paginated(), etc.
 *     }
 *   );
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateVapiAuth } from '@core/auth/vapi-auth';
import { verifyToken } from '@core/auth/jwt';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { logger } from '@core/logging/logger';
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
}

export interface HandlerContext<
  TBody extends z.ZodTypeAny | undefined = undefined,
  TQuery extends z.ZodTypeAny | undefined = undefined,
> {
  body:  InferSchema<TBody>;
  query: InferSchema<TQuery>;
  meta:  RequestMeta;
  req:   NextRequest;
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
  const body: ApiSuccess<T> = {
    data:       result.data as T,
    meta,
    ...(result.pagination ? { pagination: result.pagination } : {}),
  };
  return new NextResponse(JSON.stringify(body), {
    status:  result.data === null ? 204 : result.status,
    headers: {
      'Content-Type':   'application/json',
      'X-Request-Id':   meta.requestId,
      'X-Version':      meta.version,
      'X-Duration-Ms':  String(meta.durationMs),
    },
  });
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
  const version     = config.version ?? CURRENT_VERSION;
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

    // Helper to produce a problem response with request context attached
    const problem = (err: ApiError): NextResponse => {
      const p = err.problem;
      const extraHeaders: Record<string, string> = {};
      if (p.retryable && p.retryAfter) {
        extraHeaders['Retry-After'] = String(p.retryAfter);
      }
      return problemResponse({ ...p, requestId, instance }, extraHeaders);
    };

    try {
      // ── 1. Rate limiting ────────────────────────────────────────────────────
      if (config.rateLimit !== false) {
        const rlConf = config.rateLimit ?? { max: 60, windowMs: 60_000 };
        const rlKey  = req.headers.get('x-forwarded-for')
          ?? req.headers.get('x-real-ip')
          ?? 'unknown';
        const rl = await checkRateLimit(rlKey, rlConf.max, rlConf.windowMs);

        if (!rl.allowed) {
          const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
          const err = Errors.rateLimit(retryAfter);
          const headers: Record<string, string> = {
            'X-RateLimit-Limit':     String(rlConf.max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset':     String(rl.resetAt),
            'Retry-After':           String(retryAfter),
          };
          return problemResponse({ ...err.problem, requestId, instance }, headers);
        }
      }

      // ── 2. Authentication ───────────────────────────────────────────────────
      if (authStrategy === 'vapi') {
        const authError = validateVapiAuth(req);
        if (authError) {
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
        const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!token) return problem(Errors.unauthorized('Bearer token required'));
        try {
          await verifyToken(token);
        } catch {
          return problem(Errors.unauthorized('Invalid or expired token'));
        }
      }

      if (authStrategy === 'internal') {
        const internalKey = req.headers.get('x-internal-key');
        if (internalKey !== process.env.INTERNAL_API_KEY) {
          return problem(Errors.unauthorized('Invalid internal API key'));
        }
      }

      // ── 3. Parse query string ───────────────────────────────────────────────
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

      // ── 4. Parse request body ───────────────────────────────────────────────
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

      // ── 5. Execute handler ──────────────────────────────────────────────────
      const ctx: HandlerContext<TBody, TQuery> = {
        body:  parsedBody,
        query: parsedQuery,
        meta:  buildMeta(),
        req,
      };

      logger.info(config.tag, `${req.method} ${instance}`, { requestId });

      const raw = await fn(ctx);

      // ── 6. Wrap in envelope ─────────────────────────────────────────────────
      const handlerResult: HandlerResult<unknown> = isHandlerResult(raw)
        ? raw
        : ok(raw);

      const meta = buildMeta();
      const res  = envelopeResponse(handlerResult, meta);

      logger.info(config.tag, `${req.method} ${instance} → ${handlerResult.status}`, {
        requestId,
        durationMs: meta.durationMs,
      });

      return res;

    } catch (err) {
      // ── 7. Handle ApiError (expected) ───────────────────────────────────────
      if (err instanceof ApiError) {
        logger.warn(config.tag, `API error ${err.problem.status}: ${err.problem.detail}`, {
          requestId,
          type: err.problem.type,
        });
        return problem(err);
      }

      // ── 8. Handle unexpected errors (never leak internals) ──────────────────
      logger.error(config.tag, 'Unhandled error', { requestId, err });
      return problem(Errors.internal());
    }
  };
}
