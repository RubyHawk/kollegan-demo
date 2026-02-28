// ─── Session entity ───────────────────────────────────────────────────────────

export interface Session {
  id: string;
  userId: string;
  refreshTokenJti: string;
  userAgent: string | null;
  ipAddress: string | null;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CreateSessionInput {
  userId: string;
  refreshTokenJti: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}
