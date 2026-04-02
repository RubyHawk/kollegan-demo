/**
 * API Error primitives — RFC 9457 Problem Details for HTTP APIs.
 *
 * https://www.rfc-editor.org/rfc/rfc9457  (obsoletes RFC 7807)
 *
 * Status code semantics follow RFC 9110 "HTTP Semantics":
 * https://www.rfc-editor.org/rfc/rfc9110
 *
 * Every error that leaves the API surface is a Problem object.
 * This makes errors machine-readable for:
 *   - LLM agents that need to decide whether to retry
 *   - Orchestration engines that route on error type
 *   - SDKs that surface typed errors to callers
 *   - On-call engineers who read structured logs
 */

import type { z } from 'zod';
import { BRAND_PROBLEM_BASE } from '@shared/branding';

// ─── Problem Details (RFC 9457) ────────────────────────────────────────────────

/**
 * Base problem type URI — should resolve to human-readable documentation.
 * RFC 9457 §3.1.1: resolvable URIs are encouraged but not required.
 * Treat as a stable namespace, not a live HTTP URL.
 */
const PROBLEM_BASE = BRAND_PROBLEM_BASE;

/**
 * Field-level validation issue.
 *
 * Shape mirrors the RFC 9457 §3 example for validation errors:
 *   { "pointer": "#/age", "detail": "must be a positive integer" }
 *
 * `pointer` uses JSON Pointer notation (RFC 6901):
 *   "#"               — document root (top-level schema failure)
 *   "#/email"         — top-level field
 *   "#/address/zip"   — nested field
 *   "#/items/0/price" — array element field
 *
 * `code` is our extension — a machine-readable Zod issue code
 * (invalid_type, too_small, invalid_string, etc.) that lets callers
 * apply conditional logic without parsing the `detail` string.
 */
export interface ValidationIssue {
  /** JSON Pointer (RFC 6901) to the failing field: "#/email", "#/items/0/price" */
  pointer: string;
  /** Human-readable explanation of this specific failure */
  detail: string;
  /** Machine-readable Zod issue code — our extension per RFC 9457 §3.2 */
  code: string;
}

export interface Problem {
  /** Stable URI identifying the problem type */
  type: string;
  /** Short human-readable summary (same for all instances of this type) */
  title: string;
  /** HTTP status code — semantics per RFC 9110 §15 */
  status: number;
  /** Human-readable explanation specific to this occurrence */
  detail: string;
  /** URI reference identifying the specific occurrence (e.g. request path) */
  instance?: string;
  /** Unique request ID for log correlation */
  requestId?: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Validation issues — only present on 400 validation errors */
  errors?: ValidationIssue[];
  /** Whether a retry with the same request may succeed */
  retryable: boolean;
  /** Seconds to wait before retrying (only when retryable=true) */
  retryAfter?: number;
}

// ─── ApiError class ────────────────────────────────────────────────────────────

/**
 * Throw this from any handler to produce a structured RFC 9457 error response.
 *
 * The optional `headers` map lets error factories attach RFC 9110-required
 * headers that must accompany specific status codes:
 *   - 405 Method Not Allowed → `Allow: GET, POST`  (RFC 9110 §15.5.6 MUST)
 *   - 429 Rate Limited       → `Retry-After: 47`   (handled via retryAfter)
 *
 * @example
 * throw Errors.notFound('Workflow');
 * throw Errors.methodNotAllowed(['GET', 'POST']);
 * throw Errors.validation('Invalid body', issues);
 */
export class ApiError extends Error {
  readonly problem: Omit<Problem, 'timestamp' | 'requestId' | 'instance'>;
  /** Extra HTTP headers to include in the error response (RFC 9110 compliance) */
  readonly headers?: Record<string, string>;

  constructor(
    problem: Omit<Problem, 'timestamp' | 'requestId' | 'instance'>,
    headers?: Record<string, string>
  ) {
    super(problem.title);
    this.name    = 'ApiError';
    this.problem = problem;
    this.headers = headers;
  }
}

// ─── Internal factory ──────────────────────────────────────────────────────────

