import { prisma, Prisma } from '@platform/database/prisma';
import type {
  RestaurantStaffMember,
  RestaurantStaffRole,
} from '../domain/restaurant-staff.entity';
import {
  isRestaurantStaffRole,
  RESTAURANT_STAFF_ROLES,
} from '../domain/restaurant-staff.entity';

type StaffRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  employeeCode: string | null;
  isActive: boolean;
  clockPinUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{ role: { name: string } }>;
};

function mapStaffMember(row: StaffRow): RestaurantStaffMember {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    employeeCode: row.employeeCode,
    isActive: row.isActive,
    clockPinUpdatedAt: row.clockPinUpdatedAt?.toISOString() ?? null,
    roles: row.roles.map((userRole) => userRole.role.name).filter(isRestaurantStaffRole),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const staffSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  employeeCode: true,
  isActive: true,
  clockPinUpdatedAt: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    include: {
      role: {
        select: { name: true },
      },
    },
  },
};

async function setRestaurantRoles(
  tx: Prisma.TransactionClient,
  organizationId: string,
  userId: string,
  roles: RestaurantStaffRole[],
  actorId: string,
) {
  await tx.userRole.deleteMany({
    where: {
      userId,
      organizationId,
      role: { name: { in: RESTAURANT_STAFF_ROLES } },
    },
  });

  const roleRows = await tx.role.findMany({
    where: { name: { in: roles } },
    select: { id: true, name: true },
  });

  for (const role of roleRows) {
    await tx.userRole.create({
      data: {
        userId,
        roleId: role.id,
        organizationId,
        grantedBy: actorId,
      },
    });
  }
}

export const restaurantStaffRepository = {
  async list(organizationId: string): Promise<RestaurantStaffMember[]> {
    const rows = await prisma.user.findMany({
      where: {
        organizationId,
        deletedAt: null,
        roles: {
          some: {
            organizationId,
            role: { name: { in: RESTAURANT_STAFF_ROLES } },
          },
        },
      },
      select: staffSelect,
      orderBy: [{ isActive: 'desc' }, { firstName: 'asc' }, { lastName: 'asc' }],
    });
    return rows.map((row) => mapStaffMember(row as StaffRow));
  },

  async findById(organizationId: string, userId: string): Promise<RestaurantStaffMember | null> {
    const row = await prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
      select: staffSelect,
    });
    return row ? mapStaffMember(row as StaffRow) : null;
  },

  async findByEmployeeCode(organizationId: string, employeeCode: string): Promise<{ id: string } | null> {
    return prisma.user.findFirst({
      where: { organizationId, employeeCode, deletedAt: null },
      select: { id: true },
    });
  },

  async create(input: {
    organizationId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string | null;
    employeeCode: string;
    clockPinHash: string;
    roles: RestaurantStaffRole[];
    actorId: string;
  }): Promise<RestaurantStaffMember> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          organizationId: input.organizationId,
          email: input.email,
          passwordHash: input.passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          userType: 'staff',
          emailVerified: Boolean(input.email),
          employeeCode: input.employeeCode,
          clockPinHash: input.clockPinHash,
          clockPinUpdatedAt: new Date(),
        },
        select: { id: true },
      });

      await setRestaurantRoles(tx, input.organizationId, user.id, input.roles, input.actorId);

      const row = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
        select: staffSelect,
      });
      return mapStaffMember(row as StaffRow);
    });
  },

  async update(
    organizationId: string,
    userId: string,
    actorId: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string | null;
      employeeCode?: string;
      roles?: RestaurantStaffRole[];
      isActive?: boolean;
    },
  ): Promise<RestaurantStaffMember | null> {
    const existing = await prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    return prisma.$transaction(async (tx) => {
      if (data.roles) {
        await setRestaurantRoles(tx, organizationId, userId, data.roles, actorId);
      }

      const row = await tx.user.update({
        where: { id: userId },
        data: {
          ...(data.email !== undefined ? { email: data.email } : {}),
          ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
          ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
          ...(data.employeeCode !== undefined ? { employeeCode: data.employeeCode } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
        select: staffSelect,
      });
      return mapStaffMember(row as StaffRow);
    });
  },

  async setPinHash(
    organizationId: string,
    userId: string,
    clockPinHash: string,
  ): Promise<RestaurantStaffMember | null> {
    const existing = await prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.user.update({
      where: { id: userId },
      data: {
        clockPinHash,
        clockPinUpdatedAt: new Date(),
      },
      select: staffSelect,
    });
    return mapStaffMember(row as StaffRow);
  },

  async deactivate(organizationId: string, userId: string): Promise<boolean> {
    const result = await prisma.user.updateMany({
      where: { id: userId, organizationId, deletedAt: null },
      data: { isActive: false },
    });
    return result.count === 1;
  },
};
