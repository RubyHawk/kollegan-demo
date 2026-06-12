import { Errors } from '@platform/api/errors';
import { logger } from '@platform/logging/logger';
import { organizationHasModule } from '@modules/supporting/identity';
import { attendanceRepository } from '../infrastructure/attendance.repository';
import type {
  ClockInInput,
  ClockOutInput,
  CorrectAttendanceShiftInput,
} from '../domain/attendance.entity';

const TAG = 'AttendanceService';

async function requireClockInModule(organizationId: string) {
  const enabled = await organizationHasModule(organizationId, 'clock_in');
  if (!enabled) throw Errors.forbidden('Clock-in module is not enabled for this organization');
}

const ATTENDANCE_TIME_ZONE = 'Europe/Stockholm';

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return asUtc - date.getTime();
}

function zonedMidnightToUtc(year: number, month: number, day: number): Date {
  // Guess midnight UTC, then correct by the zone offset at that instant.
  // The second pass settles dates where the offset changes across the guess (DST edges).
  let utc = Date.UTC(year, month - 1, day);
  for (let pass = 0; pass < 2; pass++) {
    utc = Date.UTC(year, month - 1, day) - timeZoneOffsetMs(new Date(utc), ATTENDANCE_TIME_ZONE);
  }
  return new Date(utc);
}

export function localDayBounds(now = new Date()): { from: Date; to: Date } {
  const localDate = now.toLocaleDateString('sv-SE', { timeZone: ATTENDANCE_TIME_ZONE });
  const [year, month, day] = localDate.split('-').map(Number);
  return {
    from: zonedMidnightToUtc(year, month, day),
    to: zonedMidnightToUtc(year, month, day + 1),
  };
}

export async function getCurrentAttendanceShift(organizationId: string, userId: string) {
  await requireClockInModule(organizationId);
  return attendanceRepository.findActiveShift(organizationId, userId);
}

export async function clockIn(organizationId: string, userId: string, input: ClockInInput) {
  await requireClockInModule(organizationId);
  const active = await attendanceRepository.findActiveShift(organizationId, userId);
  if (active) throw Errors.conflict('You already have an active shift');

  const shift = await attendanceRepository.createShift(organizationId, userId, input);
  logger.info(TAG, 'Clock-in recorded', { organizationId, userId, shiftId: shift.id });
  return shift;
}

export async function clockOut(organizationId: string, userId: string, input: ClockOutInput) {
  await requireClockInModule(organizationId);
  const shift = await attendanceRepository.completeActiveShift(organizationId, userId, input);
  if (!shift) throw Errors.conflict('No active shift to clock out from');

  logger.info(TAG, 'Clock-out recorded', { organizationId, userId, shiftId: shift.id });
  return shift;
}

export async function listTodayAttendance(organizationId: string) {
  await requireClockInModule(organizationId);
  const { from, to } = localDayBounds();
  return attendanceRepository.listShiftsInRange(organizationId, from, to);
}

export async function correctAttendanceShift(
  organizationId: string,
  id: string,
  actorId: string,
  input: CorrectAttendanceShiftInput,
) {
  await requireClockInModule(organizationId);
  const corrected = await attendanceRepository.correctShift(organizationId, id, actorId, input);
  if (!corrected) throw Errors.notFound('Attendance shift not found');

  logger.info(TAG, 'Attendance shift corrected', { organizationId, actorId, shiftId: id });
  return corrected;
}
