import Redis, { type RedisOptions } from 'ioredis';

declare global {
  var __redis: Redis | undefined;
}

export const redis =
  global.__redis ??
  new Redis(
    {
      ...parseRedisOptions(process.env.REDIS_URL ?? 'redis://localhost:6379'),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Suppress connection errors in environments where Redis isn't configured
      enableOfflineQueue: false,
    },
  );

function parseRedisOptions(connection: string): RedisOptions {
  if (/^\d+$/.test(connection)) {
    return { port: Number.parseInt(connection, 10) };
  }

  if (!connection.includes('://')) {
    return connection.startsWith('/')
      ? { path: connection }
      : { host: connection };
  }

  const url = new URL(connection);
  const options: RedisOptions = {};

  if (url.hostname) {
    options.host = decodeURIComponent(url.hostname);
  }

  if (url.port) {
    options.port = Number.parseInt(url.port, 10);
  }

  if (url.username) {
    options.username = decodeURIComponent(url.username);
  }

  if (url.password) {
    options.password = decodeURIComponent(url.password);
  }

  if (url.pathname && url.pathname !== '/') {
    const rawPath = decodeURIComponent(url.pathname.slice(1));
    const db = Number.parseInt(rawPath, 10);

    if (Number.isNaN(db)) {
      options.path = decodeURIComponent(url.pathname);
    } else {
      options.db = db;
    }
  }

  const family = url.searchParams.get('family');
  if (family) {
    const parsedFamily = Number.parseInt(family, 10);
    if (!Number.isNaN(parsedFamily)) {
      options.family = parsedFamily;
    }
  }

  if (url.protocol === 'rediss:') {
    options.tls = {};
  }

  return options;
}

redis.on('error', (err) => {
  // Only log in development to avoid noise in production logs when Redis is optional
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Redis] Connection error:', err.message);
  }
});

if (process.env.NODE_ENV !== 'production') {
  global.__redis = redis;
}
