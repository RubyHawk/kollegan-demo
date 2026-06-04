import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import { getRecipientSuggestions } from '../../application/recipient-suggestions.service';

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

const QuerySchema = z.object({
  search: z.string().min(1).max(100),
  companyId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const handleRecipientSuggestions = createHandler(
  { auth: 'jwt', tag: 'Crm:RecipientSuggestions', query: QuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof QuerySchema>; req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');
    if (payload.userType !== 'staff') throw Errors.forbidden('Staff access required');

    const suggestions = await getRecipientSuggestions({
      organizationId: payload.orgId,
      userId: payload.sub,
      roles: payload.roles,
      search: query.search,
      companyId: query.companyId,
      limit: query.limit,
    });

    return ok({ suggestions });
  },
);
