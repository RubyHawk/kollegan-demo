import { prisma } from '@platform/database/prisma';
import type { AnnouncementPriority } from '../domain/announcement.entity';

export interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  priority: string;
  isPinned: boolean;
  authorId: string;
  publishedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnnouncementWithReadRow extends AnnouncementRow {
  reads: Array<{ readAt: Date }>;
}

export interface ListAnnouncementsFilter {
  priority?: AnnouncementPriority;
  pinned?: boolean;
  limit: number;
  offset: number;
}

export interface SaveAnnouncementInput {
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
  isPinned?: boolean;
  expiresAt?: Date | null;
}

function activeAnnouncementWhere(organizationId: string, filter?: Pick<ListAnnouncementsFilter, 'priority' | 'pinned'>) {
  return {
    organizationId,
    deletedAt: null,
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ],
    ...(filter?.priority ? { priority: filter.priority } : {}),
    ...(filter?.pinned !== undefined ? { isPinned: filter.pinned } : {}),
  };
}

export const announcementsRepository = {
  async list(
    organizationId: string,
    userId: string,
    filter: ListAnnouncementsFilter,
  ): Promise<{ announcements: AnnouncementWithReadRow[]; total: number }> {
    const where = activeAnnouncementWhere(organizationId, filter);

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        take: filter.limit,
        skip: filter.offset,
        include: {
          reads: { where: { userId }, select: { readAt: true } },
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    return { announcements, total };
  },

  async create(input: {
    organizationId: string;
    authorId: string;
    title: string;
    content: string;
    priority: AnnouncementPriority;
    isPinned: boolean;
    expiresAt?: Date | null;
  }): Promise<AnnouncementRow> {
    return prisma.announcement.create({
      data: {
        organizationId: input.organizationId,
        title: input.title,
        content: input.content,
        priority: input.priority,
        isPinned: input.isPinned,
        authorId: input.authorId,
        expiresAt: input.expiresAt ?? null,
      },
    });
  },

  async findActiveById(id: string, organizationId: string): Promise<AnnouncementRow | null> {
    return prisma.announcement.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  },

  async markRead(id: string, userId: string): Promise<void> {
    await prisma.announcementRead.upsert({
      where: { announcementId_userId: { announcementId: id, userId } },
      create: { announcementId: id, userId },
      update: { readAt: new Date() },
    });
  },

  async update(id: string, input: SaveAnnouncementInput): Promise<AnnouncementRow> {
    return prisma.announcement.update({
      where: { id },
      data: {
        title: input.title ?? undefined,
        content: input.content ?? undefined,
        priority: input.priority ?? undefined,
        isPinned: input.isPinned !== undefined ? input.isPinned : undefined,
        expiresAt: input.expiresAt !== undefined ? input.expiresAt : undefined,
      },
    });
  },

  async softDelete(id: string): Promise<void> {
    await prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
