/**
 * GET  /api/projects  — list projects for the organization
 * POST /api/projects  — create a new project
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, created } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { prisma } from '@core/database/prisma';

// ─── GET ──────────────────────────────────────────────────────────────────────

const GetQuerySchema = z.object({
  status: z.enum(['active','review','planned','done','archived']).optional(),
  search: z.string().max(100).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const GET = createHandler(
  { auth: 'jwt', tag: 'Projects:List', query: GetQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof GetQuerySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { organizationId: payload.orgId, deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name:        { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take:  query.limit,
        skip:  query.offset,
        include: {
          tasks: { where: { deletedAt: null }, select: { id: true, status: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = projects.map((p: any) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      dueDate:   p.dueDate?.toISOString()   ?? null,
      startDate: p.startDate?.toISOString() ?? null,
      taskCount: p.tasks.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tasksDone: p.tasks.filter((t: any) => t.status === 'done').length,
      tasks: undefined,
    }));

    return ok({ projects: result, total });
  },
);

// ─── POST ─────────────────────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status:      z.enum(['active','review','planned','done','archived']).default('active'),
  priority:    z.enum(['low','medium','high','critical']).default('medium'),
  progress:    z.number().int().min(0).max(100).default(0),
  ownerId:     z.string().uuid().optional(),
  dueDate:     z.string().datetime().optional(),
  startDate:   z.string().datetime().optional(),
  tags:        z.array(z.string().max(50)).max(20).default([]),
});

export const POST = createHandler(
  { auth: 'jwt', tag: 'Projects:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isStaff = payload.roles.some((r) => ['super_admin', 'admin', 'user'].includes(r));
    if (!isStaff) throw Errors.forbidden('Staff role required');

    const project = await prisma.project.create({
      data: {
        organizationId: payload.orgId,
        name:        body.name,
        description: body.description ?? null,
        status:      body.status,
        priority:    body.priority,
        progress:    body.progress,
        ownerId:     body.ownerId ?? null,
        dueDate:     body.dueDate   ? new Date(body.dueDate)   : null,
        startDate:   body.startDate ? new Date(body.startDate) : null,
        tags:        body.tags,
        createdBy:   payload.sub,
      },
    });

    return created({
      project: {
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        dueDate:   project.dueDate?.toISOString()   ?? null,
        startDate: project.startDate?.toISOString() ?? null,
      },
    });
  },
);
