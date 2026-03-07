import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@platform/database/prisma';
import { createHandler } from '@platform/api/handler';
import { Errors } from '@platform/api/errors';
import { ok, created } from '@platform/api/response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SALT_ROUNDS = 12;

const CreateStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  role: z.enum(['receptionist', 'manager', 'admin']),
});

const DeleteQuerySchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

/**
 * GET /api/staff
 * Returns all staff users. Requires JWT authentication.
 * passwordHash is intentionally excluded from all responses.
 *
 * Phase 2: replace StaffUser with User; add organizationId filter from JWT payload
 * so users can only see staff within their own organization.
 */
export const GET = createHandler(
  {
    tag: 'Staff:List',
    auth: 'jwt',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async () => {
    const users = await prisma.staffUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true, role: true, createdAt: true, lastLogin: true },
    });
    return ok({ users });
  }
);

/**
 * POST /api/staff
 * Creates a new staff user with a bcrypt-hashed password.
 * Requires JWT authentication.
 * Phase 2: add permission: 'users.write' + org-scoped creation via User table.
 */
export const POST = createHandler(
  {
    tag: 'Staff:Create',
    auth: 'jwt',
    rateLimit: { max: 20, windowMs: 60_000 },
    body: CreateStaffSchema,
  },
  async ({ body }) => {
    const existing = await prisma.staffUser.findUnique({ where: { email: body!.email } });
    if (existing) throw Errors.conflict('A user with this email already exists');

    const passwordHash = await bcrypt.hash(body!.password, SALT_ROUNDS);
    const user = await prisma.staffUser.create({
      data: { email: body!.email, passwordHash, role: body!.role },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return created({ user }, `/api/staff?id=${user.id}`);
  }
);

/**
 * DELETE /api/staff?id=<userId>
 * Deletes a staff user by ID. Requires JWT authentication.
 * Phase 2: add permission: 'users.delete' + verify target user is in same org.
 */
export const DELETE = createHandler(
  {
    tag: 'Staff:Delete',
    auth: 'jwt',
    rateLimit: { max: 20, windowMs: 60_000 },
    query: DeleteQuerySchema,
  },
  async ({ query }) => {
    await prisma.staffUser.delete({ where: { id: query!.id } });
    return ok(null);
  }
);
