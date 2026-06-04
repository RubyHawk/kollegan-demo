import { createHash } from 'node:crypto';
import { logger } from '@platform/logging/logger';
import {
  findOrCreateCustomerForLeadIntake,
  type Customer,
} from '@modules/supporting/customers';
import {
  fromAddress,
  getCompany,
  getCompanyMember,
  listCompanyMembers,
  sendEmail,
} from '@modules/supporting/offers';
import { addLeadActivity, createLead } from './leads.service';
import {
  DEFAULT_FRAMER_FIELD_CONFIG,
  coerceFieldConfig,
  normalizeEmail,
  normalizeIntakeAddress,
  normalizePhone,
  parseLeadIntakeEmail,
} from './lead-intake-parser';
import {
  leadIntakeRepository,
  type UpdateLeadIntakeForwarderInput,
  type UpsertLeadIntakeForwarderInput,
} from '../infrastructure/lead-intake.repository';
import type { LeadIntakeFieldConfig, LeadIntakeForwarder, ParsedLeadIntakeSubmission } from '../domain/lead-intake.entity';

const TAG = 'LeadIntakeService';

export interface SaveForwarderInput {
  organizationId: string;
  companyId: string;
  actorId: string;
  name: string;
  sourceLabel: string;
  intakeAddress: string;
  senderEmail?: string | null;
  senderName?: string | null;
  fieldConfig?: LeadIntakeFieldConfig;
  isActive?: boolean;
  recipientUserIds: string[];
}

export interface ResendInboundEmailInput {
  providerEventId?: string | null;
  providerEmailId?: string | null;
  messageId?: string | null;
  fromAddress?: string | null;
  toAddresses: string[];
  subject?: string | null;
  text?: string | null;
  html?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function htmlToText(html?: string | null): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function contentHash(input: ResendInboundEmailInput): string {
  return createHash('sha256')
    .update([
      input.providerEmailId ?? '',
      input.messageId ?? '',
      input.fromAddress ?? '',
      input.toAddresses.join(','),
      input.subject ?? '',
      input.text ?? '',
      input.html ?? '',
    ].join('\n'))
    .digest('hex');
}

async function assertCompanyExists(companyId: string, orgId: string) {
  const company = await getCompany(companyId, orgId);
  if (!company) throw Object.assign(new Error('Company not found'), { code: 'COMPANY_NOT_FOUND' });
  return company;
}

async function assertRecipientsAreCompanyMembers(companyId: string, orgId: string, recipientUserIds: string[]) {
  if (recipientUserIds.length === 0) return;
  const { members } = await listCompanyMembers(companyId, orgId);
  const memberIds = new Set(members.map((member) => member.userId));
  const invalid = recipientUserIds.filter((id) => !memberIds.has(id));
  if (invalid.length > 0) {
    throw Object.assign(new Error('Recipient is not a company member'), { code: 'INVALID_RECIPIENT' });
  }
}

function dedupeIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function leadLink(leadId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';
  return `${base}/crm/leads?search=${encodeURIComponent(leadId)}`;
}

function renderForwardHtml(input: {
  forwarder: LeadIntakeForwarder;
  parsed: ParsedLeadIntakeSubmission;
  customer: Customer | null;
  leadId: string;
}) {
  const rows: Array<[string, string | undefined | null]> = [
    ['Namn', input.parsed.name],
    ['Email', input.parsed.email],
    ['Telefon', input.parsed.phone],
    ['Adress', input.parsed.address],
    ['Postnummer', input.parsed.postalCode],
    ['Tjänst', input.parsed.requestedService],
    ['Meddelande', input.parsed.message],
    ['Hur hittade de er?', input.parsed.referralSource],
  ];
  for (const field of input.forwarder.fieldConfig.fields.filter((field) => field.target === 'custom')) {
    rows.push([field.label, input.parsed.customFields[field.key]]);
  }

  const bodyRows = rows
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `
      <tr>
        <th style="text-align:left;vertical-align:top;padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#475569;width:180px;">${escapeHtml(label)}</th>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#0f172a;white-space:pre-wrap;">${escapeHtml(String(value))}</td>
      </tr>
    `)
    .join('');

  const url = leadLink(input.leadId);
  const customerText = input.customer ? `Länkad kund: ${input.customer.name}` : 'Ingen kund kunde länkas automatiskt.';

