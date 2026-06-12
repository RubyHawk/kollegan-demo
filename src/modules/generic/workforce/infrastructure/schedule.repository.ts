import { prisma } from '@platform/database/prisma';
import type {
  CreateScheduleShiftInput,
  ListScheduleShiftsInput,
  ScheduleMember,
  StaffScheduleShift,
  StaffScheduleShiftWithUser,
  UpdateScheduleShiftInput,
} from '../domain/schedule.entity';

type ShiftRow = {
  id: string;
  organizationId: string;
  userId: string;
  startsAt: Date;
  endsAt: Date;
  roleLabel: string | null;
  notes: string | null;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ShiftWithUserRow = ShiftRow & {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

const userSelect = { id: true, email: true, firstName: true, lastName: true } as const;

function mapShift(row: ShiftRow): StaffScheduleShift {
  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    roleLabel: row.roleLabel,
    notes: row.notes,
    status: row.status as StaffScheduleShift['status'],
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapShiftWithUser(row: ShiftWithUserRow): StaffScheduleShiftWithUser {
  return { ...mapShift(row), user: row.user };
}

export const scheduleRepository = {
  async listShiftsInRange(
    organizationId: string,
    input: ListScheduleShiftsInput,
  ): Promise<StaffScheduleShiftWithUser[]> {
    const rows = await prisma.staffScheduleShift.findMany({
      where: {
        organizationId,
        deletedAt: null,
        startsAt: { gte: new Date(input.from), lt: new Date(input.to) },
      },
      include: { user: { select: userSelect } },
      orderBy: [{ startsAt: 'asc' }, { createdAt: 'asc' }],
      take: 500,
    });
    return rows.map((row) => mapShiftWithUser(row as ShiftWithUserRow));
  },

  async createShift(
    organizationId: string,
    createdBy: string,
    input: CreateScheduleShiftInput,
  ): Promise<StaffScheduleShiftWithUser> {
    const row = await prisma.staffScheduleShift.create({
      data: {
        organizationId,
        userId: input.userId,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        roleLabel: input.roleLabel ?? null,
        notes: input.notes ?? null,
        createdBy,
      },
      include: { user: { select: userSelect } },
    });
    return mapShiftWithUser(row as ShiftWithUserRow);
  },

  async findShift(organizationId: string, id: string): Promise<StaffScheduleShift | null> {
    const row = await prisma.staffScheduleShift.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return row ? mapShift(row as ShiftRow) : null;
  },

  async updateShift(
    organizationId: string,
    id: string,
    input: UpdateScheduleShiftInput,
  ): Promise<StaffScheduleShiftWithUser | null> {
    const existing = await prisma.staffScheduleShift.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.staffScheduleShift.update({
      where: { id },
      data: {
        ...(input.startsAt !== undefined ? { startsAt: new Date(input.startsAt) } : {}),
        ...(input.endsAt !== undefined ? { endsAt: new Date(input.endsAt) } : {}),
        ...(input.roleLabel !== undefined ? { roleLabel: input.roleLabel } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: { user: { select: userSelect } },
    });
    return mapShiftWithUser(row as ShiftWithUserRow);
  },

  async memberExistsInOrg(organizationId: string, userId: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId, isActive: true },
      select: { id: true },
    });
    return !!user;
  },

  async listActiveMembers(organizationId: string): Promise<ScheduleMember[]> {
    return prisma.user.findMany({
      where: { organizationId, isActive: true },
      select: userSelect,
      orderBy: [{ firstName: 'asc' }, { email: 'asc' }],
      take: 200,
    });
  },
};
