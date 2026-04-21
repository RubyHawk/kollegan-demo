import { checkDatabaseHealth, checkRedisHealth } from './health.repository';

export type HealthCheckStatus = 'ok' | 'degraded';

export type HealthCheckResult = {
  status: HealthCheckStatus;
  checks: {
    db: HealthCheckStatus;
    redis: HealthCheckStatus;
  };
  ts: string;
};

export async function getHealthCheck(): Promise<HealthCheckResult> {
  const checks = await Promise.allSettled([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  const results = {
    db: checks[0].status === 'fulfilled' ? 'ok' : 'degraded',
    redis: checks[1].status === 'fulfilled' ? 'ok' : 'degraded',
  } satisfies HealthCheckResult['checks'];

  const healthy = Object.values(results).every((value) => value === 'ok');

  return {
    status: healthy ? 'ok' : 'degraded',
    checks: results,
    ts: new Date().toISOString(),
  };
}
