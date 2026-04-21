import { redis } from '@platform/cache/redis';
import { prisma } from '@platform/database/prisma';

export async function checkDatabaseHealth(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

export async function checkRedisHealth(): Promise<void> {
  await redis.ping();
}
