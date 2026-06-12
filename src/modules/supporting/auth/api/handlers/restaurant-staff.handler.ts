import { z } from 'zod';
import { createHandler } from '@platform/api/handler';
import { Errors } from '@platform/api/errors';
import { created, noContent, ok } from '@platform/api/response';
import type { JWTPayload } from '@platform/auth/jwt';
import {
  createRestaurantStaff,
  deactivateRestaurantStaff,
  listRestaurantStaff,
  resetRestaurantStaffPin,
  updateRestaurantStaff,
} from '../../application/restaurant-staff.service';

function requireOrg(payload: JWTPayload | null): string {
  if (!payload?.orgId) throw Errors.forbidden('Organization context required');
  return payload.orgId;
}

function staffIdFromUrl(req: Request): string {
  const pathname = new URL(req.url).pathname;
  const parts = pathname.split('/').filter(Boolean);
  const pinIndex = parts.indexOf('pin');
  const id = pinIndex > 0 ? parts[pinIndex - 1] : parts.at(-1);
  if (!id) throw Errors.badRequest('Restaurant staff id is required');
  return id;
}

const RestaurantRoleSchema = z.enum([
  'restaurant_owner',
  'restaurant_manager',
  'restaurant_staff',
  'restaurant_kitchen',
  'restaurant_accountant',
]);

const CreateRestaurantStaffSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).nullable().optional(),
  email: z.string().email().max(254).nullable().optional(),
  employeeCode: z.string().min(2).max(32),
  roles: z.array(RestaurantRoleSchema).min(1).max(5),
  pin: z.string().regex(/^\d{4,8}$/),
});

const UpdateRestaurantStaffSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().max(80).nullable().optional(),
  email: z.string().email().max(254).nullable().optional(),
  employeeCode: z.string().min(2).max(32).optional(),
  roles: z.array(RestaurantRoleSchema).min(1).max(5).optional(),
  isActive: z.boolean().optional(),
});

const ResetPinSchema = z.object({
  pin: z.string().regex(/^\d{4,8}$/),
});

export const handleListRestaurantStaff = createHandler(
  {
    tag: 'RestaurantStaff:List',
    auth: 'jwt',
    permission: 'users.read',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async ({ auth }) => {
    const orgId = requireOrg(auth);
    return ok({ staff: await listRestaurantStaff(orgId) });
  },
);

export const handleCreateRestaurantStaff = createHandler(
  {
    tag: 'RestaurantStaff:Create',
    auth: 'jwt',
    permission: 'users.write',
    rateLimit: { max: 30, windowMs: 60_000 },
    body: CreateRestaurantStaffSchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    const staff = await createRestaurantStaff(orgId, auth!.sub, auth!.roles ?? [], body!);
    return created({ staff }, `/api/v1/restaurant/staff/${staff.id}`);
  },
);

export const handleUpdateRestaurantStaff = createHandler(
  {
    tag: 'RestaurantStaff:Update',
    auth: 'jwt',
    permission: 'users.write',
    rateLimit: { max: 40, windowMs: 60_000 },
    body: UpdateRestaurantStaffSchema,
  },
  async ({ auth, body, req }) => {
    const orgId = requireOrg(auth);
    const staff = await updateRestaurantStaff(
      orgId,
      staffIdFromUrl(req),
      auth!.sub,
      auth!.roles ?? [],
      body!,
    );
    return ok({ staff });
  },
);

export const handleResetRestaurantStaffPin = createHandler(
  {
    tag: 'RestaurantStaff:ResetPin',
    auth: 'jwt',
    permission: 'users.write',
    rateLimit: { max: 20, windowMs: 60_000 },
    body: ResetPinSchema,
  },
  async ({ auth, body, req }) => {
    const orgId = requireOrg(auth);
    const staff = await resetRestaurantStaffPin(orgId, staffIdFromUrl(req), auth!.roles ?? [], body!);
    return ok({ staff });
  },
);

export const handleDeactivateRestaurantStaff = createHandler(
  {
    tag: 'RestaurantStaff:Deactivate',
    auth: 'jwt',
    permission: 'users.write',
    rateLimit: { max: 20, windowMs: 60_000 },
  },
  async ({ auth, req }) => {
    const orgId = requireOrg(auth);
    await deactivateRestaurantStaff(orgId, staffIdFromUrl(req), auth!.sub, auth!.roles ?? []);
    return noContent();
  },
);
