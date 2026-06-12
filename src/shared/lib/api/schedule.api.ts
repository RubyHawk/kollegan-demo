import { apiGet, apiPatch, apiPost } from '../api-client';

interface ApiEnvelope<T> {
  data: T;
}

export type ScheduleShiftStatus = 'scheduled' | 'completed' | 'cancelled';

export interface ScheduleShift {
  id: string;
  organizationId: string;
  userId: string;
  startsAt: string;
  endsAt: string;
  roleLabel: string | null;
  notes: string | null;
  status: ScheduleShiftStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface ScheduleMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export async function listScheduleShifts(from: string, to: string): Promise<ScheduleShift[]> {
  const params = new URLSearchParams({ from, to });
  const res = await apiGet<ApiEnvelope<{ shifts: ScheduleShift[] }>>(`/api/v1/schedule?${params}`);
  return res.data.shifts;
}

export async function createScheduleShift(payload: {
  userId: string;
  startsAt: string;
  endsAt: string;
  roleLabel?: string | null;
  notes?: string | null;
}): Promise<ScheduleShift> {
  const res = await apiPost<ApiEnvelope<{ shift: ScheduleShift }>>('/api/v1/schedule', payload);
  return res.data.shift;
}

export async function updateScheduleShift(
  id: string,
  payload: {
    startsAt?: string;
    endsAt?: string;
    roleLabel?: string | null;
    notes?: string | null;
    status?: ScheduleShiftStatus;
  },
): Promise<ScheduleShift> {
  const res = await apiPatch<ApiEnvelope<{ shift: ScheduleShift }>>(`/api/v1/schedule/${id}`, payload);
  return res.data.shift;
}

export async function listScheduleMembers(): Promise<ScheduleMember[]> {
  const res = await apiGet<ApiEnvelope<{ members: ScheduleMember[] }>>('/api/v1/schedule/members');
  return res.data.members;
}
