/**
 * Company API handlers — selling entity / brand management.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, created } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import type { JWTPayload } from '@platform/auth/jwt';
import { assertValidCustomFields } from '@modules/supporting/custom-fields';
import { companiesRepository } from '../../infrastructure/companies.repository';
import { upsertCompanyMember } from '../../application/company-members.service';
import { companyLocation } from './resource-location';

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').at(-1) ?? '';
}

function requireOrgContext(auth: JWTPayload | null): JWTPayload & { orgId: string } {
  if (!auth?.orgId) throw Errors.forbidden('No organization context');
  return auth as JWTPayload & { orgId: string };
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

function normalizeWebsiteValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const WebsiteSchema = z
  .string()
  .max(500)
  .transform((value) => normalizeWebsiteValue(value))
  .refine((value) => z.string().url().safeParse(value).success, {
    message: 'Webbplatsen måste vara en giltig adress, till exempel soleria.se eller https://soleria.se.',
  });

const OptionalWebsiteSchema = z.preprocess(
  (value) => (typeof value === 'string' && !value.trim() ? undefined : value),
  WebsiteSchema.optional(),
);

const NullableWebsiteSchema = z.preprocess(
  (value) => (typeof value === 'string' && !value.trim() ? null : value),
  WebsiteSchema.nullable().optional(),
);

async function requireCompanyAdmin(companyId: string, payload: JWTPayload & { orgId: string }) {
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
  {
    auth: 'jwt',
    permission: 'companies.read',
    tag: 'Companies:List',
    query: ListQuerySchema,
    rateLimit: { max: 120, windowMs: 60_000 },
  },
  async ({ auth, query }) => {
    const payload = requireOrgContext(auth);
    const companies = await companiesRepository.list(payload.orgId, (query as z.infer<typeof ListQuerySchema>).search);
    return ok({ companies });
  },
);

// ── Get Company ───────────────────────────────────────────────────────────────

export const handleGetCompany = createHandler(
  {
    auth: 'jwt',
    permission: 'companies.read',
    tag: 'Companies:Get',
    rateLimit: { max: 120, windowMs: 60_000 },
  },
  async ({ auth, req }) => {
    const payload = requireOrgContext(auth);
    const id = extractId(req);
    const company = await companiesRepository.getById(id, payload.orgId);
    if (!company) throw Errors.notFound('Company not found');
    return ok(company);
  },
);

// ── Create Company ─────────────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  name:      z.string().min(1).max(300),
  orgNumber: z.string().max(20).optional(),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  postalCode: z.string().max(30).optional(),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  website:   OptionalWebsiteSchema,
  logoUrl:   CompanyLogoSchema.optional(),
  senderEmail: z.string().email().max(254).optional(),
  senderName: z.string().max(100).optional(),
  emailHeaderConfig: z.string().max(10_000).optional(),
  industry:  z.string().max(100).optional(),
  notes:     z.string().max(2000).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export const handleCreateCompany = createHandler(
  {
    auth: 'jwt',
    permission: 'companies.write',
    tag: 'Companies:Create',
    body: CreateBodySchema,
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async ({ auth, body }) => {
    const payload = requireOrgContext(auth);
    const b = body as z.infer<typeof CreateBodySchema>;
    // Create validates against {} so a required field can't be bypassed by omitting it.
    await assertValidCustomFields(payload.orgId, 'company', b.customFields ?? {});
    const company = await companiesRepository.create({
      organizationId: payload.orgId,
      name:      b.name,
      orgNumber: b.orgNumber,
      addressLine1: b.addressLine1,
      addressLine2: b.addressLine2,
      postalCode: b.postalCode,
      city: b.city,
      region: b.region,
      country: b.country,
      website:   b.website,
      logoUrl:   b.logoUrl,
      senderEmail: b.senderEmail,
      senderName: b.senderName,
      emailHeaderConfig: b.emailHeaderConfig,
      industry:  b.industry,
      notes:     b.notes,
      customFields: b.customFields,
      createdBy: payload.sub,
    });
    await upsertCompanyMember(company.id, payload.orgId, payload.sub, 'admin', payload.sub);
    return created(company, companyLocation(company.id));
  },
);

// ── Update Company ─────────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  name:      z.string().min(1).max(300).optional(),
  orgNumber: z.string().max(20).optional(),
  addressLine1: z.string().max(200).optional().nullable(),
  addressLine2: z.string().max(200).optional().nullable(),
  postalCode: z.string().max(30).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  website:   NullableWebsiteSchema,
  logoUrl:   CompanyLogoSchema.optional().nullable(),
  senderEmail: z.string().email().max(254).optional().nullable(),
  senderName: z.string().max(100).optional().nullable(),
  emailHeaderConfig: z.string().max(10_000).optional().nullable(),
  industry:  z.string().max(100).optional(),
  notes:     z.string().max(2000).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export const handleUpdateCompany = createHandler(
  {
    auth: 'jwt',
    permission: 'companies.write',
    tag: 'Companies:Update',
    body: UpdateBodySchema,
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async ({ auth, body, req }) => {
    const payload = requireOrgContext(auth);
    const id = extractId(req);
    await requireCompanyAdmin(id, payload);
    const b = body as z.infer<typeof UpdateBodySchema>;
    await assertValidCustomFields(payload.orgId, 'company', b.customFields);
    const updated = await companiesRepository.update(id, payload.orgId, {
      ...b,
      addressLine1: b.addressLine1 ?? undefined,
      addressLine2: b.addressLine2 ?? undefined,
      postalCode: b.postalCode ?? undefined,
      city: b.city ?? undefined,
      region: b.region ?? undefined,
      country: b.country ?? undefined,
      website: b.website ?? undefined,
      logoUrl: b.logoUrl ?? undefined,
      senderEmail: b.senderEmail ?? undefined,
      senderName: b.senderName ?? undefined,
      emailHeaderConfig: b.emailHeaderConfig ?? undefined,
    });
    if (!updated) throw Errors.notFound('Company not found');
    return ok(updated);
  },
);

// ── Delete Company ─────────────────────────────────────────────────────────────

export const handleDeleteCompany = createHandler(
  {
    auth: 'jwt',
    permission: 'companies.delete',
    tag: 'Companies:Delete',
    rateLimit: { max: 30, windowMs: 60_000 },
  },
  async ({ auth, req }) => {
    const payload = requireOrgContext(auth);
    const id = extractId(req);
    await requireCompanyAdmin(id, payload);
    const deleted = await companiesRepository.delete(id, payload.orgId);
    if (!deleted) throw Errors.notFound('Company not found');
    return ok(null);
  },
);
