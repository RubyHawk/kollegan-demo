import { prisma } from '@platform/database/prisma';
import type {
  AttendanceShift,
  AttendanceShiftWithUser,
  ClockInInput,
  ClockableStaffMember,
  ClockOutInput,
  CorrectAttendanceShiftInput,
} from '../domain/attendance.entity';

type ShiftRow = {
  id: string;
  organizationId: string;
  userId: string;
  clockInAt: Date;
  clockOutAt: Date | null;
  status: string;
  clockInSource: string | null;
  clockOutSource: string | null;
  deviceLabel: string | null;
  location: string | null;
  correctedBy: string | null;
  correctionReason: string | null;
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

type ClockableStaffRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  employeeCode: string | null;
  clockPinUpdatedAt: Date | null;
  attendanceShifts: ShiftRow[];
};

const RESTAURANT_CLOCKABLE_ROLES = [
  'restaurant_owner',
  'restaurant_manager',
  'restaurant_staff',
  'restaurant_kitchen',
  'restaurant_accountant',
];

function mapShift(row: ShiftRow): AttendanceShift {
  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    clockInAt: row.clockInAt.toISOString(),
    clockOutAt: row.clockOutAt?.toISOString() ?? null,
    status: row.status as AttendanceShift['status'],
    clockInSource: row.clockInSource,
    clockOutSource: row.clockOutSource,
    deviceLabel: row.deviceLabel,
    location: row.location,
    correctedBy: row.correctedBy,
    correctionReason: row.correctionReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapShiftWithUser(row: ShiftWithUserRow): AttendanceShiftWithUser {
  return {
    ...mapShift(row),
    user: row.user,
  };
}

function mapClockableStaff(row: ClockableStaffRow): ClockableStaffMember {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    employeeCode: row.employeeCode,
    clockPinUpdatedAt: row.clockPinUpdatedAt?.toISOString() ?? null,
    activeShift: row.attendanceShifts[0] ? mapShift(row.attendanceShifts[0]) : null,
  };
}

export const attendanceRepository = {
  async findActiveShift(organizationId: string, userId: string): Promise<AttendanceShift | null> {
    const row = await prisma.attendanceShift.findFirst({
      where: { organizationId, userId, status: 'active', deletedAt: null },
      orderBy: { clockInAt: 'desc' },
    });
    return row ? mapShift(row as ShiftRow) : null;
  },

  async listClockableStaff(organizationId: string): Promise<ClockableStaffMember[]> {
    const rows = await prisma.user.findMany({
      where: {
        organizationId,
        isActive: true,
        deletedAt: null,
        roles: {
          some: {
            organizationId,
            role: { name: { in: RESTAURANT_CLOCKABLE_ROLES } },
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        clockPinUpdatedAt: true,
        attendanceShifts: {
          where: { organizationId, status: 'active', deletedAt: null },
          orderBy: { clockInAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { email: 'asc' }],
    });
    return rows.map((row) => mapClockableStaff(row as ClockableStaffRow));
  },

  async findClockPinState(organizationId: string, userId: string): Promise<{
    id: string;
    clockPinHash: string | null;
    isActive: boolean;
  } | null> {
    return prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        deletedAt: null,
        roles: {
          some: {
            organizationId,
            role: { name: { in: RESTAURANT_CLOCKABLE_ROLES } },
          },
        },
      },
      select: {
        id: true,
        clockPinHash: true,
        isActive: true,
      },
    });
  },

  async createShift(organizationId: string, userId: string, input: ClockInInput): Promise<AttendanceShift> {
    const row = await prisma.attendanceShift.create({
      data: {
        organizationId,
        userId,
        clockInAt: new Date(),
        clockInSource: input.source ?? 'portal',
        deviceLabel: input.deviceLabel ?? null,
        location: input.location ?? null,
      },
    });
    return mapShift(row as ShiftRow);
  },

  async completeActiveShift(organizationId: string, userId: string, input: ClockOutInput): Promise<AttendanceShift | null> {
    const active = await prisma.attendanceShift.findFirst({
      where: { organizationId, userId, status: 'active', deletedAt: null },
      select: { id: true },
      orderBy: { clockInAt: 'desc' },
    });
    if (!active) return null;

    const row = await prisma.attendanceShift.update({
      where: { id: active.id },
      data: {
        clockOutAt: new Date(),
        status: 'completed',
        clockOutSource: input.source ?? 'portal',
        deviceLabel: input.deviceLabel ?? undefined,
        location: input.location ?? undefined,
      },
    });
    return mapShift(row as ShiftRow);
  },

  async listShiftsInRange(organizationId: string, from: Date, to: Date): Promise<AttendanceShiftWithUser[]> {
    const rows = await prisma.attendanceShift.findMany({
      where: {
        organizationId,
        deletedAt: null,
        clockInAt: { gte: from, lt: to },
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { clockInAt: 'asc' },
    });
    return rows.map((row) => mapShiftWithUser(row as ShiftWithUserRow));
  },

  async correctShift(
    organizationId: string,
    id: string,
    actorId: string,
    input: CorrectAttendanceShiftInput,
  ): Promise<AttendanceShift | null> {
    const existing = await prisma.attendanceShift.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.attendanceShift.update({
      where: { id },
      data: {
        ...(input.clockInAt !== undefined ? { clockInAt: new Date(input.clockInAt) } : {}),
        ...(input.clockOutAt !== undefined ? { clockOutAt: input.clockOutAt ? new Date(input.clockOutAt) : null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        correctedBy: actorId,
        correctionReason: input.correctionReason,
      },
    });
    return mapShift(row as ShiftRow);
  },
};
