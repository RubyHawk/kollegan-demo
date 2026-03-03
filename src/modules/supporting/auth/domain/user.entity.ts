// ─── User entity ──────────────────────────────────────────────────────────────
// Pure domain type — no Prisma, no HTTP.

export type UserType = 'staff' | 'customer';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  userType: UserType;
  isActive: boolean;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  // Phase 2: MFA
  mfaEnabled: boolean;
  totpSecret: string | null;
  backupCodes: string[];         // bcrypt-hashed one-time codes
  mfaGraceExpiresAt: Date | null; // null = enforce immediately; non-null = deadline
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  userType: UserType;
  organizationId: string | null;
  mfaGraceExpiresAt?: Date | null;
}
