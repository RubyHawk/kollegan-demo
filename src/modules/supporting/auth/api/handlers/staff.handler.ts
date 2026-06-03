import { z } from 'zod';
import { createHandler } from '@platform/api/handler';
import { Errors } from '@platform/api/errors';
import { created, ok } from '@platform/api/response';
import {
  createLegacyStaffUser,
  deleteLegacyStaffUser,
  listLegacyStaffUsers,
} from '../../application/staff-users.service';

// super_admin is a VPS-level role — never assignable through the app.
const APP_ASSIGNABLE_ROLES = ['receptionist', 'manager', 'admin'] as const;

const CreateStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  role: z.enum(APP_ASSIGNABLE_ROLES),
});

const DeleteQuerySchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export const handleListStaff = createHandler(
  {
    tag: 'Staff:List',
    auth: 'jwt',
    permission: 'users.read',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async () => {
    const users = await listLegacyStaffUsers();
    return ok({ users });
  },
);

function createStaffHandler(locationBase: string) {
  return createHandler(
    {
      tag: 'Staff:Create',
      auth: 'jwt',
      permission: 'users.write',
      rateLimit: { max: 20, windowMs: 60_000 },
      body: CreateStaffSchema,
    },
    async ({ body }) => {
      try {
        const user = await createLegacyStaffUser(body!);
        return created({ user }, `${locationBase}?id=${user.id}`);
      } catch (error) {
        const code = typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code?: string }).code
          : undefined;
        if (code === 'STAFF_EMAIL_EXISTS') {
          throw Errors.conflict('A user with this email already exists');
        }
        throw error;
      }
    },
  );
}

export const handleCreateStaff = createStaffHandler('/api/v1/staff');

export const handleDeleteStaff = createHandler(
  {
    tag: 'Staff:Delete',
    auth: 'jwt',
    permission: 'users.delete',
    rateLimit: { max: 20, windowMs: 60_000 },
    query: DeleteQuerySchema,
  },
  async ({ query }) => {
    await deleteLegacyStaffUser(query!.id);
    return ok(null);
  },
);
