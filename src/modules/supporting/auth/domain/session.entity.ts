// ─── Session entity ───────────────────────────────────────────────────────────

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
}

export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  mfaVerifiedAt?: Date;
}
