import type { Company } from '@shared/lib/api/companies.api';
import type {
  LeadIntakeFieldMapping,
  LeadIntakeFieldTarget,
  LeadIntakeForwarder,
} from '@shared/lib/api/lead-intake-forwarders.api';
import type { StatusTone } from '@shared/ui/status-badge';

export type Member = {
  userId: string;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
};

export type Panel = 'setup' | 'recipients' | 'fields';

export type LeadIntakeFormState = {
  name: string;
  sourceLabel: string;
  intakeAddress: string;
  senderEmail: string;
  senderName: string;
  isActive: boolean;
  recipientUserIds: string[];
  fields: LeadIntakeFieldMapping[];
};

export const TARGETS: Array<{ value: LeadIntakeFieldTarget; label: string; tone: StatusTone }> = [
  { value: 'name', label: 'Namn', tone: 'info' },
  { value: 'email', label: 'E-post', tone: 'success' },
  { value: 'phone', label: 'Telefon', tone: 'accent' },
  { value: 'address', label: 'Adress', tone: 'warning' },
  { value: 'postalCode', label: 'Postnummer', tone: 'warning' },
  { value: 'requestedService', label: 'Tjänst', tone: 'accent' },
  { value: 'message', label: 'Meddelande', tone: 'neutral' },
  { value: 'referralSource', label: 'Källa', tone: 'info' },
  { value: 'custom', label: 'Extra fält', tone: 'neutral' },
];

export const PANELS: Array<{ value: Panel; label: string }> = [
  { value: 'setup', label: 'Setup' },
  { value: 'recipients', label: 'Mottagare' },
  { value: 'fields', label: 'Fält' },
];

export function displayName(user: Member['user']) {
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
}

export function recipientDisplayName(recipient: LeadIntakeForwarder['recipients'][number]) {
  return `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.trim() || recipient.email;
}

export function emptyField(order: number): LeadIntakeFieldMapping {
  return { key: `custom_${order}`, label: '', target: 'custom', order };
}

export function toRecipientIds(forwarder: LeadIntakeForwarder | null) {
  return forwarder?.recipients.map((recipient) => recipient.userId) ?? [];
}

export function sortFields(fields: LeadIntakeFieldMapping[]) {
  return [...fields].sort((a, b) => a.order - b.order);
}

export function targetMeta(target: LeadIntakeFieldTarget) {
  return TARGETS.find((item) => item.value === target) ?? TARGETS[TARGETS.length - 1];
}

export function formatDate(value?: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(new Date(value));
}

export function buildDraftName(company: Company) {
  return `${company.name} website`;
}

export function buildSenderName(company: Company) {
  return `${company.name} Intresseanmälan`;
}
