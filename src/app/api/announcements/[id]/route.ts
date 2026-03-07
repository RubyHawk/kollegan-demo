/**
 * PATCH  /api/announcements/[id]  — update announcement (or mark as read via action=read)
 * DELETE /api/announcements/[id]  — soft-delete announcement
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, noContent } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { prisma as _prisma } from '@core/database/prisma';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;

function extractId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.indexOf('announcements') + 1] ?? '';
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  title:     z.string().min(1).max(200).optional(),
  content:   z.string().min(1).max(10000).optional(),
  priority:  z.enum(['normal','important','urgent']).optional(),
  isPinned:  z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  action:    z.enum(['read']).optional(),
});

export const PATCH = createHandler(
  { auth: 'jwt', tag: 'Announcements:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as unknown as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const existing = await prisma.announcement.findFirst({
      where: { id, organizationId: payload.orgId, deletedAt: null },
    });
    if (!existing) throw Errors.notFound('Announcement not found');

    // Mark as read action — any authenticated user can do this
    if (body.action === 'read') {
      await prisma.announcementRead.upsert({
        where:  { announcementId_userId: { announcementId: id, userId: payload.sub } },
        create: { announcementId: id, userId: payload.sub },
        update: { readAt: new Date() },
      });
      return ok({ read: true });
    }

    // Only staff can edit announcement content
    const isStaff = payload.roles.some((r) => ['super_admin', 'admin', 'user'].includes(r));
    if (!isStaff) throw Errors.forbidden('Staff role required');

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title:     body.title    ?? undefined,
        content:   body.content  ?? undefined,
        priority:  body.priority ?? undefined,
        isPinned:  body.isPinned !== undefined ? body.isPinned : undefined,
        expiresAt: body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : undefined,
      },
    });

    return ok({
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

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const DELETE = createHandler(
  { auth: 'jwt', tag: 'Announcements:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id  = extractId(req);
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isAdmin = payload.roles.some((r) => ['super_admin', 'admin'].includes(r));
    if (!isAdmin) throw Errors.forbidden('Admin role required');

    const existing = await prisma.announcement.findFirst({ where: { id, organizationId: payload.orgId, deletedAt: null } });
    if (!existing) throw Errors.notFound('Announcement not found');

    await prisma.announcement.update({ where: { id }, data: { deletedAt: new Date() } });

    return noContent();
  },
);
