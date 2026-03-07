/**
 * Meetings API handlers — colocated with the meetings module.
 *
 * All handlers use createHandler from @platform/api which provides:
 *   - JWT authentication
 *   - Rate limiting
 *   - Zod validation
 *   - RFC 9110 / 9457 compliant error responses
 *
 * app/api/ routes are thin re-export wrappers that point here.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, created, noContent } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  createMeeting,
  listMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
} from '../../application/meeting.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function requireStaff(roles: string[], orgId: string | null) {
  if (!orgId) throw Errors.forbidden('No organization context');
  if (!roles.some((r) => ['super_admin', 'admin', 'user'].includes(r)))
    throw Errors.forbidden('Meetings access requires staff role');
}

function extractId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.indexOf('meetings') + 1] ?? '';
}

async function extractAuth(req: NextRequest) {
  const token =
    req.headers.get('authorization')?.slice(7) ??
    req.cookies.get('token')?.value ??
    '';
  return verifyToken(token);
}

// ── List Meetings ─────────────────────────────────────────────────────────────

const GetQuerySchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const handleListMeetings = createHandler(
  { auth: 'jwt', tag: 'Meetings:List', query: GetQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof GetQuerySchema>; req: NextRequest };
    const payload = await extractAuth(req);
    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const { meetings, total } = await listMeetings(payload.orgId, {
      status: query.status,
      limit:  query.limit,
      offset: query.offset,
    });

    return ok({ meetings, total });
  },
);

// ── Create Meeting ────────────────────────────────────────────────────────────

const ParticipantSchema = z.object({
  userId: z.string().optional(),
  name:   z.string().min(1).max(200),
  email:  z.string().email().optional(),
});

const CreateBodySchema = z.object({
  title:        z.string().min(1).max(200),
  scheduledAt:  z.string().datetime(),
  provider:     z.enum(['daily', 'google_meet', 'zoom', 'manual']).default('manual'),
  meetingUrl:   z.string().url().optional(),
  agenda:       z.string().max(5000).optional(),
  participants: z.array(ParticipantSchema).max(100).default([]),
});

export const handleCreateMeeting = createHandler(
  { auth: 'jwt', tag: 'Meetings:Create', body: CreateBodySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await extractAuth(req);
    requireStaff(payload.roles, payload.orgId ?? null);

    const meeting = await createMeeting({
      organizationId: payload.orgId!,
      title:          body.title,
      scheduledAt:    new Date(body.scheduledAt),
      provider:       body.provider,
      meetingUrl:     body.meetingUrl ?? null,
      agenda:         body.agenda ?? null,
      createdBy:      payload.sub,
      participants:   body.participants.map((p) => ({
        userId: p.userId ?? null,
        name:   p.name,
        email:  p.email ?? null,
      })),
    });

    return created({ meeting });
  },
);

// ── Get Meeting ───────────────────────────────────────────────────────────────

export const handleGetMeeting = createHandler(
  { auth: 'jwt', tag: 'Meetings:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id = extractId(req);
    const payload = await extractAuth(req);
    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const meeting = await getMeeting(id, payload.orgId);
    if (!meeting) throw Errors.notFound('Meeting not found');

    return ok({ meeting });
  },
);

// ── Update Meeting ────────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  title:           z.string().min(1).max(200).optional(),
  status:          z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  meetingUrl:      z.string().url().optional().nullable(),
  agenda:          z.string().max(5000).optional().nullable(),
  startedAt:       z.string().datetime().optional().nullable(),
  endedAt:         z.string().datetime().optional().nullable(),
  durationSeconds: z.number().int().min(0).optional(),
});

export const handleUpdateMeeting = createHandler(
  { auth: 'jwt', tag: 'Meetings:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as unknown as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await extractAuth(req);
    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const meeting = await updateMeeting(
      id,
      payload.orgId,
      {
        title:           body.title           ?? undefined,
        status:          body.status          ?? undefined,
        meetingUrl:      body.meetingUrl      !== undefined ? body.meetingUrl : undefined,
        agenda:          body.agenda          !== undefined ? body.agenda     : undefined,
        startedAt:       body.startedAt       !== undefined ? (body.startedAt  ? new Date(body.startedAt)  : null) : undefined,
        endedAt:         body.endedAt         !== undefined ? (body.endedAt    ? new Date(body.endedAt)    : null) : undefined,
        durationSeconds: body.durationSeconds !== undefined ? body.durationSeconds : undefined,
      },
      payload.sub,
    );
    if (!meeting) throw Errors.notFound('Meeting not found');

    return ok({ meeting });
  },
);

// ── Delete Meeting ────────────────────────────────────────────────────────────

export const handleDeleteMeeting = createHandler(
  { auth: 'jwt', tag: 'Meetings:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id = extractId(req);
    const payload = await extractAuth(req);
    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const deleted = await deleteMeeting(id, payload.orgId, payload.sub);
    if (!deleted) throw Errors.notFound('Meeting not found');

    return noContent();
  },
);
