/**
 * Compliance API handlers — colocated with the compliance module.
 *
 * All handlers use createHandler from @platform/api which provides:
 *   - JWT authentication (+ requireMfa)
 *   - Rate limiting
 *   - Zod validation
 *   - RFC 9110 / 9457 compliant error responses
 *
 * app/api/admin/compliance/ routes are thin re-export wrappers that point here.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, created, noContent, paginated } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  listControlsWithStatus,
  getControlWithEvidence,
} from '../../application/compliance.service';
import { collectAllEvidence } from '../../application/evidence.service';
import { createRisk, updateRisk, deleteRisk, listRisks } from '../../application/risk.service';
import { createPolicy, updatePolicy, deletePolicy, listPolicies } from '../../application/policy.service';
import { buildEvidencePackage } from '../../application/report.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7)
    ?? req.cookies.get('token')?.value
    ?? '';
}

async function requireAdmin(req: NextRequest): Promise<{ orgId: string; userId: string }> {
  const payload = await verifyToken(extractToken(req));
  const isAdmin = payload.roles.includes('super_admin') || payload.roles.includes('admin');
  if (!isAdmin) throw Errors.forbidden('Admin role required');
  if (!payload.orgId) throw Errors.forbidden('Organization context required');
  return { orgId: payload.orgId, userId: payload.sub };
}

// ── Controls ─────────────────────────────────────────────────────────────────

export const handleListControls = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Controls', requireMfa: true, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const { orgId } = await requireAdmin(req);
    const controls = await listControlsWithStatus(orgId);
    return ok({ controls, total: controls.length });
  },
);

// ── Control Evidence ─────────────────────────────────────────────────────────

const ControlEvidenceQuery = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const handleControlEvidence = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:ControlEvidence', requireMfa: true, query: ControlEvidenceQuery, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req, query } = ctx as { req: NextRequest; query: { limit?: number } };
    const { orgId } = await requireAdmin(req);
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf('controls') + 1];
    const result = await getControlWithEvidence(id, orgId, query?.limit ?? 20);
    if (!result) throw Errors.notFound('Control not found');
    return ok(result);
  },
);

// ── Evidence Collection ──────────────────────────────────────────────────────

export const handleCollectEvidence = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Evidence:Collect', requireMfa: true, rateLimit: { max: 5, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const { orgId, userId } = await requireAdmin(req);
    const summary = await collectAllEvidence(orgId, userId);
    return ok(summary);
  },
);

// ── Report ───────────────────────────────────────────────────────────────────

export const handleComplianceReport = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Report', requireMfa: true, rateLimit: { max: 5, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const { orgId } = await requireAdmin(req);
    const pkg = await buildEvidencePackage(orgId);
    const date = new Date().toISOString().split('T')[0];
    return {
      ...ok(pkg),
      headers: { 'Content-Disposition': `attachment; filename="iso27001-evidence-${date}.json"` },
    };
  },
);

// ── Risks List/Create ────────────────────────────────────────────────────────

const RiskQuerySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'accepted']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const CreateRiskSchema = z.object({
  asset: z.string().min(1).max(500),
  threat: z.string().min(1).max(500),
  vulnerability: z.string().min(1).max(500),
  likelihood: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  treatment: z.enum(['accept', 'mitigate', 'transfer', 'avoid']),
  treatmentDesc: z.string().max(2000).optional(),
  owner: z.string().max(200).optional(),
  dueDate: z.string().datetime().optional(),
});

export const handleListRisks = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Risks:List', requireMfa: true, query: RiskQuerySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req, query } = ctx as { req: NextRequest; query: z.infer<typeof RiskQuerySchema> };
    const { orgId } = await requireAdmin(req);
    const limit = query?.limit ?? 50;
    const offset = query?.offset ?? 0;
    const { items, total } = await listRisks(orgId, { status: query?.status, limit, offset });
    return paginated(items, { total, count: items.length, hasNext: offset + limit < (total ?? 0), hasPrev: offset > 0 });
  },
);

export const handleCreateRisk = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Risks:Create', requireMfa: true, body: CreateRiskSchema, rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { req, body } = ctx as { req: NextRequest; body: z.infer<typeof CreateRiskSchema> };
    const { orgId, userId } = await requireAdmin(req);
    const risk = await createRisk({
      organizationId: orgId,
      asset: body.asset, threat: body.threat, vulnerability: body.vulnerability,
      likelihood: body.likelihood, impact: body.impact, treatment: body.treatment,
      treatmentDesc: body.treatmentDesc, owner: body.owner,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      createdBy: userId,
    });
    return created(risk, `/api/admin/compliance/risks/${risk.id}`);
  },
);

// ── Risk Update/Delete ───────────────────────────────────────────────────────

const PatchRiskSchema = z.object({
  asset: z.string().min(1).max(500).optional(),
  threat: z.string().min(1).max(500).optional(),
  vulnerability: z.string().min(1).max(500).optional(),
  likelihood: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  treatment: z.enum(['accept', 'mitigate', 'transfer', 'avoid']).optional(),
  treatmentDesc: z.string().max(2000).nullable().optional(),
  owner: z.string().max(200).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'accepted']).optional(),
});

function extractRiskId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/');
  return segments[segments.indexOf('risks') + 1];
}

export const handleUpdateRisk = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Risks:Update', requireMfa: true, body: PatchRiskSchema, rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { req, body } = ctx as { req: NextRequest; body: z.infer<typeof PatchRiskSchema> };
    const { orgId } = await requireAdmin(req);
    const id = extractRiskId(req);
    const { dueDate: dueDateStr, ...rest } = body;
    const dueDate: Date | null | undefined = dueDateStr ? new Date(dueDateStr) : dueDateStr === null ? null : undefined;
    const updated = await updateRisk(id, orgId, { ...rest, dueDate });
    if (!updated) throw Errors.notFound('Risk not found');
    return ok(updated);
  },
);

export const handleDeleteRisk = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Risks:Delete', requireMfa: true, rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const { orgId } = await requireAdmin(req);
    const id = extractRiskId(req);
    const deleted = await deleteRisk(id, orgId);
    if (!deleted) throw Errors.notFound('Risk not found');
    return noContent();
  },
);

// ── Policies List/Create ─────────────────────────────────────────────────────

const PolicyQuerySchema = z.object({
  status: z.enum(['draft', 'active', 'retired']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const CreatePolicySchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  content: z.string().max(100_000),
  version: z.string().max(20).optional(),
  reviewCycleDays: z.number().int().min(30).max(730).optional(),
  owner: z.string().max(200).optional(),
});

export const handleListPolicies = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Policies:List', requireMfa: true, query: PolicyQuerySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req, query } = ctx as { req: NextRequest; query: z.infer<typeof PolicyQuerySchema> };
    const { orgId } = await requireAdmin(req);
    const limit = query?.limit ?? 50;
    const offset = query?.offset ?? 0;
    const { items, total } = await listPolicies(orgId, { status: query?.status, limit, offset });
    return paginated(items, { total, count: items.length, hasNext: offset + limit < (total ?? 0), hasPrev: offset > 0 });
  },
);

export const handleCreatePolicy = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Policies:Create', requireMfa: true, body: CreatePolicySchema, rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { req, body } = ctx as { req: NextRequest; body: z.infer<typeof CreatePolicySchema> };
    const { orgId, userId } = await requireAdmin(req);
    const policy = await createPolicy({
      organizationId: orgId,
      name: body.name, category: body.category, content: body.content,
      version: body.version, reviewCycleDays: body.reviewCycleDays, owner: body.owner,
      createdBy: userId,
    });
    return created(policy, `/api/admin/compliance/policies/${policy.id}`);
  },
);

// ── Policy Update/Delete ─────────────────────────────────────────────────────

const PatchPolicySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  content: z.string().max(100_000).optional(),
  version: z.string().max(20).optional(),
  reviewCycleDays: z.number().int().min(30).max(730).optional(),
  nextReviewDate: z.string().datetime().nullable().optional(),
  owner: z.string().max(200).nullable().optional(),
  approvedBy: z.string().uuid().nullable().optional(),
  status: z.enum(['draft', 'active', 'retired']).optional(),
});

function extractPolicyId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/');
  return segments[segments.indexOf('policies') + 1];
}

export const handleUpdatePolicy = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Policies:Update', requireMfa: true, body: PatchPolicySchema, rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { req, body } = ctx as { req: NextRequest; body: z.infer<typeof PatchPolicySchema> };
    const { orgId } = await requireAdmin(req);
    const id = extractPolicyId(req);
    const { nextReviewDate: nrdStr, approvedBy, ...rest } = body;
    const nextReviewDate: Date | null | undefined = nrdStr ? new Date(nrdStr) : nrdStr === null ? null : undefined;
    const updates = { ...rest, nextReviewDate, approvedAt: approvedBy ? new Date() : undefined, approvedBy: approvedBy ?? undefined };
    const updated = await updatePolicy(id, orgId, updates);
    if (!updated) throw Errors.notFound('Policy not found');
    return ok(updated);
  },
);

export const handleDeletePolicy = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Policies:Delete', requireMfa: true, rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const { orgId } = await requireAdmin(req);
    const id = extractPolicyId(req);
    const deleted = await deletePolicy(id, orgId);
    if (!deleted) throw Errors.notFound('Policy not found');
    return noContent();
  },
);
