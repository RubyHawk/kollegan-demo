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
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  userType: UserType;
  organizationId: string | null;
}
