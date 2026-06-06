/**
 * Time Entry — domain types.
 *
 * Staff log billable/non-billable hours against a project (or no project, for
 * general non-project time). Rows live in `prj_time_entries`. Everything here is
 * pure — no Prisma, no I/O.
 *
 * Serialisation conventions:
 *  - `date` is a calendar date as 'YYYY-MM-DD' (stored as a `@db.Date` column).
 *  - `createdAt` / `updatedAt` are full ISO-8601 timestamps.
 */

export interface TimeEntry {
  id: string;
  organizationId: string;
  projectId: string | null;
  userId: string;
  /** Calendar date as 'YYYY-MM-DD'. */
  date: string;
  hours: number;
  description: string | null;
  billable: boolean;
  /** Set when the entry has been billed (M3). Null while unbilled. */
  invoiceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LogTimeEntryInput {
  projectId?: string | null;
  /** Calendar date as 'YYYY-MM-DD'. */
  date: string;
  hours: number;
  description?: string | null;
  billable?: boolean;
}

export interface EditTimeEntryPatch {
  projectId?: string | null;
  /** Calendar date as 'YYYY-MM-DD'. */
  date?: string;
  hours?: number;
  description?: string | null;
  billable?: boolean;
}

/** Filters for listing time entries within an organization. */
export interface ListTimeEntriesFilter {
  projectId?: string;
  userId?: string;
  /** Inclusive lower bound on `date`, as 'YYYY-MM-DD'. */
  from?: string;
  /** Inclusive upper bound on `date`, as 'YYYY-MM-DD'. */
  to?: string;
}
