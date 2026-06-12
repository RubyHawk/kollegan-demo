import { Errors } from '@platform/api/errors';
import { logger } from '@platform/logging/logger';
import { organizationHasModule } from '@modules/supporting/identity';
import { scheduleRepository } from '../infrastructure/schedule.repository';
import type {
  CreateScheduleShiftInput,
  ListScheduleShiftsInput,
  UpdateScheduleShiftInput,
} from '../domain/schedule.entity';

const TAG = 'ScheduleService';
const MAX_RANGE_DAYS = 62;

async function requireScheduleModule(organizationId: string) {
  const enabled = await organizationHasModule(organizationId, 'staff_schedule');
  if (!enabled) throw Errors.forbidden('Staff schedule module is not enabled for this organization');
}

function assertValidTimeRange(startsAt: string, endsAt: string) {
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw Errors.validation('Shift end must be after shift start');
  }
}

export async function listScheduleShifts(organizationId: string, input: ListScheduleShiftsInput) {
  await requireScheduleModule(organizationId);
  const rangeMs = new Date(input.to).getTime() - new Date(input.from).getTime();
  if (rangeMs <= 0) throw Errors.validation('Range end must be after range start');
  if (rangeMs > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
    throw Errors.validation(`Range must not exceed ${MAX_RANGE_DAYS} days`);
  }
  return scheduleRepository.listShiftsInRange(organizationId, input);
}

export async function createScheduleShift(
  organizationId: string,
  actorId: string,
  input: CreateScheduleShiftInput,
) {
  await requireScheduleModule(organizationId);
  assertValidTimeRange(input.startsAt, input.endsAt);

  const memberOk = await scheduleRepository.memberExistsInOrg(organizationId, input.userId);
  if (!memberOk) throw Errors.validation('User does not belong to this organization');

  const shift = await scheduleRepository.createShift(organizationId, actorId, input);
  logger.info(TAG, 'Schedule shift created', { organizationId, actorId, shiftId: shift.id });
  return shift;
}

export async function updateScheduleShift(
  organizationId: string,
  id: string,
  actorId: string,
  input: UpdateScheduleShiftInput,
) {
  await requireScheduleModule(organizationId);

  if (input.startsAt !== undefined || input.endsAt !== undefined) {
    const existing = await scheduleRepository.findShift(organizationId, id);
    if (!existing) throw Errors.notFound('Schedule shift not found');
    assertValidTimeRange(input.startsAt ?? existing.startsAt, input.endsAt ?? existing.endsAt);
  }

  const shift = await scheduleRepository.updateShift(organizationId, id, input);
  if (!shift) throw Errors.notFound('Schedule shift not found');

  logger.info(TAG, 'Schedule shift updated', { organizationId, actorId, shiftId: id });
  return shift;
}

export async function listScheduleMembers(organizationId: string) {
  await requireScheduleModule(organizationId);
  return scheduleRepository.listActiveMembers(organizationId);
}
