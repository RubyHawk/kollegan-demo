/**
 * GET  /api/org/notification-recipients - list notification routing recipients
 * PUT  /api/org/notification-recipients - replace the full routing table
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import { identityService } from '@modules/supporting/identity/application/identity.service';
import type { ActiveNotificationTag, NotificationRecipient } from '@modules/supporting/identity/domain/organization.entity';
import { ACTIVE_NOTIFICATION_TAGS, isActiveNotificationTag } from '@modules/supporting/identity/domain/notification-routing';

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

function isStaffUser(payload: Awaited<ReturnType<typeof verifyToken>>): boolean {
  return payload.userType === 'staff';
}

function canManageNotificationRouting(payload: Awaited<ReturnType<typeof verifyToken>>): boolean {
  return payload.roles.some((role) => ['super_admin', 'admin', 'owner'].includes(role))
    || payload.role === 'admin';
}

function parseRecipients(serialized?: string | null): NotificationRecipient[] {
  if (!serialized) return [];

  try {
    const raw = JSON.parse(serialized);
    if (!Array.isArray(raw)) return [];

    return raw.flatMap((candidate) => {
      if (!candidate || typeof candidate !== 'object') return [];

      const value = candidate as {
        id?: string;
        email?: string;
        tags?: string[];
      };

      if (!value.id || !value.email || !Array.isArray(value.tags)) return [];

      const tags = value.tags.filter(isActiveNotificationTag);
      if (tags.length === 0) return [];

      return [{
        id: value.id,
        email: value.email,
        tags,
      }];
    });
  } catch {
    return [];
  }
}

const RecipientSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().max(254),
  tags: z.array(
    z.enum(ACTIVE_NOTIFICATION_TAGS as unknown as [ActiveNotificationTag, ...ActiveNotificationTag[]]),
  ).min(1),
});

const PutBodySchema = z.object({
  recipients: z.array(RecipientSchema).max(50),
});

export const GET = createHandler(
  { auth: 'jwt', tag: 'Org:NotificationRecipients:Get', rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');
    if (!isStaffUser(payload)) throw Errors.forbidden('Only staff users can view notification routing');

    const org = await identityService.getOrg(payload.orgId);
    if (!org) throw Errors.notFound('Organization not found');

    return ok({
      recipients: parseRecipients(org.notificationRecipients),
      canManage: canManageNotificationRouting(payload),
    });
  },
);

export const PUT = createHandler(
  { auth: 'jwt', tag: 'Org:NotificationRecipients:Update', body: PutBodySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof PutBodySchema>; req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');
    if (!isStaffUser(payload)) throw Errors.forbidden('Only staff users can manage notification routing');
    if (!canManageNotificationRouting(payload)) {
      throw Errors.forbidden('Only organization admins can change notification routing');
    }

    const org = await identityService.updateOrgNotificationRecipients(
      payload.orgId,
      JSON.stringify(body.recipients),
    );

    return ok({
      recipients: parseRecipients(org.notificationRecipients),
      canManage: true,
    });
  },
);
