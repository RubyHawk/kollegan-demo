/**
 * @core/api — API platform primitives.
 *
 * Import from here in route handlers:
 *   import { createHandler, Errors, ok, created, paginated } from '@core/api';
 */

export { createHandler }           from './handler';
export type { HandlerConfig, HandlerContext } from './handler';

export { Errors, ApiError, zodToIssues } from './errors';
export type { Problem, ValidationIssue }  from './errors';

export { ok, created, accepted, paginated, noContent } from './response';
export type { ApiSuccess, RequestMeta, Pagination, HandlerResult } from './response';
