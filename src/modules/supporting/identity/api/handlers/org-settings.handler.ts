import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import { ok } from '@platform/api/response';
import { identityService } from '../../application/identity.service';
import type { ActiveNotificationTag, NotificationRecipient } from '../../domain/organization.entity';
import { ACTIVE_NOTIFICATION_TAGS, isActiveNotificationTag } from '../../domain/notification-routing';

function extractToken(req: NextRequest): string {
  const auth = req.headers.get('authorization') ?? '';
  return auth.toLowerCase().startsWith('bearer ')
    ? auth.slice(7)
    : req.cookies.get('at')?.value ?? '';
}

function isStaffUser(payload: Awaited<ReturnType<typeof verifyToken>>): boolean {
  return payload.userType === 'staff';
}

function canManageNotificationRouting(payload: Awaited<ReturnType<typeof verifyToken>>): boolean {
  return isStaffUser(payload);
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

const UpdateEmailSettingsBodySchema = z.object({
  senderEmail: z.string().email().max(254).nullable().optional(),
  senderName: z.string().max(100).nullable().optional(),
  emailHeaderConfig: z.string().max(5_000).nullable().optional(),
});

const RecipientSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().max(254),
  tags: z.array(
    z.enum(ACTIVE_NOTIFICATION_TAGS as unknown as [ActiveNotificationTag, ...ActiveNotificationTag[]]),
  ).min(1),
});

const UpdateNotificationRecipientsBodySchema = z.object({
  recipients: z.array(RecipientSchema).max(50),
});

export const handleGetOrgEmailSettings = createHandler(
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

export const handleUpdateOrgEmailSettings = createHandler(
  {
    auth: 'jwt',
    tag: 'Org:EmailSettings:Update',
    body: UpdateEmailSettingsBodySchema,
    rateLimit: { max: 30, windowMs: 60_000 },
  },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateEmailSettingsBodySchema>; req: NextRequest };
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

export const handleGetOrgNotificationRecipients = createHandler(
  { auth: 'jwt', tag: 'Org:NotificationRecipients:Get', rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');

    try {
      const org = await identityService.getOrg(payload.orgId);
      if (!org) throw Errors.notFound('Organization not found');
      return ok({
        recipients: parseRecipients(org.notificationRecipients),
        canManage: canManageNotificationRouting(payload),
      });
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err) throw err;
      return ok({ recipients: [], canManage: canManageNotificationRouting(payload) });
    }
  },
);

export const handleUpdateOrgNotificationRecipients = createHandler(
  {
    auth: 'jwt',
    tag: 'Org:NotificationRecipients:Update',
    body: UpdateNotificationRecipientsBodySchema,
    rateLimit: { max: 30, windowMs: 60_000 },
  },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateNotificationRecipientsBodySchema>; req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');
    if (!isStaffUser(payload)) throw Errors.forbidden('Only staff users can manage notification routing');

    try {
      const org = await identityService.updateOrgNotificationRecipients(
        payload.orgId,
        JSON.stringify(body.recipients),
      );
      return ok({ recipients: parseRecipients(org.notificationRecipients), canManage: true });
    } catch {
      throw Errors.internal('Kunde inte spara notifieringarna just nu. Kontrollera att databasen är migrerad och prova igen.');
    }
  },
);
