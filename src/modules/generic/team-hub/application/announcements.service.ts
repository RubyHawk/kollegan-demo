import type { AnnouncementPriority } from '../domain/announcement.entity';
import {
  announcementsRepository,
  type AnnouncementRow,
  type AnnouncementWithReadRow,
  type ListAnnouncementsFilter,
  type SaveAnnouncementInput,
} from '../infrastructure/announcements.repository';

export interface AnnouncementDto {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  isPinned: boolean;
  authorId: string;
  publishedAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
  readAt?: string | null;
}

function mapAnnouncement(row: AnnouncementRow): AnnouncementDto {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    priority: row.priority as AnnouncementPriority,
    isPinned: row.isPinned,
    authorId: row.authorId,
    publishedAt: row.publishedAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapAnnouncementWithRead(row: AnnouncementWithReadRow): AnnouncementDto {
  const readAt = row.reads[0]?.readAt;
  return {
    ...mapAnnouncement(row),
    isRead: row.reads.length > 0,
    readAt: readAt?.toISOString() ?? null,
  };
}

export async function listAnnouncements(input: {
  organizationId: string;
  userId: string;
  filter: ListAnnouncementsFilter;
}): Promise<{ announcements: AnnouncementDto[]; total: number }> {
  const result = await announcementsRepository.list(input.organizationId, input.userId, input.filter);
  return {
    announcements: result.announcements.map(mapAnnouncementWithRead),
    total: result.total,
  };
}

export async function createAnnouncement(input: {
  organizationId: string;
  authorId: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  isPinned: boolean;
  expiresAt?: Date | null;
}): Promise<AnnouncementDto> {
  const announcement = await announcementsRepository.create(input);
  return mapAnnouncement(announcement);
}

export async function markAnnouncementRead(input: {
  id: string;
  organizationId: string;
  userId: string;
}): Promise<boolean> {
  const existing = await announcementsRepository.findActiveById(input.id, input.organizationId);
  if (!existing) return false;
  await announcementsRepository.markRead(input.id, input.userId);
  return true;
}

export async function updateAnnouncement(input: {
  id: string;
  organizationId: string;
  data: SaveAnnouncementInput;
}): Promise<AnnouncementDto | null> {
  const existing = await announcementsRepository.findActiveById(input.id, input.organizationId);
  if (!existing) return null;
  const announcement = await announcementsRepository.update(input.id, input.data);
  return mapAnnouncement(announcement);
}

export async function deleteAnnouncement(input: {
  id: string;
  organizationId: string;
}): Promise<boolean> {
  const existing = await announcementsRepository.findActiveById(input.id, input.organizationId);
  if (!existing) return false;
  await announcementsRepository.softDelete(input.id);
  return true;
}
