/**
 * GET  /api/org/notification-recipients — list notification routing recipients
 * PUT  /api/org/notification-recipients — replace full list
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import { identityService } from '@modules/supporting/identity/application/identity.service';
import type { NotificationRecipient } from '@modules/supporting/identity/domain/organization.entity';

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

const RecipientSchema = z.object({
  id:    z.string().uuid(),
  email: z.string().email().max(254),
  tags:  z.array(z.enum(['offer_signed', 'offer_declined'])).min(1),
});

const PutBodySchema = z.object({
  recipients: z.array(RecipientSchema).max(50),
});

// ── GET ───────────────────────────────────────────────────────────────────────

export const GET = createHandler(
  { auth: 'jwt', tag: 'Org:NotificationRecipients:Get', rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const org = await identityService.getOrg(payload.orgId);
    if (!org) throw Errors.notFound('Organization not found');

    let recipients: NotificationRecipient[] = [];
    try {
      recipients = org.notificationRecipients ? JSON.parse(org.notificationRecipients) : [];
    } catch {
      recipients = [];
    }

    return ok({ recipients });
  },
);

// ── PUT ───────────────────────────────────────────────────────────────────────

export const PUT = createHandler(
  { auth: 'jwt', tag: 'Org:NotificationRecipients:Update', body: PutBodySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof PutBodySchema>; req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const org = await identityService.updateOrgNotificationRecipients(
      payload.orgId,
      JSON.stringify(body.recipients),
    );

    let recipients: NotificationRecipient[] = [];
    try {
      recipients = org.notificationRecipients ? JSON.parse(org.notificationRecipients) : [];
    } catch {
      recipients = [];
    }

    return ok({ recipients });
  },
);
