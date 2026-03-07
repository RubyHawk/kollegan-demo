/**
 * GET    /api/projects/[id]  — get project with tasks
 * PATCH  /api/projects/[id]  — update project
 * DELETE /api/projects/[id]  — soft-delete project
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, noContent } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { prisma } from '@core/database/prisma';

function extractId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.indexOf('projects') + 1] ?? '';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeProject(p: any) {
  return {
    ...p,
    createdAt: (p.createdAt as Date).toISOString(),
    updatedAt: (p.updatedAt as Date).toISOString(),
    dueDate:   p.dueDate   ? (p.dueDate   as Date).toISOString() : null,
    startDate: p.startDate ? (p.startDate as Date).toISOString() : null,
  };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export const GET = createHandler(
  { auth: 'jwt', tag: 'Projects:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id  = extractId(req);
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const project = await prisma.project.findFirst({
      where: { id, organizationId: payload.orgId, deletedAt: null },
      include: {
        tasks: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!project) throw Errors.notFound('Project not found');

    return ok({ project: serializeProject(project) });
  },
);

// ─── PATCH ────────────────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  name:        z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status:      z.enum(['active','review','planned','done','archived']).optional(),
  priority:    z.enum(['low','medium','high','critical']).optional(),
  progress:    z.number().int().min(0).max(100).optional(),
  ownerId:     z.string().uuid().optional().nullable(),
  dueDate:     z.string().datetime().optional().nullable(),
  startDate:   z.string().datetime().optional().nullable(),
  tags:        z.array(z.string().max(50)).max(20).optional(),
});

export const PATCH = createHandler(
  { auth: 'jwt', tag: 'Projects:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as unknown as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const existing = await prisma.project.findFirst({ where: { id, organizationId: payload.orgId, deletedAt: null } });
    if (!existing) throw Errors.notFound('Project not found');

    const project = await prisma.project.update({
      where: { id },
      data: {
        name:        body.name        ?? undefined,
        description: body.description !== undefined ? body.description : undefined,
        status:      body.status      ?? undefined,
        priority:    body.priority    ?? undefined,
        progress:    body.progress    !== undefined ? body.progress    : undefined,
        ownerId:     body.ownerId     !== undefined ? body.ownerId     : undefined,
        dueDate:     body.dueDate     !== undefined ? (body.dueDate     ? new Date(body.dueDate)     : null) : undefined,
        startDate:   body.startDate   !== undefined ? (body.startDate   ? new Date(body.startDate)   : null) : undefined,
        tags:        body.tags        ?? undefined,
      },
    });

    return ok({ project: serializeProject(project) });
  },
);

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const DELETE = createHandler(
  { auth: 'jwt', tag: 'Projects:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id  = extractId(req);
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const existing = await prisma.project.findFirst({ where: { id, organizationId: payload.orgId, deletedAt: null } });
    if (!existing) throw Errors.notFound('Project not found');

    await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });

    return noContent();
  },
);
