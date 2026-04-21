import { cookies } from 'next/headers';
import { hashOpaqueToken, verifyToken } from '@platform/auth/jwt';
import { sessionRepository } from '../infrastructure/session.repository';
import type { SessionUser } from '../domain/session.entity';

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();

    const raw = cookieStore.get('token')?.value;
    if (raw) {
      const hash = hashOpaqueToken(raw);
      return sessionRepository.findSessionUserByTokenHash(hash);
    }

    const accessToken = cookieStore.get('at')?.value;
    if (accessToken) {
      const payload = await verifyToken(accessToken).catch(() => null);
      if (!payload) return null;

      return {
        id: payload.sub,
        email: payload.sub,
        firstName: null,
        lastName: null,
        avatarUrl: null,
        userType: payload.userType ?? 'staff',
        role: payload.roles?.[0] ?? 'staff',
        mfaEnabled: false,
      };
    }

    return null;
  } catch {
    return null;
  }
}
