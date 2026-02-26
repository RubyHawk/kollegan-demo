/**
 * API Error primitives — RFC 7807 Problem Details for HTTP APIs.
 *
 * https://datatracker.ietf.org/doc/html/rfc7807
 *
 * Every error that leaves the API surface is a Problem object.
 * This makes errors machine-readable for:
 *   - LLM agents that need to decide whether to retry
 *   - Orchestration engines that route on error type
 *   - SDKs that surface typed errors to callers
 *   - On-call engineers who read structured logs
 */

import type { z } from 'zod';

// ─── Problem Details (RFC 7807) ────────────────────────────────────────────────

/**
 * Base problem type URI — should resolve to human-readable documentation.
 * Treat as a stable namespace, not a live HTTP URL.
 */
const PROBLEM_BASE = 'https://docs.kollegan.ai/problems';

export interface ValidationIssue {
  /** Dot-separated field path: "address.postcode", "_root" for top-level */
  field: string;
  /** Human-readable message suitable for display and LLM consumption */
  message: string;
  /** Machine-readable Zod issue code */
  code: string;
}

export interface Problem {
  /** Stable URI identifying the problem type */
  type: string;
  /** Short human-readable summary (same for all instances of this type) */
  title: string;
  /** HTTP status code */
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
 * Throw this from any handler to produce a structured RFC 7807 error response.
 *
 * @example
 * throw Errors.notFound('Workflow');
 * throw Errors.validation('Invalid dates', issues);
 */
export class ApiError extends Error {
  readonly problem: Omit<Problem, 'timestamp' | 'requestId' | 'instance'>;

  constructor(problem: Omit<Problem, 'timestamp' | 'requestId' | 'instance'>) {
    super(problem.title);
    this.name = 'ApiError';
    this.problem = problem;
  }
}

// ─── Internal factory ──────────────────────────────────────────────────────────

function mkError(
  slug: string,
  title: string,
  status: number,
  detail: string,
  ext?: Partial<Omit<Problem, 'type' | 'title' | 'status' | 'detail' | 'timestamp' | 'requestId' | 'instance'>>
): ApiError {
  return new ApiError({
    type:     `${PROBLEM_BASE}/${slug}`,
    title,
    status,
    detail,
    retryable: false,
    ...ext,
  });
}

// ─── Zod → ValidationIssue conversion ─────────────────────────────────────────

export function zodToIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    field:   issue.path.length > 0 ? issue.path.join('.') : '_root',
    message: issue.message,
    code:    issue.code,
  }));
}

// ─── Errors factory ────────────────────────────────────────────────────────────

/**
 * Typed error factories.  Throw these from handlers — the createHandler
 * wrapper converts them to proper RFC 7807 JSON Problem Details responses.
 *
 * Each factory is documented with:
 *   - HTTP status
 *   - retryable hint (visible to agents and SDK callers)
 *   - intended use case
 */
export const Errors = {
  /**
   * 400 — Request body or query params failed schema validation.
   * retryable: false (caller must fix the request)
   */
  validation: (detail: string, issues?: ValidationIssue[]) =>
    mkError('validation-error', 'Validation Error', 400, detail, {
      errors:    issues,
      retryable: false,
    }),

  /**
   * 400 — Request is syntactically valid but semantically incorrect.
   * e.g. "check_out before check_in"
   */
  badRequest: (detail: string) =>
    mkError('bad-request', 'Bad Request', 400, detail, { retryable: false }),

  /**
   * 401 — Missing or invalid authentication credentials.
   * retryable: false (caller must provide valid credentials)
   */
  unauthorized: (detail = 'Authentication credentials are missing or invalid') =>
    mkError('unauthorized', 'Unauthorized', 401, detail, { retryable: false }),

  /**
   * 403 — Credentials valid but insufficient for this operation.
   */
  forbidden: (detail = 'You do not have permission to perform this action') =>
    mkError('forbidden', 'Forbidden', 403, detail, { retryable: false }),

  /**
   * 404 — The requested resource does not exist.
   * retryable: false (the resource won't appear from retrying)
   */
  notFound: (resource: string) =>
    mkError('not-found', 'Not Found', 404, `${resource} was not found`, { retryable: false }),

  /**
   * 409 — Resource state conflict (e.g. room already locked).
   * retryable: true — state may change; agent should re-check then retry
   */
  conflict: (detail: string) =>
    mkError('conflict', 'Conflict', 409, detail, { retryable: true }),

  /**
   * 422 — Request is valid but cannot be processed in the current state.
   */
  unprocessable: (detail: string) =>
    mkError('unprocessable', 'Unprocessable Entity', 422, detail, { retryable: false }),

  /**
   * 429 — Rate limit exceeded.
   * retryable: true — agent should wait retryAfter seconds then retry
   *
   * @param retryAfter seconds until the limit resets
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
   * 500 — Unexpected server error.
   * retryable: true — transient failures are common; agent may retry with backoff
   */
  internal: (detail = 'An unexpected error occurred. The issue has been logged.') =>
    mkError('internal-error', 'Internal Server Error', 500, detail, { retryable: true }),

  /**
   * 503 — Service or dependency temporarily unavailable.
   * retryable: true — classic transient; agent should use exponential backoff
   */
  unavailable: (detail = 'The service is temporarily unavailable. Please retry shortly.') =>
    mkError('service-unavailable', 'Service Unavailable', 503, detail, {
      retryable:   true,
      retryAfter:  30,
    }),
} as const;
