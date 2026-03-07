/**
 * RBAC service — permission checking with Redis caching.
 *
 * Permission format: 'resource.action' (e.g. 'leads.write', 'portal.provision')
 * 'super_admin' role has wildcard access — any permission check returns true.
 *
 * Cache: Redis key `perms:{roleNames.join(',')}` — 5-minute TTL.
 * Invalidated on any RolePermission change (call invalidatePermissionCache()).
 */

import { prisma } from '@platform/database/prisma';
import { logger } from '@platform/logging/logger';

const TAG = 'RbacService';
const CACHE_TTL_SEC = 300; // 5 minutes

// ─── Permission lookup ─────────────────────────────────────────────────────────

async function fetchPermissionsFromDb(roleNames: string[]): Promise<Set<string>> {
  if (roleNames.includes('super_admin')) {
    return new Set(['*.*']); // wildcard
  }

  const userRoles = await prisma.role.findMany({
    where: { name: { in: roleNames } },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  const perms = new Set<string>();
  for (const role of userRoles) {
    for (const rp of role.permissions) {
      perms.add(`${rp.permission.resource}.${rp.permission.action}`);
    }
  }
  return perms;
}

async function getPermissions(roleNames: string[]): Promise<Set<string>> {
  const cacheKey = `perms:${roleNames.slice().sort().join(',')}`;

  try {
    const { redis } = await import('@platform/cache/redis');
    const cached = await redis.get(cacheKey);
    if (cached) {
      return new Set(JSON.parse(cached) as string[]);
    }

    const perms = await fetchPermissionsFromDb(roleNames);
    await redis.setex(cacheKey, CACHE_TTL_SEC, JSON.stringify([...perms]));
    return perms;
  } catch {
    // Redis unavailable — fall through to DB query
    return fetchPermissionsFromDb(roleNames);
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Check if the given roles have the requested permission.
 * Supports wildcard roles (super_admin).
 */
export async function hasPermission(
  roleNames: string[],
  permission: string
): Promise<boolean> {
  const perms = await getPermissions(roleNames);
  return perms.has('*.*') || perms.has(permission);
}

/**
 * Invalidate the permission cache for given role names.
 * Call after any RolePermission create/delete.
 */
export async function invalidatePermissionCache(roleNames: string[]): Promise<void> {
  const cacheKey = `perms:${roleNames.slice().sort().join(',')}`;
  try {
    const { redis } = await import('@platform/cache/redis');
    await redis.del(cacheKey);
  } catch {
    logger.warn(TAG, 'Failed to invalidate permission cache', { roleNames });
  }
}
