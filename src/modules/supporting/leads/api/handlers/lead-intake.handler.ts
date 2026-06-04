import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createHandler } from '@platform/api/handler';
import { ok, created, noContent } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import { logger } from '@platform/logging/logger';
import {
  DEFAULT_FRAMER_FIELD_CONFIG,
  coerceFieldConfig,
} from '../../application/lead-intake-parser';
import {
  createLeadIntakeForwarder,
  deactivateLeadIntakeForwarder,
  listLeadIntakeForwarders,
  processResendInboundEmail,
  updateLeadIntakeForwarder,
  userCanAccessCompany,
  userCanManageCompany,
} from '../../application/lead-intake.service';

const TAG = 'LeadIntakeHandler';

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  if (payload.userType !== 'staff') throw Errors.forbidden('Staff access required');
  return payload;
}

function extractCompanyId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  return parts[parts.indexOf('companies') + 1] ?? '';
}

function extractForwarderId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  return parts[parts.indexOf('lead-intake-forwarders') + 1] ?? '';
}

const FieldMappingSchema = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(120),
  target: z.enum(['name', 'email', 'phone', 'address', 'postalCode', 'requestedService', 'message', 'referralSource', 'custom']),
  required: z.boolean().optional(),
  order: z.number().int().min(0).max(10_000),
});

const FieldConfigSchema = z.object({
  version: z.literal(1),
  fields: z.array(FieldMappingSchema).min(1).max(40),
});

const SaveForwarderSchema = z.object({
  name: z.string().min(1).max(160),
  sourceLabel: z.string().min(1).max(160),
  intakeAddress: z.string().email().max(254),
  senderEmail: z.string().email().max(254).nullable().optional(),
  senderName: z.string().max(120).nullable().optional(),
  fieldConfig: FieldConfigSchema.optional(),
  isActive: z.boolean().optional(),
  recipientUserIds: z.array(z.string().uuid()).max(50).default([]),
});

const UpdateForwarderSchema = SaveForwarderSchema.partial().extend({
  recipientUserIds: z.array(z.string().uuid()).max(50).optional(),
});

export const handleListLeadIntakeForwarders = createHandler(
  { auth: 'jwt', tag: 'LeadIntake:List', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as { req: NextRequest }).req;
    const companyId = extractCompanyId(req);
    const payload = await requireStaff(req);
    if (!await userCanAccessCompany(companyId, payload.orgId!, payload.sub, payload.roles)) {
      throw Errors.forbidden('Company access required');
    }
    const forwarders = await listLeadIntakeForwarders(companyId, payload.orgId!);
    return ok({ forwarders, defaultFieldConfig: DEFAULT_FRAMER_FIELD_CONFIG });
  },
);

export const handleCreateLeadIntakeForwarder = createHandler(
  {
    auth: 'jwt',
    tag: 'LeadIntake:Create',
    body: SaveForwarderSchema,
    rateLimit: { max: 30, windowMs: 60_000 },
  },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof SaveForwarderSchema>; req: NextRequest };
    const companyId = extractCompanyId(req);
    const payload = await requireStaff(req);
    if (!await userCanManageCompany(companyId, payload.orgId!, payload.sub, payload.roles)) {
      throw Errors.forbidden('Company admin access required');
    }
    try {
      const forwarder = await createLeadIntakeForwarder({
        organizationId: payload.orgId!,
        companyId,
        actorId: payload.sub,
        name: body.name,
        sourceLabel: body.sourceLabel,
        intakeAddress: body.intakeAddress,
        senderEmail: body.senderEmail,
        senderName: body.senderName,
        fieldConfig: coerceFieldConfig(body.fieldConfig),
        isActive: body.isActive,
        recipientUserIds: body.recipientUserIds,
      });
      return created({ forwarder });
    } catch (err) {
      if ((err as { code?: string }).code === 'INVALID_RECIPIENT') {
        throw Errors.validation('Recipient users must belong to the company', []);
      }
      throw err;
    }
  },
);

export const handleUpdateLeadIntakeForwarder = createHandler(
  {
    auth: 'jwt',
    tag: 'LeadIntake:Update',
    body: UpdateForwarderSchema,
    rateLimit: { max: 30, windowMs: 60_000 },
  },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateForwarderSchema>; req: NextRequest };
    const companyId = extractCompanyId(req);
    const forwarderId = extractForwarderId(req);
    const payload = await requireStaff(req);
    if (!await userCanManageCompany(companyId, payload.orgId!, payload.sub, payload.roles)) {
      throw Errors.forbidden('Company admin access required');
    }
    const forwarder = await updateLeadIntakeForwarder(forwarderId, {
      organizationId: payload.orgId!,
      companyId,
      name: body.name,
      sourceLabel: body.sourceLabel,
      intakeAddress: body.intakeAddress,
      senderEmail: body.senderEmail,
      senderName: body.senderName,
      fieldConfig: body.fieldConfig ? coerceFieldConfig(body.fieldConfig) : undefined,
      isActive: body.isActive,
      recipientUserIds: body.recipientUserIds,
    });
    if (!forwarder) throw Errors.notFound('Lead intake forwarder not found');
    return ok({ forwarder });
  },
);

export const handleDeactivateLeadIntakeForwarder = createHandler(
  { auth: 'jwt', tag: 'LeadIntake:Deactivate', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as { req: NextRequest }).req;
    const companyId = extractCompanyId(req);
    const forwarderId = extractForwarderId(req);
    const payload = await requireStaff(req);
    if (!await userCanManageCompany(companyId, payload.orgId!, payload.sub, payload.roles)) {
      throw Errors.forbidden('Company admin access required');
    }
    const deleted = await deactivateLeadIntakeForwarder(forwarderId, companyId, payload.orgId!);
    if (!deleted) throw Errors.notFound('Lead intake forwarder not found');
    return noContent();
  },
);

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is required for inbound email processing');
  return new Resend(key);
}

export async function handleResendInboundWebhook(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error(TAG, 'RESEND_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  try {
    const payload = await req.text();
    const id = req.headers.get('svix-id');
    const timestamp = req.headers.get('svix-timestamp');
    const signature = req.headers.get('svix-signature');
    if (!id || !timestamp || !signature) {
      return NextResponse.json({ error: 'Missing webhook signature headers' }, { status: 400 });
    }

    const resend = getResend();
    let event: {
      type?: string;
      data?: {
        email_id?: string;
        message_id?: string;
        from?: string;
        to?: string[];
        subject?: string;
      };
    };
    try {
      event = resend.webhooks.verify({
        payload,
        headers: { id, timestamp, signature },
        webhookSecret,
      }) as typeof event;
    } catch (err) {
      logger.warn(TAG, 'Invalid Resend inbound webhook signature', { err });
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    if (event.type !== 'email.received' || !event.data?.email_id) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const { data: email, error } = await resend.emails.receiving.get(event.data.email_id);
    if (error) throw new Error(`Failed to fetch inbound email: ${error.message}`);

    const result = await processResendInboundEmail({
      providerEventId: id,
      providerEmailId: event.data.email_id,
      messageId: event.data.message_id,
      fromAddress: event.data.from,
      toAddresses: event.data.to ?? [],
      subject: event.data.subject,
      text: (email as { text?: string | null } | null)?.text,
      html: (email as { html?: string | null } | null)?.html,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error(TAG, 'Failed to process Resend inbound webhook', { err });
    return NextResponse.json({ error: 'Inbound webhook failed' }, { status: 500 });
  }
}
