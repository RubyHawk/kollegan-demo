/**
 * GET  /api/meetings  — list meetings for the organization
 * POST /api/meetings  — create a new meeting
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
  status: z.enum(['scheduled','in_progress','completed','cancelled']).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const GET = createHandler(
  { auth: 'jwt', tag: 'Meetings:List', query: GetQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof GetQuerySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { organizationId: payload.orgId, deletedAt: null };
    if (query.status) where.status = query.status;

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        orderBy: { scheduledAt: 'desc' },
        take:  query.limit,
        skip:  query.offset,
        include: {
          participants: true,
          summary:      true,
        },
      }),
      prisma.meeting.count({ where }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = meetings.map((m: any) => ({
      id:              m.id,
      title:           m.title,
      status:          m.status,
      provider:        m.provider,
      meetingUrl:      m.meetingUrl,
      agenda:          m.agenda,
      scheduledAt:     m.scheduledAt.toISOString(),
      startedAt:       m.startedAt?.toISOString()  ?? null,
      endedAt:         m.endedAt?.toISOString()    ?? null,
      durationSeconds: m.durationSeconds,
      createdBy:       m.createdBy,
      createdAt:       m.createdAt.toISOString(),
      updatedAt:       m.updatedAt.toISOString(),
      participants:    m.participants,
      summary:         m.summary ? {
        ...m.summary,
        generatedAt: m.summary.generatedAt?.toISOString() ?? null,
      } : null,
    }));

    return ok({ meetings: result, total });
  },
);

// ─── POST ─────────────────────────────────────────────────────────────────────

const ParticipantSchema = z.object({
  userId: z.string().optional(),
  name:   z.string().min(1).max(200),
  email:  z.string().email().optional(),
});

const CreateBodySchema = z.object({
  title:        z.string().min(1).max(200),
  scheduledAt:  z.string().datetime(),
  provider:     z.enum(['daily','google_meet','zoom','manual']).default('manual'),
  meetingUrl:   z.string().url().optional(),
  agenda:       z.string().max(5000).optional(),
  participants: z.array(ParticipantSchema).max(100).default([]),
});

export const POST = createHandler(
  { auth: 'jwt', tag: 'Meetings:Create', body: CreateBodySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isStaff = payload.roles.some((r) => ['super_admin', 'admin', 'user'].includes(r));
    if (!isStaff) throw Errors.forbidden('Staff role required');

    const meeting = await prisma.meeting.create({
      data: {
        organizationId: payload.orgId,
        title:       body.title,
        scheduledAt: new Date(body.scheduledAt),
        provider:    body.provider,
        meetingUrl:  body.meetingUrl ?? null,
        agenda:      body.agenda    ?? null,
        createdBy:   payload.sub,
        participants: {
          create: body.participants.map(p => ({
            userId: p.userId ?? null,
            name:   p.name,
            email:  p.email ?? null,
          })),
        },
      },
      include: { participants: true },
    });

    return created({
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