function mkError(
  slug: string,
  title: string,
  status: number,
  detail: string,
  ext?: Partial<Omit<Problem, 'type' | 'title' | 'status' | 'detail' | 'timestamp' | 'requestId' | 'instance'>>,
  headers?: Record<string, string>
): ApiError {
  return new ApiError(
    {
      type:     `${PROBLEM_BASE}/${slug}`,
      title,
      status,
      detail,
      retryable: false,
      ...ext,
    },
    headers
  );
}

// ─── Zod → ValidationIssue conversion ─────────────────────────────────────────

/**
 * Converts a ZodError into RFC 9457-style ValidationIssues with JSON Pointer paths.
 *
 * JSON Pointer encoding (RFC 6901):
 *   []                  → "#"                  (root)
 *   ['email']           → "#/email"
 *   ['address','zip']   → "#/address/zip"
 *   ['items', 0, 'price'] → "#/items/0/price"
 *
 * Special characters are escaped per RFC 6901:
 *   '~' → '~0'
 *   '/' → '~1'
 */
export function zodToIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => {
    const pointer = issue.path.length === 0
      ? '#'
      : '#/' + issue.path
          .map((segment) =>
            String(segment)
              .replace(/~/g, '~0')
              .replace(/\//g, '~1')
          )
          .join('/');

    return {
      pointer,
      detail: issue.message,
      code:   issue.code,
    };
  });
}

// ─── Errors factory ────────────────────────────────────────────────────────────

/**
 * Typed error factories. Throw these from handlers — the createHandler
 * wrapper converts them to proper RFC 9457 JSON Problem Details responses.
 *
 * Status code choices follow RFC 9110 §15 semantics.
 * Each factory documents:
 *   - HTTP status and the RFC 9110 section that defines it
 *   - retryable hint visible to agents and SDK callers
 *   - any required response headers per RFC 9110
 */
