import { apiGet, apiPut } from '../api-client';

const ORG_BASE_URL = '/api/v1/org';

export const ACTIVE_NOTIFICATION_TAGS = [
  'offer_signed',
  'offer_declined',
] as const;

export type ActiveNotificationTag = typeof ACTIVE_NOTIFICATION_TAGS[number];
export type NotificationTag = ActiveNotificationTag;

export interface ActiveNotificationTagDefinition {
  tag: ActiveNotificationTag;
  label: string;
  tone: 'emerald' | 'red';
}

export const ACTIVE_NOTIFICATION_DEFINITIONS: ActiveNotificationTagDefinition[] = [
  {
    tag: 'offer_signed',
    label: 'Offert signerad',
    tone: 'emerald',
  },
  {
    tag: 'offer_declined',
    label: 'Offert avvisad',
    tone: 'red',
  },
];

export interface EmailSettings {
  senderEmail: string | null;
  senderName: string | null;
  emailHeaderConfig?: string | null;
}

export interface ThemeSettings {
  themeMode: 'light' | 'dark' | 'auto' | null;
  themeAccent: string | null;
  themeFontFamily: string | null;
  themeFontSize: 'small' | 'medium' | 'large' | null;
  canManage: boolean;
}

export interface NotificationRecipient {
  id: string;
  email: string;
  tags: ActiveNotificationTag[];
}

export interface NotificationRecipientsResponse {
  recipients: NotificationRecipient[];
  canManage: boolean;
}

interface Envelope<T> {
  data: T;
}

export async function getEmailSettings() {
  const res = await apiGet<Envelope<EmailSettings>>(`${ORG_BASE_URL}/email-settings`);
  return res.data;
}

export async function updateEmailSettings(payload: Partial<EmailSettings>) {
  const res = await apiPut<Envelope<EmailSettings>>(`${ORG_BASE_URL}/email-settings`, payload);
  return res.data;
}

export async function getThemeSettings() {
  const res = await apiGet<Envelope<ThemeSettings>>(`${ORG_BASE_URL}/theme-settings`);
  return res.data;
}

export async function updateThemeSettings(payload: Partial<Omit<ThemeSettings, 'canManage'>>) {
  const res = await apiPut<Envelope<ThemeSettings>>(`${ORG_BASE_URL}/theme-settings`, payload);
  return res.data;
}

export async function getNotificationRecipients() {
  const res = await apiGet<Envelope<NotificationRecipientsResponse>>(`${ORG_BASE_URL}/notification-recipients`);
  return res.data;
}

export async function updateNotificationRecipients(recipients: NotificationRecipient[]) {
  const res = await apiPut<Envelope<NotificationRecipientsResponse>>(`${ORG_BASE_URL}/notification-recipients`, {
    recipients,
  });
  return res.data;
}
