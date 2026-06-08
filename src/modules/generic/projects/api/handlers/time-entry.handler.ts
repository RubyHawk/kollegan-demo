/**
 * Time Entry API handlers — colocated with the projects module.
 *
 * app/api/v1/time-entries/ routes are thin re-export wrappers that point here.
 * Staff log their own time; admins may edit/delete any entry in their org.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, created } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  listTimeEntries,
  logTimeEntry,
  editTimeEntry,
  removeTimeEntry,
  TimeEntryDomainError,
} from '../../application/time-entry.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

function extractId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').at(-1) ?? '';
}

const ADMIN_ROLES = ['admin', 'super_admin'];

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  return payload;
}

function isAdminRole(roles: string[]): boolean {
  return roles.some((r) => ADMIN_ROLES.includes(r));
}

function translateDomainError(error: unknown): never {
  if (error instanceof TimeEntryDomainError) {
    if (error.kind === 'forbidden') throw Errors.forbidden(error.message);
    throw Errors.validation(error.message);
  }
  throw error instanceof Error ? error : Errors.internal();
}

function timeEntryLocation(id: string): string {
  return `/api/v1/time-entries/${id}`;
}

// ── Shared schema pieces ──────────────────────────────────────────────────────

const DateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be a YYYY-MM-DD calendar date')
  // The regex alone accepts impossible dates (e.g. 2026-02-31, which would
  // normalize to 2026-03-03). Require the value to round-trip to a real date.
  .refine((s) => {
    const d = new Date(`${s}T00:00:00.000Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, 'date must be a real calendar date');
const HoursSchema = z.number().positive().max(24);
const DescriptionSchema = z.string().trim().max(2000);

// ── List Time Entries ──────────────────────────────────────────────────────────

const ListQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  from: DateSchema.optional(),
  to: DateSchema.optional(),
});

export const handleListTimeEntries = createHandler(
  {
    auth: 'jwt',
    tag: 'TimeEntries:List',
    query: ListQuerySchema,
    permission: 'time_entries.read',
    rateLimit: { max: 120, windowMs: 60_000 },
  },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof ListQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const entries = await listTimeEntries(payload.orgId!, {
      projectId: query.projectId,
      userId: query.userId,
      from: query.from,
      to: query.to,
    });
    return ok({ entries });
  },
);

// ── Create Time Entry ──────────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  date: DateSchema,
  hours: HoursSchema,
  description: DescriptionSchema.optional().nullable(),
  billable: z.boolean().optional(),
});

export const handleCreateTimeEntry = createHandler(
  {
    auth: 'jwt',
    tag: 'TimeEntries:Create',
    body: CreateBodySchema,
    permission: 'time_entries.write',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);

    try {
      const entry = await logTimeEntry(payload.orgId!, payload.sub, {
        projectId: body.projectId ?? null,
        date: body.date,
        hours: body.hours,
        description: body.description ?? null,
        billable: body.billable,
      });
      return created(entry, timeEntryLocation(entry.id));
    } catch (error) {
      translateDomainError(error);
    }
  },
);

// ── Update Time Entry ──────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  date: DateSchema.optional(),
  hours: HoursSchema.optional(),
  description: DescriptionSchema.optional().nullable(),
  billable: z.boolean().optional(),
});

export const handleUpdateTimeEntry = createHandler(
  {
    auth: 'jwt',
    tag: 'TimeEntries:Update',
    body: UpdateBodySchema,
    permission: 'time_entries.write',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);

    try {
      const updated = await editTimeEntry(payload.orgId!, id, payload.sub, isAdminRole(payload.roles), {
        ...(body.projectId !== undefined ? { projectId: body.projectId } : {}),
        ...(body.date !== undefined ? { date: body.date } : {}),
        ...(body.hours !== undefined ? { hours: body.hours } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.billable !== undefined ? { billable: body.billable } : {}),
      });
      if (!updated) throw Errors.notFound('Time entry');
      return ok(updated);
    } catch (error) {
      translateDomainError(error);
    }
  },
);

// ── Delete Time Entry ──────────────────────────────────────────────────────────

export const handleDeleteTimeEntry = createHandler(
  {
    auth: 'jwt',
    tag: 'TimeEntries:Delete',
    permission: 'time_entries.write',
    rateLimit: { max: 30, windowMs: 60_000 },
  },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);

    try {
      const deleted = await removeTimeEntry(payload.orgId!, id, payload.sub, isAdminRole(payload.roles));
      if (deleted === null) throw Errors.notFound('Time entry');
      return ok(null);
    } catch (error) {
      translateDomainError(error);
    }
  },
);
