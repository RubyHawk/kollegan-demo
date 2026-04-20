import { apiDelete, apiGet, apiPatch, apiPost } from '../api-client';

const BASE_URL = '/api/v1/announcements';

interface ApiEnvelope<T> {
  data: T;
}

export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  isPinned: boolean;
  authorId: string;
  publishedAt: string;
  expiresAt: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListAnnouncementsParams {
  priority?: AnnouncementPriority;
  pinned?: boolean;
  limit?: number;
  offset?: number;
}

export interface SaveAnnouncementPayload {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  isPinned: boolean;
  expiresAt?: string | null;
}

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listAnnouncements(params: ListAnnouncementsParams = {}) {
  const res = await apiGet<ApiEnvelope<{ announcements: Announcement[]; total: number }>>(
    `${BASE_URL}${query(params)}`,
  );
  return res.data;
}

export async function createAnnouncement(payload: SaveAnnouncementPayload): Promise<Announcement> {
  const res = await apiPost<ApiEnvelope<{ announcement: Announcement }>>(BASE_URL, payload);
  return res.data.announcement;
}

export async function updateAnnouncement(
  id: string,
  payload: Partial<SaveAnnouncementPayload>,
): Promise<Announcement> {
  const res = await apiPatch<ApiEnvelope<{ announcement: Announcement }>>(`${BASE_URL}/${id}`, payload);
  return res.data.announcement;
}

export async function markAnnouncementRead(id: string): Promise<void> {
  await apiPatch(`${BASE_URL}/${id}`, { action: 'read' });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await apiDelete(`${BASE_URL}/${id}`);
}
