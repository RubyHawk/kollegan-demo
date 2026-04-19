import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  advanceProjectStage,
  countProjects,
  getProject,
  listProjects,
  updateProjectDetails,
} from '../../application/projects.service';

const ProjectStageSchema = z.enum(['details', 'ordered', 'arrived', 'in_progress', 'completed']);

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? req.cookies.get('token')?.value ?? '';
}

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  if (payload.userType !== 'staff' && !payload.roles.some((r) => ['super_admin', 'admin', 'user'].includes(r))) {
    throw Errors.forbidden('Staff role required');
  }
  return payload;
}

function extractProjectId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  const idx = parts.indexOf('projekt');
  return idx >= 0 ? parts[idx + 1] ?? '' : parts.at(-1) ?? '';
}

const StageQueryMap: Record<string, z.infer<typeof ProjectStageSchema>> = {
  uppgifter: 'details',
  bestallt: 'ordered',
  ankommet: 'arrived',
  pagar: 'in_progress',
  klart: 'completed',
};

function normalizeStage(value?: string): z.infer<typeof ProjectStageSchema> | undefined {
  if (!value) return undefined;
  return StageQueryMap[value] ?? (ProjectStageSchema.safeParse(value).success ? value as z.infer<typeof ProjectStageSchema> : undefined);
}

const ListQuerySchema = z.object({
  stage: z.string().optional(),
  search: z.string().max(100).optional(),
  customerId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const handleListProjects = createHandler(
  { auth: 'jwt', tag: 'Projects:List', query: ListQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof ListQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const stage = normalizeStage(query.stage);
    const result = await listProjects(payload.orgId!, {
      stage,
      search: query.search,
      customerId: query.customerId,
      limit: query.limit,
      offset: query.offset,
    });
    return ok({ projects: result.projects, total: result.total, limit: query.limit, offset: query.offset });
  },
);

const CountsQuerySchema = z.object({
  search: z.string().max(100).optional(),
  customerId: z.string().uuid().optional(),
});

export const handleProjectCounts = createHandler(
  { auth: 'jwt', tag: 'Projects:Counts', query: CountsQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof CountsQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const counts = await countProjects(payload.orgId!, query);
    return ok({ counts });
  },
);

export const handleGetProject = createHandler(
  { auth: 'jwt', tag: 'Projects:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await requireStaff(req);
    const project = await getProject(extractProjectId(req), payload.orgId!);
    if (!project) throw Errors.notFound('Project');
    return ok({ project });
  },
);

const DetailsBodySchema = z.object({
  siteAddress: z.string().max(300).optional().nullable(),
  sitePostalCode: z.string().max(30).optional().nullable(),
  siteCity: z.string().max(100).optional().nullable(),
  siteCountry: z.string().max(80).optional().nullable(),
  squareMeters: z.number().min(0).optional().nullable(),
  objectType: z.string().max(100).optional().nullable(),
  objectDescription: z.string().max(1000).optional().nullable(),
  accessNotes: z.string().max(2000).optional().nullable(),
  wishedInstallDate: z.string().datetime().optional().nullable(),
  wishedInstallDateText: z.string().max(200).optional().nullable(),
  onsiteContactName: z.string().max(200).optional().nullable(),
  onsiteContactPhone: z.string().max(50).optional().nullable(),
  onsiteContactEmail: z.string().email().optional().nullable(),
  internalNotes: z.string().max(5000).optional().nullable(),
});

export const handleUpdateProjectDetails = createHandler(
  { auth: 'jwt', tag: 'Projects:Details', body: DetailsBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof DetailsBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const { wishedInstallDate, ...detailsBody } = body;
    const normalizedWishedInstallDate = wishedInstallDate === undefined
      ? undefined
      : wishedInstallDate === null
        ? null
        : new Date(wishedInstallDate);
    const project = await updateProjectDetails(extractProjectId(req), payload.orgId!, {
      ...detailsBody,
      wishedInstallDate: normalizedWishedInstallDate,
    });
    if (!project) throw Errors.notFound('Project');
    return ok({ project });
  },
);

const AdvanceBodySchema = z.object({
  toStage: ProjectStageSchema,
});

export const handleAdvanceProjectStage = createHandler(
  { auth: 'jwt', tag: 'Projects:Advance', body: AdvanceBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof AdvanceBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    try {
      const project = await advanceProjectStage(extractProjectId(req), payload.orgId!, body.toStage, payload.sub);
      if (!project) throw Errors.notFound('Project');
      return ok({ project });
    } catch (err) {
      if ((err as { code?: string }).code === 'STAGE_BLOCKED') {
        throw Errors.unprocessable((err as Error).message);
      }
      throw err;
    }
  },
);
