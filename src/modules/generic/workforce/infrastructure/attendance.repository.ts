import { prisma } from '@platform/database/prisma';
import type {
  AttendanceShift,
  AttendanceShiftWithUser,
  ClockInInput,
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

export const attendanceRepository = {
  async findActiveShift(organizationId: string, userId: string): Promise<AttendanceShift | null> {
    const row = await prisma.attendanceShift.findFirst({
      where: { organizationId, userId, status: 'active', deletedAt: null },
      orderBy: { clockInAt: 'desc' },
    });
    return row ? mapShift(row as ShiftRow) : null;
  },

  async createShift(organizationId: string, userId: string, input: ClockInInput): Promise<AttendanceShift> {
    const row = await prisma.attendanceShift.create({
      data: {
        organizationId,
        userId,
        clockInAt: new Date(),
        clockInSource: 'portal',
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
        clockOutSource: 'portal',
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
