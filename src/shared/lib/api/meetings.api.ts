import { apiDelete, apiGet, apiPatch, apiPost } from '../api-client';

const BASE_URL = '/api/v1/meetings';

interface ApiEnvelope<T> {
  data: T;
}

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MeetingProvider = 'daily' | 'google_meet' | 'zoom' | 'manual';

export interface MeetingParticipant {
  id: string;
  name: string;
  email: string | null;
  userId: string | null;
}

export interface MeetingSummary {
  status: string;
  summary: string | null;
  keyDecisions: string[];
  nextSteps: string | null;
}

export interface Meeting {
  id: string;
  title: string;
  status: MeetingStatus;
  provider: MeetingProvider;
  meetingUrl: string | null;
  agenda: string | null;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  participants: MeetingParticipant[];
  summary: MeetingSummary | null;
}

export interface ListMeetingsParams {
  status?: MeetingStatus;
  limit?: number;
  offset?: number;
}

export interface CreateMeetingPayload {
  title: string;
  scheduledAt: string;
  provider?: MeetingProvider;
  meetingUrl?: string;
  agenda?: string;
  participants?: Array<{
    userId?: string;
    name: string;
    email?: string;
  }>;
}

export interface UpdateMeetingPayload {
  title?: string;
  status?: MeetingStatus;
  meetingUrl?: string | null;
  agenda?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSeconds?: number;
}

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listMeetings(params: ListMeetingsParams = {}) {
  const res = await apiGet<ApiEnvelope<{ meetings: Meeting[]; total: number }>>(
    `${BASE_URL}${query(params)}`,
  );
  return res.data;
}

export async function createMeeting(payload: CreateMeetingPayload): Promise<Meeting> {
  const res = await apiPost<ApiEnvelope<{ meeting: Meeting }>>(BASE_URL, payload);
  return res.data.meeting;
}

export async function updateMeeting(id: string, payload: UpdateMeetingPayload): Promise<Meeting> {
  const res = await apiPatch<ApiEnvelope<{ meeting: Meeting }>>(`${BASE_URL}/${id}`, payload);
  return res.data.meeting;
}

export async function deleteMeeting(id: string): Promise<void> {
  await apiDelete(`${BASE_URL}/${id}`);
}
