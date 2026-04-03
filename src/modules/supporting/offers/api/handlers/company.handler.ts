/**
 * Company API handlers — selling entity / brand management.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, created } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import { companiesRepository } from '../../infrastructure/companies.repository';
import { upsertCompanyMember } from '../../application/company-members.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

function extractId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').at(-1) ?? '';
}

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  return payload;
}

function isOrgAdmin(payload: { roles: string[] }) {
  return payload.roles.includes('admin') || payload.roles.includes('super_admin');
}

function isValidCompanyLogoValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;

  return (
    /^https?:\/\/\S+$/i.test(trimmed) ||
    /^\/(?!\/)\S+$/.test(trimmed) ||
    /^data:image\/(?:png|jpeg|jpg|webp|avif|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)
  );
}

const CompanyLogoSchema = z
  .string()
  .max(3_000_000)
  .refine((value) => isValidCompanyLogoValue(value), {
    message: 'Loggan måste vara en bildlänk, en intern sökväg eller uppladdad bilddata.',
  });

async function requireCompanyAdmin(companyId: string, payload: Awaited<ReturnType<typeof requireStaff>>) {
  if (isOrgAdmin(payload)) return;
  const membership = await companiesRepository.getMember(companyId, payload.sub);
  if (!membership || membership.role !== 'admin') {
    throw Errors.forbidden('Du behöver vara företagsadmin för att hantera det här företaget');
  }
}

// ── List Companies ─────────────────────────────────────────────────────────────

const ListQuerySchema = z.object({
  search: z.string().max(100).optional(),
});

export const handleListCompanies = createHandler(
  { auth: 'jwt', tag: 'Companies:List', query: ListQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof ListQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const companies = await companiesRepository.list(payload.orgId!, query.search, {
      userId: payload.sub,
      restrictToMemberships: !isOrgAdmin(payload),
    });
    return ok({ companies });
  },
);

// ── Get Company ───────────────────────────────────────────────────────────────

export const handleGetCompany = createHandler(
  { auth: 'jwt', tag: 'Companies:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    const company = await companiesRepository.getById(id, payload.orgId!, {
      userId: payload.sub,
      restrictToMemberships: !isOrgAdmin(payload),
    });
    if (!company) throw Errors.notFound('Company not found');
    return ok(company);
  },
);

// ── Create Company ─────────────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  name:      z.string().min(1).max(300),
  orgNumber: z.string().max(20).optional(),
  website:   z.string().url().max(500).optional(),
  logoUrl:   CompanyLogoSchema.optional(),
  senderEmail: z.string().email().max(254).optional(),
  senderName: z.string().max(100).optional(),
  emailHeaderConfig: z.string().max(10_000).optional(),
  industry:  z.string().max(100).optional(),
  notes:     z.string().max(2000).optional(),
});

export const handleCreateCompany = createHandler(
  { auth: 'jwt', tag: 'Companies:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const company = await companiesRepository.create({
      organizationId: payload.orgId!,
      name:      body.name,
      orgNumber: body.orgNumber,
      website:   body.website,
      logoUrl:   body.logoUrl,
      senderEmail: body.senderEmail,
      senderName: body.senderName,
      emailHeaderConfig: body.emailHeaderConfig,
      industry:  body.industry,
      notes:     body.notes,
      createdBy: payload.sub,
    });
    await upsertCompanyMember(company.id, payload.orgId!, payload.sub, 'admin', payload.sub);
    return created(company, `/api/companies/${company.id}`);
  },
);

// ── Update Company ─────────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  name:      z.string().min(1).max(300).optional(),
  orgNumber: z.string().max(20).optional(),
  website:   z.string().url().max(500).optional().nullable(),
  logoUrl:   CompanyLogoSchema.optional().nullable(),
  senderEmail: z.string().email().max(254).optional().nullable(),
  senderName: z.string().max(100).optional().nullable(),
  emailHeaderConfig: z.string().max(10_000).optional().nullable(),
  industry:  z.string().max(100).optional(),
  notes:     z.string().max(2000).optional(),
});

export const handleUpdateCompany = createHandler(
  { auth: 'jwt', tag: 'Companies:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    await requireCompanyAdmin(id, payload);
    const updated = await companiesRepository.update(id, payload.orgId!, {
      ...body,
      website: body.website ?? undefined,
      logoUrl: body.logoUrl ?? undefined,
      senderEmail: body.senderEmail ?? undefined,
      senderName: body.senderName ?? undefined,
      emailHeaderConfig: body.emailHeaderConfig ?? undefined,
    });
    if (!updated) throw Errors.notFound('Company not found');
    return ok(updated);
  },
);

// ── Delete Company ─────────────────────────────────────────────────────────────

export const handleDeleteCompany = createHandler(
  { auth: 'jwt', tag: 'Companies:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    await requireCompanyAdmin(id, payload);
    const deleted = await companiesRepository.delete(id, payload.orgId!);
    if (!deleted) throw Errors.notFound('Company not found');
    return ok(null);
  },
);
