import { apiGet, apiPost } from '../api-client';

const BASE_URL = '/api/v1/messages/conversations';

interface ApiEnvelope<T> {
  data: T;
}

export interface LastMessage {
  body: string;
  createdAt: string;
  senderName: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  type: string;
  participantCount: number;
  lastMessage: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  type: string;
  createdAt: string;
}

export interface CreateConversationPayload {
  title?: string;
  type?: 'direct' | 'group' | 'channel';
  participantIds: string[];
  initialMessage?: string;
}

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listConversations(params: { limit?: number; offset?: number } = {}) {
  const res = await apiGet<ApiEnvelope<{ conversations: Conversation[]; total: number }>>(
    `${BASE_URL}${query(params)}`,
  );
  return res.data;
}

export async function createConversation(payload: CreateConversationPayload) {
  const res = await apiPost<ApiEnvelope<{ conversation: Conversation }>>(BASE_URL, payload);
  return res.data;
}

export async function listMessages(conversationId: string, params: { limit?: number; offset?: number } = {}) {
  const res = await apiGet<ApiEnvelope<{ messages: Message[]; total: number }>>(
    `${BASE_URL}/${conversationId}/messages${query(params)}`,
  );
  return res.data;
}

export async function sendMessage(conversationId: string, payload: { body: string; type?: string; refId?: string }) {
  const res = await apiPost<ApiEnvelope<{ message: Message }>>(`${BASE_URL}/${conversationId}/messages`, payload);
  return res.data.message;
}
