/**
 * GET /api/health
 *
 * Returns 200 if DB + Redis are reachable, 503 otherwise.
 * Used by Docker healthcheck and future Kubernetes readiness probe.
 * No auth required — called by infrastructure, not users.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@platform/database/prisma';
import { redis } from '@platform/cache/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);

  const results = {
    db: checks[0].status === 'fulfilled' ? 'ok' : 'degraded',
    redis: checks[1].status === 'fulfilled' ? 'ok' : 'degraded',
  };

  const healthy = Object.values(results).every((v) => v === 'ok');

  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', checks: results, ts: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
