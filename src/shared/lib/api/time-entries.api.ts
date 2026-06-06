import { apiDelete, apiGet, apiPost, apiPut } from '../api-client';

const BASE_URL = '/api/v1/time-entries';

interface ApiEnvelope<T> {
  data: T;
}

/**
 * A logged time entry. Mirrors the projects-module domain type. `date` is a
 * calendar date as 'YYYY-MM-DD'; `createdAt`/`updatedAt` are ISO-8601.
 */
export interface TimeEntry {
  id: string;
  organizationId: string;
  projectId: string | null;
  userId: string;
  date: string;
  hours: number;
  description: string | null;
  billable: boolean;
  /** Set once the entry has been billed (M3). Null while unbilled. */
  invoiceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListTimeEntriesParams {
  projectId?: string;
  userId?: string;
  /** Inclusive lower bound on `date`, as 'YYYY-MM-DD'. */
  from?: string;
  /** Inclusive upper bound on `date`, as 'YYYY-MM-DD'. */
  to?: string;
}

export interface CreateTimeEntryPayload {
  projectId?: string | null;
  /** Calendar date as 'YYYY-MM-DD'. */
  date: string;
  hours: number;
  description?: string | null;
  billable?: boolean;
}

export interface UpdateTimeEntryPatch {
  projectId?: string | null;
  date?: string;
  hours?: number;
  description?: string | null;
  billable?: boolean;
}

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listTimeEntries(params: ListTimeEntriesParams = {}): Promise<TimeEntry[]> {
  const res = await apiGet<ApiEnvelope<{ entries: TimeEntry[] }>>(`${BASE_URL}${query(params)}`);
  return res.data.entries;
}

export async function createTimeEntry(payload: CreateTimeEntryPayload): Promise<TimeEntry> {
  const res = await apiPost<ApiEnvelope<TimeEntry>>(BASE_URL, payload);
  return res.data;
}

export async function updateTimeEntry(id: string, patch: UpdateTimeEntryPatch): Promise<TimeEntry> {
  const res = await apiPut<ApiEnvelope<TimeEntry>>(`${BASE_URL}/${id}`, patch);
  return res.data;
}

export async function deleteTimeEntry(id: string): Promise<void> {
  await apiDelete(`${BASE_URL}/${id}`);
}
