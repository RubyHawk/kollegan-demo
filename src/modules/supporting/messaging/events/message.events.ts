import type { DomainEvent } from '@platform/events';

// ─── Event type constants ───────────────────────────────────────────────────
// Format: messaging.{aggregate}.{past-tense-verb}

export const MESSAGE_SENT              = 'messaging.message.sent'          as const;
export const CONVERSATION_CREATED      = 'messaging.conversation.created'  as const;

// ─── Event interfaces ───────────────────────────────────────────────────────

export interface MessageSentEvent extends DomainEvent {
  type: typeof MESSAGE_SENT;
  payload: {
    messageId: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    type: string;
    refId?: string;
  };
}

export interface ConversationCreatedEvent extends DomainEvent {
  type: typeof CONVERSATION_CREATED;
  payload: {
    conversationId: string;
    type: string;
    createdBy: string;
    participantIds: string[];
  };
}

export type MessagingEvent = MessageSentEvent | ConversationCreatedEvent;
