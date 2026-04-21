/**
 * GET /api/health
 *
 * Returns 200 if DB + Redis are reachable, 503 otherwise.
 * Used by Docker healthcheck and future Kubernetes readiness probe.
 * No auth required. Called by infrastructure, not users.
 */

export const dynamic = 'force-dynamic';

export { handleHealthCheck as GET } from '@platform/health';