export const Errors = {
  /**
   * 400 Bad Request — Request body or query params failed schema validation.
   * RFC 9110 §15.5.1
   * retryable: false (caller must fix the request)
   */
  validation: (detail: string, issues?: ValidationIssue[]) =>
    mkError('validation-error', 'Validation Error', 400, detail, {
      errors:    issues,
      retryable: false,
    }),

  /**
   * 400 Bad Request — Syntactically valid but semantically incorrect.
   * RFC 9110 §15.5.1
   * e.g. "check_out before check_in", "amount must be positive"
   */
  badRequest: (detail: string) =>
    mkError('bad-request', 'Bad Request', 400, detail, { retryable: false }),

  /**
   * 401 Unauthorized — Missing or invalid authentication credentials.
   * RFC 9110 §15.5.2
   * retryable: false (caller must provide valid credentials)
   */
  unauthorized: (detail = 'Authentication credentials are missing or invalid') =>
    mkError('unauthorized', 'Unauthorized', 401, detail, { retryable: false }),

  /**
   * 403 Forbidden — Credentials valid but insufficient scope for this operation.
   * RFC 9110 §15.5.4
   */
  forbidden: (detail = 'You do not have permission to perform this action') =>
    mkError('forbidden', 'Forbidden', 403, detail, { retryable: false }),

  /**
   * 404 Not Found — The resource does not exist.
   * RFC 9110 §15.5.5
   * retryable: false (the resource will not appear from retrying)
   */
  notFound: (resource: string) =>
    mkError('not-found', 'Not Found', 404, `${resource} was not found`, { retryable: false }),

  /**
   * 405 Method Not Allowed — HTTP method is not supported on this endpoint.
   * RFC 9110 §15.5.6 — MUST include Allow header listing supported methods.
   *
   * The createHandler wrapper reads err.headers and adds them to the response.
   *
   * @param allowedMethods e.g. ['GET', 'POST']
   */
  methodNotAllowed: (allowedMethods: string[]) =>
    mkError(
      'method-not-allowed',
      'Method Not Allowed',
      405,
      `This endpoint only supports: ${allowedMethods.join(', ')}`,
      { retryable: false },
      { Allow: allowedMethods.join(', ') }   // RFC 9110 §15.5.6 MUST
    ),

  /**
   * 409 Conflict — Resource state prevents fulfilling the request.
   * RFC 9110 §15.5.10
   * retryable: true — state may change; agent should re-check then retry
   */
  conflict: (detail: string) =>
    mkError('conflict', 'Conflict', 409, detail, { retryable: true }),

  /**
   * 415 Unsupported Media Type — Content-Type not accepted.
   * RFC 9110 §15.5.16
   * Typically fired when body is not application/json.
   */
  unsupportedMediaType: (detail = 'Content-Type must be application/json') =>
    mkError('unsupported-media-type', 'Unsupported Media Type', 415, detail, { retryable: false }),

  /**
   * 422 Unprocessable Content — Syntax valid, semantics unprocessable.
   * RFC 9110 §15.5.21 (was RFC 4918 §11.2)
   * Use when the request is parseable but cannot be actioned in current state.
   */
  unprocessable: (detail: string) =>
    mkError('unprocessable', 'Unprocessable Content', 422, detail, { retryable: false }),

  /**
   * 429 Too Many Requests — Rate limit exceeded.
   * RFC 9110 does not define 429 — it comes from RFC 6585 §4.
   * retryable: true — agent should wait retryAfter seconds then retry
   *
   * @param retryAfter seconds until the rate limit window resets
   */
  rateLimit: (retryAfter: number) =>
    mkError(
      'rate-limit-exceeded',
      'Too Many Requests',
      429,
      `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      { retryable: true, retryAfter }
    ),

  /**
   * 500 Internal Server Error — Unexpected server-side failure.
   * RFC 9110 §15.6.1
   * retryable: true — transient failures are common; agent may retry with backoff
   */
  internal: (detail = 'An unexpected error occurred. The issue has been logged.') =>
    mkError('internal-error', 'Internal Server Error', 500, detail, { retryable: true }),

  /**
   * 503 Service Unavailable — Dependency or service temporarily down.
   * RFC 9110 §15.6.4
   * retryable: true — agent should use exponential backoff
   */
  unavailable: (detail = 'The service is temporarily unavailable. Please retry shortly.') =>
    mkError('service-unavailable', 'Service Unavailable', 503, detail, {
      retryable:  true,
      retryAfter: 30,
    }),

  /**
   * 410 Gone — The resource existed but has been permanently removed.
   * RFC 9110 §15.5.11
   * Unlike 404 (may exist elsewhere), 410 signals permanent deletion.
   * retryable: false — the resource will not return
   */
  gone: (resource: string) =>
    mkError('gone', 'Gone', 410, `${resource} has been permanently removed`, { retryable: false }),

  /**
   * 413 Content Too Large — Request body exceeds the size limit.
   * RFC 9110 §15.5.14 (previously "Request Entity Too Large" in RFC 7231)
   * retryable: false — caller must reduce payload size
   */
  tooLarge: (detail = 'Request body exceeds the maximum allowed size') =>
    mkError('content-too-large', 'Content Too Large', 413, detail, { retryable: false }),

  /**
   * 428 Precondition Required — Conditional request header missing.
   * RFC 6585 §3
   * Use when the server requires conditional requests (If-Match, If-Unmodified-Since)
   * to prevent lost-update conflicts (e.g. "mid-air collision").
   * retryable: false — caller must add the required precondition header
   */
  preconditionRequired: (detail = 'This request must be conditional (If-Match or If-Unmodified-Since required)') =>
    mkError('precondition-required', 'Precondition Required', 428, detail, { retryable: false }),

  /**
   * 501 Not Implemented — The server does not support the requested functionality.
   * RFC 9110 §15.6.2
   * retryable: false — will not be implemented in the current version
   */
  notImplemented: (detail = 'This feature is not yet implemented') =>
    mkError('not-implemented', 'Not Implemented', 501, detail, { retryable: false }),

  /**
   * 502 Bad Gateway — Upstream dependency returned an invalid response.
   * RFC 9110 §15.6.3
   * retryable: true — upstream may recover; agent should retry with backoff
   */
  badGateway: (detail = 'An upstream service returned an unexpected response') =>
    mkError('bad-gateway', 'Bad Gateway', 502, detail, { retryable: true, retryAfter: 5 }),

  /**
   * 504 Gateway Timeout — Upstream dependency did not respond in time.
   * RFC 9110 §15.6.5
   * retryable: true — transient timeout; agent should retry with backoff
   */
  gatewayTimeout: (detail = 'An upstream service did not respond within the allowed time') =>
    mkError('gateway-timeout', 'Gateway Timeout', 504, detail, { retryable: true, retryAfter: 10 }),
} as const;
