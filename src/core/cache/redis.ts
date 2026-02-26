import Redis from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

export const redis =
  global.__redis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    // Suppress connection errors in environments where Redis isn't configured
    enableOfflineQueue: false,
  });

redis.on('error', (err) => {
  // Only log in development to avoid noise in production logs when Redis is optional
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Redis] Connection error:', err.message);
  }
});

if (process.env.NODE_ENV !== 'production') {
  global.__redis = redis;
}
