/**
 * GET  /api/org/email-settings — get org sender email settings + default header
 * PUT  /api/org/email-settings — update org sender email settings + default header
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import { identityService } from '@modules/supporting/identity/application/identity.service';

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

// ── GET ──────────────────────────────────────────────────────────────────────

export const GET = createHandler(
  { auth: 'jwt', tag: 'Org:EmailSettings:Get', rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const org = await identityService.getOrg(payload.orgId);
    if (!org) throw Errors.notFound('Organization not found');

    return ok({
      senderEmail: org.senderEmail ?? null,
      senderName: org.senderName ?? null,
      emailHeaderConfig: org.emailHeaderConfig ?? null,
    });
  },
);

// ── PUT ──────────────────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  senderEmail: z.string().email().max(254).nullable().optional(),
  senderName: z.string().max(100).nullable().optional(),
  emailHeaderConfig: z.string().max(5_000).nullable().optional(),
});

export const PUT = createHandler(
  { auth: 'jwt', tag: 'Org:EmailSettings:Update', body: UpdateBodySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const org = await identityService.updateOrgEmailSettings(payload.orgId, {
      senderEmail: body.senderEmail,
      senderName: body.senderName,
      emailHeaderConfig: body.emailHeaderConfig,
    });

    return ok({
      senderEmail: org.senderEmail ?? null,
      senderName: org.senderName ?? null,
      emailHeaderConfig: org.emailHeaderConfig ?? null,
    });
  },
);
