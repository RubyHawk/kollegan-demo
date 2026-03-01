/**
 * POST /api/leads/:id/convert
 *
 * Convert a lead to a customer.
 * Body: { customerId } — an existing Customer ID in the CRM module.
 *       Pass the customerId after creating/looking up the customer via /api/ai/crm/update.
 *
 * Sets lead.status = 'won', lead.convertedAt, lead.customerId.
 * Publishes LEAD_CONVERTED domain event.
 *
 * Requires: JWT auth + admin role.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { convertLead } from '@modules/supporting/leads';

const BodySchema = z.object({
  customerId: z.string().min(1),
});

function extractId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.indexOf('leads') + 1] ?? '';
}

export const POST = createHandler(
  { auth: 'jwt', tag: 'Leads:Convert', body: BodySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as unknown as { body: z.infer<typeof BodySchema>; req: NextRequest };
    const id = extractId(req);

    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isAdmin = payload.roles.some((r) => ['super_admin','admin'].includes(r));
    if (!isAdmin) throw Errors.forbidden('Converting leads requires admin role');

    const lead = await convertLead(id, payload.orgId, body.customerId, payload.sub);
    if (!lead) throw Errors.notFound('Lead not found');

    return ok({ lead });
  },
);
