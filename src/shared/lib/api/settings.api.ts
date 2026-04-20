import { apiGet, apiPut } from '../api-client';

const ORG_BASE_URL = '/api/v1/org';

export type NotificationTag = string;

export interface EmailSettings {
  senderEmail: string | null;
  senderName: string | null;
  emailHeaderConfig?: string | null;
}

export interface NotificationRecipient {
  id: string;
  email: string;
  tags: NotificationTag[];
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
