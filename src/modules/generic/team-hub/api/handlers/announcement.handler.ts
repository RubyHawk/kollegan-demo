import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { created, noContent, ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken, type JWTPayload } from '@platform/auth/jwt';
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  markAnnouncementRead,
  updateAnnouncement,
} from '../../application/announcements.service';

const AnnouncementPrioritySchema = z.enum(['normal', 'important', 'urgent']);
const PinnedQuerySchema = z.enum(['true', 'false']).optional();

function extractToken(req: NextRequest): string {
  const auth = req.headers.get('authorization') ?? '';
  const bearer = auth.match(/^Bearer\s+(.+)$/i);
  return bearer?.[1] ?? req.cookies.get('at')?.value ?? req.cookies.get('token')?.value ?? '';
}

async function requireOrg(req: NextRequest): Promise<JWTPayload> {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  return payload;
}

function hasAnyRole(payload: JWTPayload, roles: string[]): boolean {
  return (payload.roles ?? []).some((role) => roles.includes(role));
}

async function requireStaff(req: NextRequest): Promise<JWTPayload> {
  const payload = await requireOrg(req);
  if (!hasAnyRole(payload, ['super_admin', 'admin', 'user'])) {
    throw Errors.forbidden('Staff role required');
  }
  return payload;
}

async function requireAdmin(req: NextRequest): Promise<JWTPayload> {
  const payload = await requireOrg(req);
  if (!hasAnyRole(payload, ['super_admin', 'admin'])) {
    throw Errors.forbidden('Admin role required');
  }
  return payload;
}

function extractId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  const idx = parts.indexOf('announcements');
  return idx >= 0 ? parts[idx + 1] ?? '' : '';
}

function parseDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

const ListQuerySchema = z.object({
  priority: AnnouncementPrioritySchema.optional(),
  pinned: PinnedQuerySchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const handleListAnnouncements = createHandler(
  { auth: 'jwt', tag: 'Announcements:List', query: ListQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof ListQuerySchema>; req: NextRequest };
    const payload = await requireOrg(req);
    const result = await listAnnouncements({
      organizationId: payload.orgId!,
      userId: payload.sub,
      filter: {
        priority: query.priority,
        pinned: query.pinned === undefined ? undefined : query.pinned === 'true',
        limit: query.limit,
        offset: query.offset,
      },
    });

    return ok(result);
  },
);

const CreateBodySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  priority: AnnouncementPrioritySchema.default('normal'),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export const handleCreateAnnouncement = createHandler(
  { auth: 'jwt', tag: 'Announcements:Create', body: CreateBodySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const announcement = await createAnnouncement({
      organizationId: payload.orgId!,
      authorId: payload.sub,
      title: body.title,
      content: body.content,
      priority: body.priority,
      isPinned: body.isPinned,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });

    return created({ announcement });
  },
);

const UpdateBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  priority: AnnouncementPrioritySchema.optional(),
  isPinned: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  action: z.enum(['read']).optional(),
});

export const handleUpdateAnnouncement = createHandler(
  { auth: 'jwt', tag: 'Announcements:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const payload = await requireOrg(req);
    const id = extractId(req);

    if (body.action === 'read') {
      const didMarkRead = await markAnnouncementRead({
        id,
        organizationId: payload.orgId!,
        userId: payload.sub,
      });
      if (!didMarkRead) throw Errors.notFound('Announcement not found');
      return ok({ read: true });
    }

    if (!hasAnyRole(payload, ['super_admin', 'admin', 'user'])) {
      throw Errors.forbidden('Staff role required');
    }

    const announcement = await updateAnnouncement({
      id,
      organizationId: payload.orgId!,
      data: {
        title: body.title,
        content: body.content,
        priority: body.priority,
        isPinned: body.isPinned,
        expiresAt: parseDate(body.expiresAt),
      },
    });
    if (!announcement) throw Errors.notFound('Announcement not found');

    return ok({ announcement });
  },
);

export const handleDeleteAnnouncement = createHandler(
  { auth: 'jwt', tag: 'Announcements:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await requireAdmin(req);
    const deleted = await deleteAnnouncement({
      id: extractId(req),
      organizationId: payload.orgId!,
    });
    if (!deleted) throw Errors.notFound('Announcement not found');

    return noContent();
  },
);
