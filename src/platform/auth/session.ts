/**
 * Server-side session helper.
 * Reads the opaque refresh token from the httpOnly cookie, hashes it,
 * and looks up the session + user in the DB.
 * Returns null if the token is missing, invalid, revoked, or expired.
 */
import { cookies } from 'next/headers';
import { hashOpaqueToken } from '@platform/auth/jwt';
import { sessionRepository } from '@modules/supporting/auth/infrastructure/session.repository';
import { prisma } from '@platform/database/prisma';

export interface SessionUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  userType: string;
  role: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();

    // Primary: opaque refresh token → DB session lookup
    const raw = cookieStore.get('token')?.value;
    if (raw) {
      const hash    = hashOpaqueToken(raw);
      const session = await sessionRepository.findByTokenHash(hash);
      if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

      const user = await prisma.user.findFirst({
        where: { id: session.userId, deletedAt: null },
        select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, userType: true },
      });
      if (!user) return null;

      const userRole = await prisma.userRole
        .findFirst({ where: { userId: session.userId }, include: { role: true } })
        .catch(() => null);
      const role = (userRole as { role?: { name: string } } | null)?.role?.name ?? user.userType ?? 'staff';

      return { ...user, role };
    }

    // Fallback: JWT access token in 'at' cookie (used by dev-login and API-only clients).
    // Skips the DB lookup — identity is derived directly from verified JWT claims.
    const accessToken = cookieStore.get('at')?.value;
    if (accessToken) {
      const { verifyToken } = await import('@platform/auth/jwt');
      const payload = await verifyToken(accessToken).catch(() => null);
      if (!payload) return null;
      return {
        id:        payload.sub,
        email:     payload.sub,
        firstName: null,
        lastName:  null,
        avatarUrl: null,
        userType:  payload.userType ?? 'staff',
        role:      payload.roles?.[0] ?? 'staff',
      };
    }

    return null;
  } catch {
    return null;
  }
}
