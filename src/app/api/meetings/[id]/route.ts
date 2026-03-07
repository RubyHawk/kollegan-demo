/**
 * GET    /api/meetings/[id]  — get meeting with participants and summary
 * PATCH  /api/meetings/[id]  — update meeting status / details
 * DELETE /api/meetings/[id]  — soft-delete meeting
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, noContent } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { prisma } from '@core/database/prisma';

function extractId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.indexOf('meetings') + 1] ?? '';
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export const GET = createHandler(
  { auth: 'jwt', tag: 'Meetings:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id  = extractId(req);
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const meeting = await prisma.meeting.findFirst({
      where: { id, organizationId: payload.orgId, deletedAt: null },
      include: { participants: true, summary: true },
    });
    if (!meeting) throw Errors.notFound('Meeting not found');

    return ok({
      meeting: {
        ...meeting,
        scheduledAt: meeting.scheduledAt.toISOString(),
        startedAt:   meeting.startedAt?.toISOString()  ?? null,
        endedAt:     meeting.endedAt?.toISOString()    ?? null,
        createdAt:   meeting.createdAt.toISOString(),
        updatedAt:   meeting.updatedAt.toISOString(),
        summary: meeting.summary ? {
          ...meeting.summary,
          generatedAt: meeting.summary.generatedAt?.toISOString() ?? null,
        } : null,
      },
    });
  },
);

// ─── PATCH ────────────────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  title:           z.string().min(1).max(200).optional(),
  status:          z.enum(['scheduled','in_progress','completed','cancelled']).optional(),
  meetingUrl:      z.string().url().optional().nullable(),
  agenda:          z.string().max(5000).optional().nullable(),
  startedAt:       z.string().datetime().optional().nullable(),
  endedAt:         z.string().datetime().optional().nullable(),
  durationSeconds: z.number().int().min(0).optional(),
});

export const PATCH = createHandler(
  { auth: 'jwt', tag: 'Meetings:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as unknown as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const existing = await prisma.meeting.findFirst({ where: { id, organizationId: payload.orgId, deletedAt: null } });
    if (!existing) throw Errors.notFound('Meeting not found');

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        title:           body.title           ?? undefined,
        status:          body.status          ?? undefined,
        meetingUrl:      body.meetingUrl      !== undefined ? body.meetingUrl : undefined,
        agenda:          body.agenda          !== undefined ? body.agenda     : undefined,
        startedAt:       body.startedAt       !== undefined ? (body.startedAt  ? new Date(body.startedAt)  : null) : undefined,
        endedAt:         body.endedAt         !== undefined ? (body.endedAt    ? new Date(body.endedAt)    : null) : undefined,
        durationSeconds: body.durationSeconds !== undefined ? body.durationSeconds : undefined,
      },
    });

    return ok({
      meeting: {
        ...meeting,
        scheduledAt: meeting.scheduledAt.toISOString(),
        startedAt:   meeting.startedAt?.toISOString()  ?? null,
        endedAt:     meeting.endedAt?.toISOString()    ?? null,
        createdAt:   meeting.createdAt.toISOString(),
        updatedAt:   meeting.updatedAt.toISOString(),
      },
    });
  },
);

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const DELETE = createHandler(
  { auth: 'jwt', tag: 'Meetings:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id  = extractId(req);
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const existing = await prisma.meeting.findFirst({ where: { id, organizationId: payload.orgId, deletedAt: null } });
    if (!existing) throw Errors.notFound('Meeting not found');

    await prisma.meeting.update({ where: { id }, data: { deletedAt: new Date() } });

    return noContent();
  },
);
