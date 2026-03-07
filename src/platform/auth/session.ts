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
  userType: string;
  role: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('token')?.value;
    if (!raw) return null;

    const hash    = hashOpaqueToken(raw);
    const session = await sessionRepository.findByTokenHash(hash);
    if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

    const user = await prisma.user.findFirst({
      where: { id: session.userId, deletedAt: null },
      select: { id: true, email: true, firstName: true, lastName: true, userType: true },
    });
    if (!user) return null;

    const userRole = await prisma.userRole
      .findFirst({ where: { userId: session.userId }, include: { role: true } })
      .catch(() => null);
    const role = (userRole as { role?: { name: string } } | null)?.role?.name ?? user.userType ?? 'staff';

    return { ...user, role };
  } catch {
    return null;
  }
}