  return `<!doctype html>
<html lang="sv">
  <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <main style="max-width:720px;margin:0 auto;padding:28px 18px;">
      <h1 style="font-size:22px;margin:0 0 8px;">Ny intresseanmälan</h1>
      <p style="margin:0 0 18px;color:#475569;">${escapeHtml(input.forwarder.sourceLabel)} · ${escapeHtml(customerText)}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        ${bodyRows}
      </table>
      <p style="margin:20px 0 0;">
        <a href="${escapeHtml(url)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;padding:10px 14px;font-weight:700;">Öppna lead i appen</a>
      </p>
    </main>
  </body>
</html>`;
}

async function forwardLeadEmail(input: {
  forwarder: LeadIntakeForwarder;
  parsed: ParsedLeadIntakeSubmission;
  customer: Customer | null;
  leadId: string;
}): Promise<{ status: 'sent' | 'partial' | 'failed' | 'skipped'; error?: string }> {
  const recipients = input.forwarder.recipients.filter((recipient) => recipient.email);
  if (recipients.length === 0) return { status: 'skipped', error: 'No recipient emails configured' };

  const from = fromAddress(input.forwarder.senderEmail ?? undefined, input.forwarder.senderName ?? `${input.forwarder.sourceLabel} Intresseanmälan`);
  const subjectName = input.parsed.name ? `: ${input.parsed.name}` : '';
  const subject = `Ny intresseanmälan${subjectName}`;
  const html = renderForwardHtml(input);

  let sent = 0;
  const errors: string[] = [];
  for (const recipient of recipients) {
    try {
      await sendEmail({ from, to: recipient.email, subject, html });
      sent++;
    } catch (err) {
      errors.push(`${recipient.email}: ${err instanceof Error ? err.message : String(err)}`);
      logger.warn(TAG, 'Failed to forward lead intake email', { err, recipientEmail: recipient.email });
    }
  }

  if (sent === recipients.length) return { status: 'sent' };
  if (sent > 0) return { status: 'partial', error: errors.join('; ') };
  return { status: 'failed', error: errors.join('; ') || 'Forwarding failed' };
}

export async function listLeadIntakeForwarders(companyId: string, orgId: string): Promise<LeadIntakeForwarder[]> {
  await assertCompanyExists(companyId, orgId);
  return leadIntakeRepository.listForwarders(companyId, orgId);
}

export async function createLeadIntakeForwarder(input: SaveForwarderInput): Promise<LeadIntakeForwarder> {
  await assertCompanyExists(input.companyId, input.organizationId);
  const recipientUserIds = dedupeIds(input.recipientUserIds);
  await assertRecipientsAreCompanyMembers(input.companyId, input.organizationId, recipientUserIds);

  const payload: UpsertLeadIntakeForwarderInput = {
    organizationId: input.organizationId,
    companyId: input.companyId,
    name: input.name,
    sourceLabel: input.sourceLabel,
    intakeAddress: input.intakeAddress,
    senderEmail: input.senderEmail,
    senderName: input.senderName,
    fieldConfig: coerceFieldConfig(input.fieldConfig ?? DEFAULT_FRAMER_FIELD_CONFIG),
    isActive: input.isActive,
    createdBy: input.actorId,
    recipientUserIds,
  };
  return leadIntakeRepository.createForwarder(payload);
}

export async function updateLeadIntakeForwarder(
  id: string,
  input: Partial<SaveForwarderInput> & { organizationId: string; companyId: string },
): Promise<LeadIntakeForwarder | null> {
  await assertCompanyExists(input.companyId, input.organizationId);
  let recipientUserIds: string[] | undefined;
  if (input.recipientUserIds) {
    recipientUserIds = dedupeIds(input.recipientUserIds);
    await assertRecipientsAreCompanyMembers(input.companyId, input.organizationId, recipientUserIds);
  }

  const payload: UpdateLeadIntakeForwarderInput = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.sourceLabel !== undefined ? { sourceLabel: input.sourceLabel } : {}),
    ...(input.intakeAddress !== undefined ? { intakeAddress: input.intakeAddress } : {}),
    ...(input.senderEmail !== undefined ? { senderEmail: input.senderEmail } : {}),
    ...(input.senderName !== undefined ? { senderName: input.senderName } : {}),
    ...(input.fieldConfig !== undefined ? { fieldConfig: coerceFieldConfig(input.fieldConfig) } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    ...(recipientUserIds !== undefined ? { recipientUserIds } : {}),
  };
  return leadIntakeRepository.updateForwarder(id, input.companyId, input.organizationId, payload);
}

export async function deactivateLeadIntakeForwarder(id: string, companyId: string, orgId: string): Promise<boolean> {
  return leadIntakeRepository.deactivateForwarder(id, companyId, orgId);
}

export async function userCanAccessCompany(companyId: string, orgId: string, userId: string, roles: string[]): Promise<boolean> {
  if (roles.includes('admin') || roles.includes('super_admin')) return Boolean(await getCompany(companyId, orgId));
  return Boolean(await getCompanyMember(companyId, userId));
}

