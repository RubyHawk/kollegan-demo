import { z } from 'zod';
import { createHandler } from '@platform/api/handler';
import { Errors } from '@platform/api/errors';
import { created, ok } from '@platform/api/response';
import type { JWTPayload } from '@platform/auth/jwt';
import {
  createScheduleShift,
  listScheduleMembers,
  listScheduleShifts,
  updateScheduleShift,
} from '../../application/schedule.service';

function requireOrg(payload: JWTPayload | null): string {
  if (!payload?.orgId) throw Errors.forbidden('Organization context required');
  return payload.orgId;
}

function shiftIdFromUrl(req: Request): string {
  const id = new URL(req.url).pathname.split('/').filter(Boolean).at(-1);
  if (!id) throw Errors.badRequest('Schedule shift id is required');
  return id;
}

const ListQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

const CreateShiftSchema = z.object({
  userId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  roleLabel: z.string().max(80).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

const UpdateShiftSchema = z.object({
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  roleLabel: z.string().max(80).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
});

export const handleListScheduleShifts = createHandler(
  {
    tag: 'Schedule:List',
    auth: 'jwt',
    permission: 'schedule.read',
    rateLimit: { max: 60, windowMs: 60_000 },
    query: ListQuerySchema,
  },
  async ({ auth, query }) => {
    const orgId = requireOrg(auth);
    return ok({ shifts: await listScheduleShifts(orgId, query!) });
  },
);

export const handleCreateScheduleShift = createHandler(
  {
    tag: 'Schedule:Create',
    auth: 'jwt',
    permission: 'schedule.write',
    rateLimit: { max: 40, windowMs: 60_000 },
    body: CreateShiftSchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    const shift = await createScheduleShift(orgId, auth!.sub, body!);
    return created({ shift }, `/api/v1/schedule/${shift.id}`);
  },
);

export const handleUpdateScheduleShift = createHandler(
  {
    tag: 'Schedule:Update',
    auth: 'jwt',
    permission: 'schedule.write',
    rateLimit: { max: 40, windowMs: 60_000 },
    body: UpdateShiftSchema,
  },
  async ({ auth, body, req }) => {
    const orgId = requireOrg(auth);
    return ok({ shift: await updateScheduleShift(orgId, shiftIdFromUrl(req), auth!.sub, body!) });
  },
);

export const handleListScheduleMembers = createHandler(
  {
    tag: 'Schedule:Members',
    auth: 'jwt',
    permission: 'schedule.write',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async ({ auth }) => {
    const orgId = requireOrg(auth);
    return ok({ members: await listScheduleMembers(orgId) });
  },
);
