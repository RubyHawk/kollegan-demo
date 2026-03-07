import { logger } from '@platform/logging/logger';
import { eventBus } from '@platform/events';
import {
  listConversations as repoListConversations,
  createConversation as repoCreateConversation,
  findConversation,
  listMessages as repoListMessages,
  createMessage as repoCreateMessage,
  resolveSenderName,
} from '../infrastructure/message.repository';
import {
  MESSAGE_SENT,
  CONVERSATION_CREATED,
} from '../events/message.events';
import type {
  MessageSentEvent,
  ConversationCreatedEvent,
} from '../events/message.events';
import type {
  ConversationSummary,
  MessageView,
  CreateConversationInput,
  ListConversationsInput,
  ListMessagesInput,
} from '../domain/message.entity';

const TAG = 'MessagingService';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ListConversationsResult {
  conversations: ConversationSummary[];
  total: number;
}

export interface ListMessagesResult {
  messages: MessageView[];
  total: number;
}

export interface SendMessageInput {
  conversationId: string;
  organizationId: string;
  senderId: string;
  body: string;
  type: 'text' | 'system' | 'transcript_ref';
  refId?: string;
}

export interface SendMessageResult {
  message: MessageView;
}

// ─── listConversations ───────────────────────────────────────────────────────

/**
 * Returns paginated conversations the user participates in,
 * including last message preview and unread count.
 */
export async function listConversations(
  input: ListConversationsInput,
): Promise<ListConversationsResult> {
  const result = await repoListConversations(input);
  logger.debug(TAG, `Listed ${result.conversations.length} conversations for user ${input.userId}`);
  return result;
}

// ─── createConversation ──────────────────────────────────────────────────────

/**
 * Creates a new conversation with participants. The creator is always added
 * as a participant. Optionally seeds the conversation with an initial message.
 */
export async function createConversation(
  input: CreateConversationInput,
): Promise<{ conversation: Record<string, unknown> }> {
  const allParticipants = Array.from(new Set([input.createdBy, ...input.participantIds]));
  const conversation = await repoCreateConversation(input);

  eventBus.publish<ConversationCreatedEvent>({
    type: CONVERSATION_CREATED,
    orgId: input.organizationId,
    occurredAt: new Date().toISOString(),
    payload: {
      conversationId: conversation.id,
      type: input.type,
      createdBy: input.createdBy,
      participantIds: allParticipants,
    },
  });

  logger.info(TAG, `Conversation created: ${conversation.id}`, {
    type: input.type,
    participants: allParticipants.length,
  });

  return { conversation };
}

// ─── listMessages ────────────────────────────────────────────────────────────

/**
 * Returns paginated messages for a conversation. Also marks the conversation
 * as read for the requesting user.
 *
 * Throws if the conversation does not exist or belongs to a different org.
 */
export async function listMessages(
  input: ListMessagesInput,
): Promise<ListMessagesResult> {
  const conversation = await findConversation(input.conversationId, input.organizationId);
  if (!conversation) {
    const err = new Error('Conversation not found');
    (err as any).status = 404; // eslint-disable-line @typescript-eslint/no-explicit-any
    throw err;
  }

  return repoListMessages(input);
}

// ─── sendMessage ─────────────────────────────────────────────────────────────

/**
 * Sends a message in an existing conversation.
 *
 * Resolves the sender's display name from the User table, persists the message,
 * bumps the conversation's updatedAt, and publishes a domain event.
 *
 * Throws if the conversation does not exist or belongs to a different org.
 */
export async function sendMessage(
  input: SendMessageInput,
): Promise<SendMessageResult> {
  const conversation = await findConversation(input.conversationId, input.organizationId);
  if (!conversation) {
    const err = new Error('Conversation not found');
    (err as any).status = 404; // eslint-disable-line @typescript-eslint/no-explicit-any
    throw err;
  }

  const senderName = await resolveSenderName(input.senderId);

  const message = await repoCreateMessage({
    conversationId: input.conversationId,
    organizationId: input.organizationId,
    senderId: input.senderId,
    senderName,
    body: input.body,
    type: input.type,
    refId: input.refId,
  });

  eventBus.publish<MessageSentEvent>({
    type: MESSAGE_SENT,
    orgId: input.organizationId,
    occurredAt: new Date().toISOString(),
    payload: {
      messageId: message.id,
      conversationId: input.conversationId,
      senderId: input.senderId,
      senderName,
      type: input.type,
      refId: input.refId,
    },
  });

  logger.info(TAG, `Message sent in ${input.conversationId}`, {
    messageId: message.id,
    senderId: input.senderId,
  });

  return {
    message: {
      id: message.id,
      senderId: message.senderId,
      senderName: message.senderName,
      body: message.body,
      type: message.type,
      refId: message.refId,
      createdAt: message.createdAt.toISOString(),
      editedAt: message.editedAt?.toISOString() ?? null,
    },
  };
}