export async function userCanManageCompany(companyId: string, orgId: string, userId: string, roles: string[]): Promise<boolean> {
  if (roles.includes('admin') || roles.includes('super_admin')) return Boolean(await getCompany(companyId, orgId));
  const membership = await getCompanyMember(companyId, userId);
  return membership?.role === 'admin';
}

export async function processResendInboundEmail(input: ResendInboundEmailInput): Promise<{ status: string; leadId?: string; duplicate?: boolean }> {
  const duplicate = await leadIntakeRepository.findMessageByProvider('resend', input.providerEventId, input.providerEmailId);
  if (duplicate) return { status: 'duplicate', leadId: duplicate.leadId ?? undefined, duplicate: true };

  const hash = contentHash(input);
  let forwarder: LeadIntakeForwarder | null = null;
  for (const address of input.toAddresses.map(normalizeIntakeAddress).filter(Boolean)) {
    forwarder = await leadIntakeRepository.findActiveForwarderByAddress('resend', address);
    if (forwarder) break;
  }

  const message = await leadIntakeRepository.createMessage({
    provider: 'resend',
    providerEventId: input.providerEventId,
    providerEmailId: input.providerEmailId,
    messageId: input.messageId,
    fromAddress: input.fromAddress,
    toAddresses: input.toAddresses.map(normalizeIntakeAddress),
    subject: input.subject,
    contentHash: hash,
    organizationId: forwarder?.organizationId ?? null,
    companyId: forwarder?.companyId ?? null,
    forwarderId: forwarder?.id ?? null,
    status: forwarder ? 'received' : 'ignored',
    forwardStatus: forwarder ? 'pending' : 'skipped',
    error: forwarder ? null : 'No active lead intake forwarder matched the recipient address',
  });

  if (!forwarder) {
    logger.warn(TAG, 'Inbound lead email ignored because no forwarder matched', { toAddresses: input.toAddresses });
    return { status: 'ignored' };
  }

  const bodyText = input.text?.trim() || htmlToText(input.html);
  const parsed = parseLeadIntakeEmail(bodyText, forwarder.fieldConfig);
  if (parsed.missingRequired.length > 0 || !parsed.name) {
    await leadIntakeRepository.updateMessage(message.id, {
      parsedFields: parsed as unknown as Record<string, unknown>,
      status: 'failed',
      forwardStatus: 'skipped',
      error: `Missing required fields: ${parsed.missingRequired.join(', ') || 'name'}`,
    });
    return { status: 'failed' };
  }

  const email = normalizeEmail(parsed.email);
  const normalizedPhone = normalizePhone(parsed.phone);
  const notes = parsed.message ?? undefined;
  const lead = await createLead({
    organizationId: forwarder.organizationId,
    companyId: forwarder.companyId,
    name: parsed.name,
    email: email ?? undefined,
    normalizedEmail: email ?? undefined,
    phone: parsed.phone,
    normalizedPhone: normalizedPhone ?? undefined,
    status: 'new',
    source: 'web_form',
    sourceLabel: forwarder.sourceLabel,
    address: parsed.address,
    postalCode: parsed.postalCode,
    requestedService: parsed.requestedService,
    referralSource: parsed.referralSource,
    customFields: parsed.customFields,
    notes,
  }, 'system');

  const { customer } = await findOrCreateCustomerForLeadIntake({
    organizationId: forwarder.organizationId,
    companyId: forwarder.companyId,
    leadId: lead.id,
    name: parsed.name,
    email,
    phone: parsed.phone,
    normalizedPhone,
    address: parsed.address,
    postalCode: parsed.postalCode,
    notes,
  });

  await addLeadActivity(
    lead.id,
    forwarder.organizationId,
    'email',
    `Ny intresseanmälan mottagen via ${forwarder.sourceLabel}. Skapa offert eller kontakta kunden.`,
    'system',
  );

  const forwardResult = await forwardLeadEmail({
    forwarder,
    parsed,
    customer,
    leadId: lead.id,
  });

  await leadIntakeRepository.updateMessage(message.id, {
    leadId: lead.id,
    customerId: customer?.id ?? null,
    parsedFields: parsed as unknown as Record<string, unknown>,
    status: 'parsed',
    forwardStatus: forwardResult.status,
    error: forwardResult.error ?? null,
  });

  logger.info(TAG, 'Lead intake email processed', {
    leadId: lead.id,
    customerId: customer?.id,
    forwardStatus: forwardResult.status,
  });
  return { status: 'parsed', leadId: lead.id };
}
