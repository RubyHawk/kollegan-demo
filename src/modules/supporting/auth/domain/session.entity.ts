// ─── Session entity ───────────────────────────────────────────────────────────

export type MfaMethod = 'totp' | 'webauthn';

export interface Session {
  id: string;
  userId: string;
  refreshTokenHash: string; // SHA-256 of the raw opaque token stored in the cookie
  userAgent: string | null;
  ipAddress: string | null;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  mfaVerifiedAt: Date | null; // null = MFA not completed in this session
  mfaMethod: MfaMethod | null; // which MFA method was used ('totp' | 'webauthn')
}

export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  mfaVerifiedAt?: Date;
  mfaMethod?: MfaMethod;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  userType: string;
  role: string;
  mfaEnabled: boolean;
}
