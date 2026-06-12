import { z } from 'zod';
import { createHandler } from '@platform/api/handler';
import { Errors } from '@platform/api/errors';
import { created, ok } from '@platform/api/response';
import type { JWTPayload } from '@platform/auth/jwt';
import {
  createChecklistTask,
  listChecklistTasks,
  updateChecklistTask,
} from '../../application/task.service';

function requireOrg(payload: JWTPayload | null): string {
  if (!payload?.orgId) throw Errors.forbidden('Organization context required');
  return payload.orgId;
}

function taskIdFromUrl(req: Request): string {
  const id = new URL(req.url).pathname.split('/').filter(Boolean).at(-1);
  if (!id) throw Errors.badRequest('Task id is required');
  return id;
}

const ListQuerySchema = z.object({
  includeCompleted: z.enum(['true', 'false']).optional(),
});

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  area: z.string().max(80).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  assignedToUserId: z.string().nullable().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  area: z.string().max(80).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  assignedToUserId: z.string().nullable().optional(),
  completed: z.boolean().optional(),
});

export const handleListChecklistTasks = createHandler(
  {
    tag: 'Tasks:List',
    auth: 'jwt',
    permission: 'tasks.read',
    rateLimit: { max: 60, windowMs: 60_000 },
    query: ListQuerySchema,
  },
  async ({ auth, query }) => {
    const orgId = requireOrg(auth);
    const tasks = await listChecklistTasks(orgId, { includeCompleted: query?.includeCompleted === 'true' });
    return ok({ tasks });
  },
);

export const handleCreateChecklistTask = createHandler(
  {
    tag: 'Tasks:Create',
    auth: 'jwt',
    permission: 'tasks.write',
    rateLimit: { max: 40, windowMs: 60_000 },
    body: CreateTaskSchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    const task = await createChecklistTask(orgId, auth!.sub, body!);
    return created({ task }, `/api/v1/tasks/${task.id}`);
  },
);

export const handleUpdateChecklistTask = createHandler(
  {
    tag: 'Tasks:Update',
    auth: 'jwt',
    permission: 'tasks.write',
    rateLimit: { max: 60, windowMs: 60_000 },
    body: UpdateTaskSchema,
  },
  async ({ auth, body, req }) => {
    const orgId = requireOrg(auth);
    return ok({ task: await updateChecklistTask(orgId, taskIdFromUrl(req), auth!.sub, body!) });
  },
);
