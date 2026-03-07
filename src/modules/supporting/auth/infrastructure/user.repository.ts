// ─── User repository ──────────────────────────────────────────────────────────
// All User / Role / Permission DB queries. No business logic here.

import { prisma } from '@platform/database/prisma';
import type { User, CreateUserInput } from '../domain/user.entity';

function mapUser(raw: {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  userType: string;
  isActive: boolean;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  mfaEnabled: boolean;
  totpSecret: string | null;
  backupCodes: string[];
  mfaGraceExpiresAt: Date | null;
}): User {
  return {
    ...raw,
    userType: raw.userType as 'staff' | 'customer',
  };
}

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const raw = await prisma.user.findUnique({ where: { id } });
    return raw ? mapUser(raw) : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const raw = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    return raw ? mapUser(raw) : null;
  },

  async create(input: CreateUserInput): Promise<User> {
    const raw = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        userType: input.userType,
        organizationId: input.organizationId,
        mfaGraceExpiresAt: input.mfaGraceExpiresAt ?? null,
      },
    });
    return mapUser(raw);
  },

  async updateLastLogin(id: string, ip: string | null): Promise<void> {
    // Mask last IP octet for GDPR compliance (192.168.1.123 → 192.168.1.0)
    const maskedIp = ip ? ip.replace(/\.\d+$/, '.0') : null;
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date(), lastLoginIp: maskedIp },
    });
  },

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { passwordHash } });
  },

  async markEmailVerified(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });
  },

  /** Returns the role names for a user in a given org. */
  async getUserRoles(userId: string, organizationId: string): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId, organizationId },
      include: { role: true },
    });
    return userRoles.map((ur: { role: { name: string } }) => ur.role.name);
  },

  /** Assign a role to a user for a given org. */
  async assignRole(
    userId: string,
    roleId: string,
    organizationId: string,
    grantedBy?: string
  ): Promise<void> {
    await prisma.userRole.upsert({
      where: { userId_roleId_organizationId: { userId, roleId, organizationId } },
      create: { userId, roleId, organizationId, grantedBy: grantedBy ?? null },
      update: { grantedBy: grantedBy ?? null },
    });
  },

  async findRoleByName(name: string): Promise<{ id: string; name: string } | null> {
    return prisma.role.findUnique({ where: { name } });
  },

  /** Returns a user with MFA grace period info — used by the login enforcement check. */
  async findMfaState(id: string): Promise<{
    mfaEnabled: boolean;
    mfaGraceExpiresAt: Date | null;
  } | null> {
    return prisma.user.findUnique({
      where: { id },
      select: { mfaEnabled: true, mfaGraceExpiresAt: true },
    });
  },
};
