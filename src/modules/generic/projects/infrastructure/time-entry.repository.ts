/**
 * Time Entry repository — Prisma CRUD.
 *
 * All queries are org-scoped and soft-delete-aware (deletedAt IS NULL). Rows are
 * mapped to the domain entity with timestamps serialised to ISO strings and the
 * `@db.Date` column serialised to a 'YYYY-MM-DD' calendar date. Prisma is allowed
 * only in this layer.
 */

import { Prisma, prisma } from '@platform/database/prisma';
import type {
  ListTimeEntriesFilter,
  TimeEntry,
} from '../domain/time-entry.entity';

export interface CreateTimeEntryInput {
  organizationId: string;
  projectId?: string | null;
  userId: string;
  /** Calendar date as 'YYYY-MM-DD'. */
  date: string;
  hours: number;
  description?: string | null;
  billable?: boolean;
}

export interface UpdateTimeEntryInput {
  projectId?: string | null;
  /** Calendar date as 'YYYY-MM-DD'. */
  date?: string;
  hours?: number;
  description?: string | null;
  billable?: boolean;
}

type TimeEntryRow = {
  id: string;
  organizationId: string;
  projectId: string | null;
  userId: string;
  date: Date;
  hours: number;
  description: string | null;
  billable: boolean;
  invoiceId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const TIME_ENTRY_SELECT = {
  id: true,
  organizationId: true,
  projectId: true,
  userId: true,
  date: true,
  hours: true,
  description: true,
  billable: true,
  invoiceId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TimeEntrySelect;

/** A `@db.Date` column round-trips as UTC midnight; render it as a calendar date. */
function toCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Parse a 'YYYY-MM-DD' calendar date into the UTC-midnight Date a `@db.Date` column expects. */
function fromCalendarDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function mapTimeEntry(row: TimeEntryRow): TimeEntry {
  return {
    id: row.id,
    organizationId: row.organizationId,
    projectId: row.projectId,
    userId: row.userId,
    date: toCalendarDate(row.date),
    hours: row.hours,
    description: row.description,
    billable: row.billable,
    invoiceId: row.invoiceId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const timeEntryRepository = {
  async list(orgId: string, filter: ListTimeEntriesFilter): Promise<TimeEntry[]> {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filter.from) dateFilter.gte = fromCalendarDate(filter.from);
    if (filter.to) dateFilter.lte = fromCalendarDate(filter.to);

    const rows = await prisma.timeEntry.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(filter.projectId ? { projectId: filter.projectId } : {}),
        ...(filter.userId ? { userId: filter.userId } : {}),
        ...(filter.from || filter.to ? { date: dateFilter } : {}),
      },
      select: TIME_ENTRY_SELECT,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => mapTimeEntry(row as TimeEntryRow));
  },

  async findById(id: string, orgId: string): Promise<TimeEntry | null> {
    const row = await prisma.timeEntry.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: TIME_ENTRY_SELECT,
    });
    return row ? mapTimeEntry(row as TimeEntryRow) : null;
  },

  async create(input: CreateTimeEntryInput): Promise<TimeEntry> {
    const row = await prisma.timeEntry.create({
      data: {
        organizationId: input.organizationId,
        projectId: input.projectId ?? null,
        userId: input.userId,
        date: fromCalendarDate(input.date),
        hours: input.hours,
        description: input.description ?? null,
        billable: input.billable ?? true,
      },
      select: TIME_ENTRY_SELECT,
    });
    return mapTimeEntry(row as TimeEntryRow);
  },

  async update(id: string, orgId: string, patch: UpdateTimeEntryInput): Promise<TimeEntry | null> {
    const existing = await prisma.timeEntry.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.timeEntry.update({
      where: { id },
      data: {
        ...(patch.projectId !== undefined ? { projectId: patch.projectId } : {}),
        ...(patch.date !== undefined ? { date: fromCalendarDate(patch.date) } : {}),
        ...(patch.hours !== undefined ? { hours: patch.hours } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.billable !== undefined ? { billable: patch.billable } : {}),
      },
      select: TIME_ENTRY_SELECT,
    });
    return mapTimeEntry(row as TimeEntryRow);
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.timeEntry.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return false;

    await prisma.timeEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
    return true;
  },
};
