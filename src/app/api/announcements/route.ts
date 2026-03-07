/**
 * GET  /api/announcements  — list announcements for the organization
 * POST /api/announcements  — create a new announcement
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, created } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { prisma } from '@core/database/prisma';

// ─── GET ──────────────────────────────────────────────────────────────────────

const GetQuerySchema = z.object({
  priority: z.enum(['normal','important','urgent']).optional(),
  pinned:   z.enum(['true','false']).optional(),
  limit:    z.coerce.number().int().min(1).max(100).default(50),
  offset:   z.coerce.number().int().min(0).default(0),
});

export const GET = createHandler(
  { auth: 'jwt', tag: 'Announcements:List', query: GetQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof GetQuerySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      organizationId: payload.orgId,
      deletedAt: null,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };
    if (query.priority) where.priority = query.priority;
    if (query.pinned !== undefined) where.isPinned = query.pinned === 'true';

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        take:  query.limit,
        skip:  query.offset,
        include: {
          reads: { where: { userId: payload.sub }, select: { readAt: true } },
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = announcements.map((a: any) => ({
      id:          a.id,
      title:       a.title,
      content:     a.content,
      priority:    a.priority,
      isPinned:    a.isPinned,
      authorId:    a.authorId,
      publishedAt: a.publishedAt.toISOString(),
      expiresAt:   a.expiresAt?.toISOString() ?? null,
      createdAt:   a.createdAt.toISOString(),
      updatedAt:   a.updatedAt.toISOString(),
      isRead:      a.reads.length > 0,
      readAt:      a.reads[0]?.readAt.toISOString() ?? null,
    }));

    return ok({ announcements: result, total });
  },
);

// ─── POST ─────────────────────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  title:     z.string().min(1).max(200),
  content:   z.string().min(1).max(10000),
  priority:  z.enum(['normal','important','urgent']).default('normal'),
  isPinned:  z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export const POST = createHandler(
  { auth: 'jwt', tag: 'Announcements:Create', body: CreateBodySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isStaff = payload.roles.some((r) => ['super_admin', 'admin', 'user'].includes(r));
    if (!isStaff) throw Errors.forbidden('Staff role required');

    const announcement = await prisma.announcement.create({
      data: {
        organizationId: payload.orgId,
        title:     body.title,
        content:   body.content,
        priority:  body.priority,
        isPinned:  body.isPinned,
        authorId:  payload.sub,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    return created({
      announcement: {
        ...announcement,
        publishedAt: announcement.publishedAt.toISOString(),
        createdAt:   announcement.createdAt.toISOString(),
        updatedAt:   announcement.updatedAt.toISOString(),
        expiresAt:   announcement.expiresAt?.toISOString() ?? null,
      },
    });
  },
);
