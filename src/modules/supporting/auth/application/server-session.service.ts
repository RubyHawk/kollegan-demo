import { cookies } from 'next/headers';
import { hashOpaqueToken, verifyToken } from '@platform/auth/jwt';
import { sessionRepository } from '../infrastructure/session.repository';
import type { SessionUser } from '../domain/session.entity';

const ROLE_PRIORITY = [
  'super_admin',
  'admin',
  'helpdesk',
  'user',
  'viewer',
  'customer_admin',
  'customer_viewer',
  'restaurant_owner',
  'restaurant_manager',
  'restaurant_staff',
  'restaurant_kitchen',
  'restaurant_accountant',
] as const;

function pickPrimaryRole(roles: string[], fallback: string): string {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return roles[0] ?? fallback;
}

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
        const roles = payload.roles ?? [];

        return {
          id: payload.sub,
          email: '',  // sub is User.id (UUID), not email; profile fetch fills this
          firstName: null,
          lastName: null,
          avatarUrl: null,
          userType: payload.userType ?? 'staff',
          orgId: payload.orgId ?? null,
          role: pickPrimaryRole(roles, payload.userType ?? 'staff'),
          roles,
          mfaEnabled: false,
          mfaAuthenticated: (payload.amr ?? []).includes('otp') || (payload.amr ?? []).includes('hwk'),
        };
      }

    return null;
  } catch {
    return null;
  }
}
