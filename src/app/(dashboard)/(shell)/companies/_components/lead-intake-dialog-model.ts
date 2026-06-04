import type { Company } from '@shared/lib/api/companies.api';
import type {
  LeadIntakeFieldMapping,
  LeadIntakeFieldTarget,
  LeadIntakeForwarder,
} from '@shared/lib/api/lead-intake-forwarders.api';

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

export const TARGETS: Array<{ value: LeadIntakeFieldTarget; label: string; tone: string }> = [
  { value: 'name', label: 'Namn', tone: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-900/60' },
  { value: 'email', label: 'E-post', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/60' },
  { value: 'phone', label: 'Telefon', tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:ring-indigo-900/60' },
  { value: 'address', label: 'Adress', tone: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/60' },
  { value: 'postalCode', label: 'Postnummer', tone: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/60' },
  { value: 'requestedService', label: 'Tjanst', tone: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-900/60' },
  { value: 'message', label: 'Meddelande', tone: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:ring-slate-800' },
  { value: 'referralSource', label: 'Kalla', tone: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:ring-cyan-900/60' },
  { value: 'custom', label: 'Extra falt', tone: 'bg-stone-100 text-stone-700 ring-stone-200 dark:bg-stone-900/40 dark:text-stone-300 dark:ring-stone-800' },
];

export const PANELS: Array<{ value: Panel; label: string }> = [
  { value: 'setup', label: 'Setup' },
  { value: 'recipients', label: 'Mottagare' },
  { value: 'fields', label: 'Falt' },
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
  return `${company.name} Intresseanmalan`;
}
