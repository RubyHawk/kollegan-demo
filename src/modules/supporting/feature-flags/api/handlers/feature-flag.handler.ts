import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { created, noContent, ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  createFeatureFlag,
  deleteFeatureFlag,
  evaluateFeatureFlag,
  getFeatureFlag,
  listFeatureFlagAuditEvents,
  listFeatureFlags,
  updateFeatureFlag,
} from '../../application/feature-flags.service';

const FeatureFlagTypeSchema = z.enum(['release', 'kill_switch', 'experiment']);
const RolloutModeSchema = z.enum(['off', 'on', 'percentage', 'users']);
const RolloutScopeSchema = z.record(z.string(), z.unknown()).default({});

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? req.cookies.get('token')?.value ?? '';
}

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  const roles = payload.roles ?? [];
  if (payload.userType !== 'staff' && !roles.some((r) => ['super_admin', 'admin', 'user'].includes(r))) {
    throw Errors.forbidden('Staff role required');
  }
  return payload;
}

async function requireAdmin(req: NextRequest) {
  const payload = await requireStaff(req);
  const roles = payload.roles ?? [];
  if (!roles.some((r) => ['super_admin', 'admin'].includes(r))) {
    throw Errors.forbidden('Admin role required');
  }
  return payload;
}

function extractId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  const idx = parts.indexOf('feature-flags');
  return idx >= 0 ? parts[idx + 1] ?? '' : parts.at(-1) ?? '';
}

function parseDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

const ListQuerySchema = z.object({
  environment: z.string().max(80).optional(),
  search: z.string().max(100).optional(),
  includeExpired: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const handleListFeatureFlags = createHandler(
  { auth: 'jwt', tag: 'FeatureFlags:List', query: ListQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof ListQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const result = await listFeatureFlags(payload.orgId!, query);
    return ok({ flags: result.flags, total: result.total, limit: query.limit, offset: query.offset });
  },
);

const CreateBodySchema = z.object({
  key: z.string().min(1).max(120).regex(/^[a-z0-9][a-z0-9._-]*$/),
  description: z.string().max(1000).optional().nullable(),
  type: FeatureFlagTypeSchema.default('release'),
  owner: z.string().min(1).max(200),
  environment: z.string().min(1).max(80).default('production'),
  enabled: z.boolean().default(false),
  rolloutMode: RolloutModeSchema.default('off'),
  rolloutScope: RolloutScopeSchema,
  expiresAt: z.string().datetime().optional().nullable(),
});

export const handleCreateFeatureFlag = createHandler(
  { auth: 'jwt', tag: 'FeatureFlags:Create', body: CreateBodySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await requireAdmin(req);
    try {
      const flag = await createFeatureFlag({
        organizationId: payload.orgId!,
        key: body.key,
        description: body.description,
        type: body.type,
        owner: body.owner,
        environment: body.environment,
        enabled: body.enabled,
        rolloutMode: body.rolloutMode,
        rolloutScope: body.rolloutScope,
        expiresAt: parseDate(body.expiresAt) ?? null,
        createdBy: payload.sub,
      }, payload.sub);
      return created({ flag }, `/api/v1/feature-flags/${flag.id}`);
    } catch (err) {
      if ((err as { code?: string }).code === 'RELEASE_FLAG_REQUIRES_EXPIRY') {
        throw Errors.badRequest((err as Error).message);
      }
      throw err;
    }
  },
);

export const handleGetFeatureFlag = createHandler(
  { auth: 'jwt', tag: 'FeatureFlags:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await requireStaff(req);
    const flag = await getFeatureFlag(extractId(req), payload.orgId!);
    if (!flag) throw Errors.notFound('Feature flag');
    return ok({ flag });
  },
);

const UpdateBodySchema = CreateBodySchema.pick({
  description: true,
  type: true,
  owner: true,
  enabled: true,
  rolloutMode: true,
  rolloutScope: true,
  expiresAt: true,
}).partial();

export const handleUpdateFeatureFlag = createHandler(
  { auth: 'jwt', tag: 'FeatureFlags:Update', body: UpdateBodySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const payload = await requireAdmin(req);
    try {
      const flag = await updateFeatureFlag(extractId(req), payload.orgId!, {
        ...body,
        expiresAt: parseDate(body.expiresAt),
      }, payload.sub);
      if (!flag) throw Errors.notFound('Feature flag');
      return ok({ flag });
    } catch (err) {
      if ((err as { code?: string }).code === 'RELEASE_FLAG_REQUIRES_EXPIRY') {
        throw Errors.badRequest((err as Error).message);
      }
      throw err;
    }
  },
);

export const handleDeleteFeatureFlag = createHandler(
  { auth: 'jwt', tag: 'FeatureFlags:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await requireAdmin(req);
    const deleted = await deleteFeatureFlag(extractId(req), payload.orgId!, payload.sub);
    if (!deleted) throw Errors.notFound('Feature flag');
    return noContent();
  },
);

const EvaluateQuerySchema = z.object({
  key: z.string().min(1).max(120),
  environment: z.string().max(80).default('production'),
  contextKey: z.string().max(200).optional(),
});

export const handleEvaluateFeatureFlag = createHandler(
  { auth: 'jwt', tag: 'FeatureFlags:Evaluate', query: EvaluateQuerySchema, rateLimit: { max: 300, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof EvaluateQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const evaluation = await evaluateFeatureFlag({
      organizationId: payload.orgId!,
      key: query.key,
      environment: query.environment,
      userId: payload.sub,
      contextKey: query.contextKey,
    });
    return ok({ evaluation });
  },
);

const AuditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const handleListFeatureFlagAuditEvents = createHandler(
  { auth: 'jwt', tag: 'FeatureFlags:Audit', query: AuditQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof AuditQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const events = await listFeatureFlagAuditEvents(extractId(req), payload.orgId!, query);
    return ok({ events, limit: query.limit, offset: query.offset });
  },
);
