import { prisma } from '@platform/database/prisma';

export interface CreateCompanyMemberUserInput {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  mfaGraceExpiresAt: Date;
}

export interface CompanyMemberUserRecord {
  id: string;
  email: string;
  deletedAt: Date | null;
}

export const companyMemberAccountsRepository = {
  async findUserByEmailInsensitive(email: string): Promise<CompanyMemberUserRecord | null> {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        deletedAt: true,
      },
    });

    return user;
  },

  async createUser(input: CreateCompanyMemberUserInput): Promise<{ id: string; email: string }> {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        userType: 'staff',
        organizationId: input.organizationId,
        mfaGraceExpiresAt: input.mfaGraceExpiresAt,
      },
      select: {
        id: true,
        email: true,
      },
    });

    return user;
  },

  async findRoleByName(name: string): Promise<{ id: string; name: string } | null> {
    return prisma.role.findUnique({
      where: { name },
      select: { id: true, name: true },
    });
  },

  async assignRole(
    userId: string,
    roleId: string,
    organizationId: string,
    grantedBy?: string,
  ): Promise<void> {
    await prisma.userRole.upsert({
      where: {
        userId_roleId_organizationId: {
          userId,
          roleId,
          organizationId,
        },
      },
      create: {
        userId,
        roleId,
        organizationId,
        grantedBy: grantedBy ?? null,
      },
      update: {
        grantedBy: grantedBy ?? null,
      },
    });
  },
};
