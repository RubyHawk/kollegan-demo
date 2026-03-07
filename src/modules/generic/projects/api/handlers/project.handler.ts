/**
 * Projects API handlers — colocated with the projects module.
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
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
} from '../../application/project.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function requireStaff(roles: string[], orgId: string | null) {
  if (!orgId) throw Errors.forbidden('No organization context');
  if (!roles.some((r) => ['super_admin', 'admin', 'user'].includes(r)))
    throw Errors.forbidden('Projects access requires staff role');
}

function extractId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.indexOf('projects') + 1] ?? '';
}

async function extractAuth(req: NextRequest) {
  const token =
    req.headers.get('authorization')?.slice(7) ??
    req.cookies.get('token')?.value ??
    '';
  return verifyToken(token);
}

// ── List Projects ───────────────────────────────────────────────────────────

const GetQuerySchema = z.object({
  status: z.enum(['active', 'review', 'planned', 'done', 'archived']).optional(),
  search: z.string().max(100).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const handleListProjects = createHandler(
  { auth: 'jwt', tag: 'Projects:List', query: GetQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof GetQuerySchema>; req: NextRequest };
    const payload = await extractAuth(req);
    requireStaff(payload.roles, payload.orgId ?? null);

    const { projects, total } = await listProjects(payload.orgId!, {
      status: query.status,
      search: query.search,
      limit:  query.limit,
      offset: query.offset,
    });

    return ok({ projects, total, limit: query.limit, offset: query.offset });
  },
);

// ── Create Project ──────────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status:      z.enum(['active', 'review', 'planned', 'done', 'archived']).default('active'),
  priority:    z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  progress:    z.number().int().min(0).max(100).default(0),
  ownerId:     z.string().uuid().optional(),
  dueDate:     z.string().datetime().optional(),
  startDate:   z.string().datetime().optional(),
  tags:        z.array(z.string().max(50)).max(20).default([]),
});

export const handleCreateProject = createHandler(
  { auth: 'jwt', tag: 'Projects:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await extractAuth(req);
    requireStaff(payload.roles, payload.orgId ?? null);

    const project = await createProject(
      {
        organizationId: payload.orgId!,
        name:           body.name,
        description:    body.description,
        status:         body.status,
        priority:       body.priority,
        progress:       body.progress,
        ownerId:        body.ownerId,
        dueDate:        body.dueDate   ? new Date(body.dueDate)   : undefined,
        startDate:      body.startDate ? new Date(body.startDate) : undefined,
        tags:           body.tags,
      },
      payload.sub,
    );

    return created({ project });
  },
);

// ── Get Project ─────────────────────────────────────────────────────────────

export const handleGetProject = createHandler(
  { auth: 'jwt', tag: 'Projects:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id  = extractId(req);
    const payload = await extractAuth(req);
    requireStaff(payload.roles, payload.orgId ?? null);

    const project = await getProject(id, payload.orgId!);
    if (!project) throw Errors.notFound('Project not found');
    return ok({ project });
  },
);

// ── Update Project ──────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  name:        z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status:      z.enum(['active', 'review', 'planned', 'done', 'archived']).optional(),
  priority:    z.enum(['low', 'medium', 'high', 'critical']).optional(),
  progress:    z.number().int().min(0).max(100).optional(),
  ownerId:     z.string().uuid().optional().nullable(),
  dueDate:     z.string().datetime().optional().nullable(),
  startDate:   z.string().datetime().optional().nullable(),
  tags:        z.array(z.string().max(50)).max(20).optional(),
});

export const handleUpdateProject = createHandler(
  { auth: 'jwt', tag: 'Projects:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as unknown as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await extractAuth(req);
    requireStaff(payload.roles, payload.orgId ?? null);

    const project = await updateProject(id, payload.orgId!, {
      ...(body.name        !== undefined ? { name: body.name }               : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.status      !== undefined ? { status: body.status }           : {}),
      ...(body.priority    !== undefined ? { priority: body.priority }       : {}),
      ...(body.progress    !== undefined ? { progress: body.progress }       : {}),
      ...(body.ownerId     !== undefined ? { ownerId: body.ownerId }         : {}),
      ...(body.dueDate     !== undefined ? { dueDate: body.dueDate ? new Date(body.dueDate) : null }     : {}),
      ...(body.startDate   !== undefined ? { startDate: body.startDate ? new Date(body.startDate) : null } : {}),
      ...(body.tags        !== undefined ? { tags: body.tags }               : {}),
    });
    if (!project) throw Errors.notFound('Project not found');
    return ok({ project });
  },
);

// ── Delete Project ──────────────────────────────────────────────────────────

export const handleDeleteProject = createHandler(
  { auth: 'jwt', tag: 'Projects:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id  = extractId(req);
    const payload = await extractAuth(req);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const deleted = await deleteProject(id, payload.orgId);
    if (!deleted) throw Errors.notFound('Project not found');
    return noContent();
  },
);
