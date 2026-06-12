import { z } from 'zod';
import { createHandler } from '@platform/api/handler';
import { Errors } from '@platform/api/errors';
import { ok } from '@platform/api/response';
import type { JWTPayload } from '@platform/auth/jwt';
import {
  clockIn,
  clockOut,
  correctAttendanceShift,
  getCurrentAttendanceShift,
  kioskClockIn,
  kioskClockOut,
  listClockableStaffForKiosk,
  listTodayAttendance,
} from '../../application/attendance.service';

function requireOrg(payload: JWTPayload | null): string {
  if (!payload?.orgId) throw Errors.forbidden('Organization context required');
  return payload.orgId;
}

function shiftIdFromUrl(req: Request): string {
  const pathname = new URL(req.url).pathname;
  const id = pathname.split('/').filter(Boolean).at(-2);
  if (!id) throw Errors.badRequest('Attendance shift id is required');
  return id;
}

const ClockEventSchema = z.object({
  deviceLabel: z.string().max(120).nullable().optional(),
  location: z.string().max(160).nullable().optional(),
});

const CorrectionSchema = z.object({
  clockInAt: z.string().datetime().optional(),
  clockOutAt: z.string().datetime().nullable().optional(),
  status: z.enum(['active', 'completed', 'corrected']).optional(),
  correctionReason: z.string().min(1).max(1000),
});

const KioskClockEventSchema = ClockEventSchema.extend({
  userId: z.string().uuid(),
  pin: z.string().regex(/^\d{4,8}$/),
});

export const handleGetCurrentAttendanceShift = createHandler(
  {
    tag: 'Attendance:Current',
    auth: 'jwt',
    permission: 'clock_in.self',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async ({ auth }) => {
    const orgId = requireOrg(auth);
    return ok({ shift: await getCurrentAttendanceShift(orgId, auth!.sub) });
  },
);

export const handleClockIn = createHandler(
  {
    tag: 'Attendance:ClockIn',
    auth: 'jwt',
    permission: 'clock_in.self',
    rateLimit: { max: 20, windowMs: 60_000 },
    body: ClockEventSchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    return ok({ shift: await clockIn(orgId, auth!.sub, body ?? {}) });
  },
);

export const handleClockOut = createHandler(
  {
    tag: 'Attendance:ClockOut',
    auth: 'jwt',
    permission: 'clock_in.self',
    rateLimit: { max: 20, windowMs: 60_000 },
    body: ClockEventSchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    return ok({ shift: await clockOut(orgId, auth!.sub, body ?? {}) });
  },
);

export const handleListTodayAttendance = createHandler(
  {
    tag: 'Attendance:Today',
    auth: 'jwt',
    permission: 'attendance.read',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async ({ auth }) => {
    const orgId = requireOrg(auth);
    return ok({ shifts: await listTodayAttendance(orgId) });
  },
);

export const handleListKioskClockableStaff = createHandler(
  {
    tag: 'Attendance:KioskStaff',
    auth: 'jwt',
    permission: 'attendance.kiosk',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async ({ auth }) => {
    const orgId = requireOrg(auth);
    return ok({ staff: await listClockableStaffForKiosk(orgId) });
  },
);

export const handleKioskClockIn = createHandler(
  {
    tag: 'Attendance:KioskClockIn',
    auth: 'jwt',
    permission: 'attendance.kiosk',
    rateLimit: { max: 30, windowMs: 60_000 },
    body: KioskClockEventSchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    return ok({ shift: await kioskClockIn(orgId, body!.userId, body!.pin, body ?? {}) });
  },
);

export const handleKioskClockOut = createHandler(
  {
    tag: 'Attendance:KioskClockOut',
    auth: 'jwt',
    permission: 'attendance.kiosk',
    rateLimit: { max: 30, windowMs: 60_000 },
    body: KioskClockEventSchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    return ok({ shift: await kioskClockOut(orgId, body!.userId, body!.pin, body ?? {}) });
  },
);

export const handleCorrectAttendanceShift = createHandler(
  {
    tag: 'Attendance:Correct',
    auth: 'jwt',
    permission: 'attendance.correct',
    requireMfa: true,
    rateLimit: { max: 20, windowMs: 60_000 },
    body: CorrectionSchema,
  },
  async ({ auth, body, req }) => {
    const orgId = requireOrg(auth);
    return ok({ shift: await correctAttendanceShift(orgId, shiftIdFromUrl(req), auth!.sub, body!) });
  },
);
