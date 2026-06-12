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

function localDayBounds(now = new Date()): { from: Date; to: Date } {
  const localDate = now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' });
  const [year, month, day] = localDate.split('-').map(Number);
  const from = new Date(Date.UTC(year, month - 1, day, -2, 0, 0));
  const to = new Date(Date.UTC(year, month - 1, day + 1, -2, 0, 0));
  return { from, to };
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
