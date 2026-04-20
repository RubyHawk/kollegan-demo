import { prisma } from '@platform/database/prisma';
import type { LegacyStaffUser } from '../domain/staff-user.entity';

const staffUserSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  lastLogin: true,
} as const;

export const staffUsersRepository = {
  async list(): Promise<LegacyStaffUser[]> {
    return prisma.staffUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: staffUserSelect,
    });
  },

  async findByEmail(email: string): Promise<{ id: string } | null> {
    return prisma.staffUser.findUnique({
      where: { email },
      select: { id: true },
    });
  },

  async create(input: { email: string; passwordHash: string; role: string }): Promise<Omit<LegacyStaffUser, 'lastLogin'>> {
    return prisma.staffUser.create({
      data: input,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.staffUser.delete({ where: { id } });
  },
};
