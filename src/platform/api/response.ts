/**
 * API Response primitives — standardized success envelope.
 *
 * Every successful API response is wrapped in this envelope.
 * Consistent structure is critical for:
 *   - LLMs that parse structured tool call results
 *   - Orchestration engines that need to extract `data` deterministically
 *   - SDKs that unwrap the envelope before returning to callers
 *   - Distributed tracing via requestId propagation
 *
 * Shape:
 *   { data: T, meta: RequestMeta, pagination?: Pagination }
 *
 * Errors use RFC 9457 Problem Details (see errors.ts) — separate type,
 * never { data: null, error: ... }. The LLM knows success = has `data`,
 * failure = has `type` (problem URI).
 */

// ─── Core types ────────────────────────────────────────────────────────────────

/**
 * Metadata attached to every response.
 * Enables request tracing, version negotiation, and performance observability
 * without requiring callers to read response headers.
 */
export interface RequestMeta {
  /** Unique request identifier — also returned in X-Request-Id header */
  requestId: string;
  /** ISO 8601 UTC timestamp of when the request was received */
  timestamp: string;
  /** API version used to process this request (date-based: YYYY-MM-DD) */
  version: string;
  /** Wall-clock processing time in milliseconds */
  durationMs: number;
}

/**
 * Cursor-based pagination metadata.
 * Cursor pagination is preferred over offset for agentic workflows —
 * agents iterate with nextCursor until hasNext = false, never skipping rows.
 */
export interface Pagination {
  /** Total number of matching records (may be omitted for large sets) */
  total?: number;
  /** Number of items in this page */
  count: number;
  hasNext: boolean;
  hasPrev: boolean;
  /** Opaque cursor for the next page; pass as `cursor` query param */
  nextCursor?: string;
  /** Opaque cursor for the previous page */
  prevCursor?: string;
}

/** The standard success response envelope */
export interface ApiSuccess<T> {
  data: T;
  meta: RequestMeta;
  pagination?: Pagination;
}

// ─── Internal result markers (used by createHandler) ──────────────────────────

/** @internal — used by the handler wrapper to determine HTTP status + pagination + extra headers */
export interface HandlerResult<T> {
  __apiResult: true;
  data:        T;
  status:      number;
  pagination?: Pagination;
  /**
   * Extra HTTP headers to include in the success response.
   * Use sparingly — prefer body fields over custom headers.
   * RFC 9110 §15.3.2: 201 Created SHOULD include Location.
   * RFC 8288: paginated responses SHOULD include Link headers.
   */
  headers?: Record<string, string>;
}

function result<T>(
  data:        T,
  status:      number,
  pagination?: Pagination,
  headers?:    Record<string, string>
): HandlerResult<T> {
  return { __apiResult: true, data, status, pagination, headers };
}

export function isHandlerResult(v: unknown): v is HandlerResult<unknown> {
  return typeof v === 'object' && v !== null && '__apiResult' in v;
}

// ─── Response helpers ──────────────────────────────────────────────────────────

/**
 * Return a 200 OK response from a handler.
 *
 * @example
 * return ok({ transcriptId: 'tr_abc' });
 */
export function ok<T>(data: T): HandlerResult<T> {
  return result(data, 200);
}

/**
 * Return a 201 Created response.
 *
 * RFC 9110 §15.3.2: The server SHOULD send a Location header containing a URI
 * reference for the specific resource created. Pass the `location` argument to
 * comply — the handler will emit it as the `Location` response header.
 *
 * @param location  Absolute URI of the newly created resource (SHOULD per RFC 9110)
 *
 * @example
 * return created({ workflowId: 'wf_abc' }, `/api/v1/workflows/wf_abc`);
 */
export function created<T>(data: T, location?: string): HandlerResult<T> {
  return result(data, 201, undefined, location ? { Location: location } : undefined);
}

/**
 * Return a 202 Accepted response for async operations.
 * The `data` should include a way to poll for completion.
 *
 * @example
 * return accepted({ runId: 'run_abc', pollUrl: '/api/v1/runs/run_abc' });
 */
export function accepted<T>(data: T): HandlerResult<T> {
  return result(data, 202);
}

/**
 * Return a paginated 200 response.
 *
 * @example
 * return paginated(items, { count: items.length, total: 142, hasNext: true, nextCursor: 'cur_x' });
 */
export function paginated<T>(data: T, pagination: Pagination): HandlerResult<T> {
  return result(data, 200, pagination);
}

/**
 * Return a 204 No Content response.
 * Use for DELETE operations that return no body.
 *
 * @example
 * return noContent();
 */
export function noContent(): HandlerResult<null> {
  return result(null, 204);
}
