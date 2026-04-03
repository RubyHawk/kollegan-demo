import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  createCompanyMemberAccount,
  listCompanyMembers,
  removeCompanyMember,
  upsertCompanyMember,
} from '../../application/company-members.service';
import { companiesRepository } from '../../infrastructure/companies.repository';

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

function extractCompanyId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  return parts[parts.length - 2] ?? '';
}

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  return payload;
}

function isOrgAdmin(payload: { roles: string[] }) {
  return payload.roles.includes('admin') || payload.roles.includes('super_admin');
}

async function requireCompanyAccess(companyId: string, payload: Awaited<ReturnType<typeof requireStaff>>) {
  if (isOrgAdmin(payload)) return;
  const membership = await companiesRepository.getMember(companyId, payload.sub);
  if (!membership) throw Errors.forbidden('Du saknar åtkomst till det här företaget');
}

async function requireCompanyAdmin(companyId: string, payload: Awaited<ReturnType<typeof requireStaff>>) {
  if (isOrgAdmin(payload)) return;
  const membership = await companiesRepository.getMember(companyId, payload.sub);
  if (!membership || membership.role !== 'admin') {
    throw Errors.forbidden('Du behöver vara företagsadmin för att hantera kopplingar');
  }
}

export const handleListCompanyMembers = createHandler(
  { auth: 'jwt', tag: 'CompanyMembers:List', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await requireStaff(req);
    const companyId = extractCompanyId(req);
    await requireCompanyAccess(companyId, payload);
    const data = await listCompanyMembers(companyId, payload.orgId!);
    return ok(data);
  },
);

const ExistingMemberSchema = z.object({
  mode: z.literal('existing').optional(),
  userId: z.string().uuid(),
  role: z.enum(['staff', 'admin']).default('staff'),
});

const CreateAccountSchema = z.object({
  mode: z.literal('create'),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  role: z.enum(['staff', 'admin']).default('admin'),
});

const UpsertBodySchema = z.union([ExistingMemberSchema, CreateAccountSchema]);

export const handleUpsertCompanyMember = createHandler(
  { auth: 'jwt', tag: 'CompanyMembers:Upsert', body: UpsertBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { req, body } = ctx as { req: NextRequest; body: z.infer<typeof UpsertBodySchema> };
    const payload = await requireStaff(req);
    const companyId = extractCompanyId(req);
    await requireCompanyAdmin(companyId, payload);
    let member;
    try {
      member = 'userId' in body
        ? await upsertCompanyMember(companyId, payload.orgId!, body.userId, body.role, payload.sub)
        : await createCompanyMemberAccount(companyId, payload.orgId!, {
            email: body.email,
            password: body.password,
            firstName: body.firstName,
            lastName: body.lastName,
            role: body.role,
          }, payload.sub);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';
      if (code === 'EMAIL_ALREADY_EXISTS') {
        throw Errors.badRequest('Det finns redan ett konto med den här e-postadressen. Koppla det befintliga kontot i stället.');
      }
      if (code === 'DEFAULT_ROLE_MISSING') {
        throw Errors.badRequest('Standardrollen för nya användare saknas. Lägg till rollen "user" innan du skapar nya konton.');
      }
      throw error;
    }
    return ok(member);
  },
);

const DeleteQuerySchema = z.object({
  userId: z.string().uuid(),
});

export const handleDeleteCompanyMember = createHandler(
  { auth: 'jwt', tag: 'CompanyMembers:Delete', query: DeleteQuerySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { req, query } = ctx as { req: NextRequest; query: z.infer<typeof DeleteQuerySchema> };
    const payload = await requireStaff(req);
    const companyId = extractCompanyId(req);
    await requireCompanyAdmin(companyId, payload);
    const deleted = await removeCompanyMember(companyId, payload.orgId!, query.userId);
    if (!deleted) throw Errors.notFound('Company member not found');
    return ok(null);
  },
);
