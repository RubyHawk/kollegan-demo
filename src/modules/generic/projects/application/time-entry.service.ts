/**
 * Time Entry service — use cases.
 *
 * Orchestrates the time-entry repository and enforces domain rules:
 *  - `hours` must be > 0 and <= 24 (a single calendar day);
 *  - `date` is required on create;
 *  - `billable` defaults to true;
 *  - on create the acting user logs their own time (`userId` = actor);
 *  - edit/delete are allowed only when the entry belongs to the actor OR the
 *    actor is an admin — surfaced as a forbidden error for the handler to map
 *    to 403; a missing entry resolves to null so the handler maps it to 404.
 *
 * No Prisma here — persistence lives in the infrastructure repository.
 */

import { logger } from '@platform/logging/logger';
import type {
  EditTimeEntryPatch,
  ListTimeEntriesFilter,
  LogTimeEntryInput,
  TimeEntry,
} from '../domain/time-entry.entity';
import { timeEntryRepository } from '../infrastructure/time-entry.repository';

/** Recoverable domain error. `kind` lets the handler pick 400 (validation) vs 403 (forbidden). */
export class TimeEntryDomainError extends Error {
  readonly kind: 'validation' | 'forbidden';

  constructor(kind: 'validation' | 'forbidden', message: string) {
    super(message);
    this.name = 'TimeEntryDomainError';
    this.kind = kind;
  }
}

const TAG = 'TimeEntryService';
const MAX_HOURS_PER_DAY = 24;

function assertHours(hours: number): void {
  if (!Number.isFinite(hours) || hours <= 0 || hours > MAX_HOURS_PER_DAY) {
    throw new TimeEntryDomainError('validation', 'hours must be greater than 0 and at most 24');
  }
}

function assertDate(date: string | undefined): asserts date is string {
  if (!date) {
    throw new TimeEntryDomainError('validation', 'date is required');
  }
}

/** Owner of the row, or an admin, may mutate it. */
function assertCanMutate(entry: TimeEntry, actorId: string, isAdmin: boolean): void {
  if (entry.userId !== actorId && !isAdmin) {
    throw new TimeEntryDomainError('forbidden', 'You can only modify your own time entries');
  }
}

export async function listTimeEntries(
  orgId: string,
  filter: ListTimeEntriesFilter,
): Promise<TimeEntry[]> {
  return timeEntryRepository.list(orgId, filter);
}

export async function logTimeEntry(
  orgId: string,
  actorId: string,
  input: LogTimeEntryInput,
): Promise<TimeEntry> {
  assertDate(input.date);
  assertHours(input.hours);

  const created = await timeEntryRepository.create({
    organizationId: orgId,
    projectId: input.projectId ?? null,
    userId: actorId,
    date: input.date,
    hours: input.hours,
    description: input.description ?? null,
    billable: input.billable ?? true,
  });
  logger.info(TAG, `Time entry logged: ${created.hours}h on ${created.date}`, { id: created.id });
  return created;
}

export async function editTimeEntry(
  orgId: string,
  id: string,
  actorId: string,
  isAdmin: boolean,
  patch: EditTimeEntryPatch,
): Promise<TimeEntry | null> {
  const existing = await timeEntryRepository.findById(id, orgId);
  if (!existing) return null;
  assertCanMutate(existing, actorId, isAdmin);

  if (patch.date !== undefined) assertDate(patch.date);
  if (patch.hours !== undefined) assertHours(patch.hours);

  const updated = await timeEntryRepository.update(id, orgId, {
    ...(patch.projectId !== undefined ? { projectId: patch.projectId } : {}),
    ...(patch.date !== undefined ? { date: patch.date } : {}),
    ...(patch.hours !== undefined ? { hours: patch.hours } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.billable !== undefined ? { billable: patch.billable } : {}),
  });
  if (updated) logger.info(TAG, `Time entry updated: ${id}`);
  return updated;
}

export async function removeTimeEntry(
  orgId: string,
  id: string,
  actorId: string,
  isAdmin: boolean,
): Promise<boolean | null> {
  const existing = await timeEntryRepository.findById(id, orgId);
  if (!existing) return null;
  assertCanMutate(existing, actorId, isAdmin);

  const deleted = await timeEntryRepository.softDelete(id, orgId);
  if (deleted) logger.info(TAG, `Time entry deleted: ${id}`);
  return deleted;
}
