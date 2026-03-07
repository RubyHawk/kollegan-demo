/**
 * GET /api/admin/access-review
 *
 * Returns user access data for the quarterly access review.
 * Includes: user identity, roles, last login, MFA status, active session count.
 *
 * Query params:
 *   orgId   — filter to a specific organization (optional; super_admin sees all)
 *
 * Requires: JWT auth + requireMfa + role in [super_admin, admin].
 * SOC 2 CC6.3 — periodic access review evidence.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { prisma } from '@platform/database/prisma';
import { verifyToken } from '@platform/auth/jwt';

const QuerySchema = z.object({
  orgId: z.string().optional(),
});

export const GET = createHandler(
  { auth: 'jwt', tag: 'Admin:AccessReview', requireMfa: true, query: QuerySchema, rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: { orgId?: string }; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value
      ?? '';
    const payload = await verifyToken(token);

    const isAdmin = payload.roles.includes('super_admin') || payload.roles.includes('admin');
    if (!isAdmin) throw Errors.forbidden('Access review requires admin role');

    const orgFilter: string | null =
      payload.roles.includes('super_admin')
        ? (query.orgId ?? null)
        : payload.orgId;

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(orgFilter ? { organizationId: orgFilter } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isActive: true,
        lastLoginAt: true,
        mfaEnabled: true,
        totpSecret: true,
        mfaGraceExpiresAt: true,
        organizationId: true,
        createdAt: true,
        roles: { include: { role: true } },
        sessions: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          select: { id: true },
        },
        _count: { select: { webAuthnCredentials: true } },
      },
      orderBy: [{ organizationId: 'asc' }, { email: 'asc' }],
    });

    const rows = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || null,
      userType: u.userType,
      isActive: u.isActive,
      organizationId: u.organizationId,
      roles: u.roles.map((r: { role: { name: string } }) => r.role.name),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      mfaEnabled: u.mfaEnabled,
      totpConfigured: !!u.totpSecret,
      passkeysRegistered: u._count.webAuthnCredentials,
      mfaGraceExpiresAt: u.mfaGraceExpiresAt?.toISOString() ?? null,
      activeSessions: u.sessions.length,
      createdAt: u.createdAt.toISOString(),
    }));

    return ok({
      generatedAt: new Date().toISOString(),
      totalUsers: rows.length,
      users: rows,
    });
  }
);
