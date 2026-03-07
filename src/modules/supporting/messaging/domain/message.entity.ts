// ─── Conversation types ──────────────────────────────────────────────────────

export type ConversationType = 'direct' | 'group' | 'channel';

export interface Conversation {
  id: string;
  organizationId: string;
  title: string | null;
  type: ConversationType;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  type: ConversationType;
  participantCount: number;
  lastMessage: { body: string; createdAt: string; senderName: string } | null;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: string;
  lastReadAt: string | null;
}

// ─── Message types ───────────────────────────────────────────────────────────

export type MessageType = 'text' | 'system' | 'transcript_ref';

export interface DirectMessage {
  id: string;
  conversationId: string;
  organizationId: string;
  senderId: string;
  senderName: string;
  body: string;
  type: MessageType;
  refId: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
}

export interface MessageView {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  type: MessageType;
  refId: string | null;
  createdAt: string;
  editedAt: string | null;
}

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateConversationInput {
  organizationId: string;
  title?: string;
  type: ConversationType;
  createdBy: string;
  participantIds: string[];
  initialMessage?: string;
}

export interface SendMessageInput {
  conversationId: string;
  organizationId: string;
  senderId: string;
  senderName: string;
  body: string;
  type: MessageType;
  refId?: string;
}

export interface ListConversationsInput {
  organizationId: string;
  userId: string;
  limit: number;
  offset: number;
}

export interface ListMessagesInput {
  conversationId: string;
  organizationId: string;
  userId: string;
  limit: number;
  offset: number;
}
