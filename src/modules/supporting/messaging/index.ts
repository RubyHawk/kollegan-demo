/**
 * Messaging module — public interface.
 *
 * Other modules ONLY import from this file.
 *
 * Layer structure:
 *   domain/         — message.entity.ts (Conversation, DirectMessage, etc.)
 *   application/    — messaging.service.ts (listConversations, createConversation, listMessages, sendMessage)
 *   infrastructure/ — message.repository.ts (Prisma queries)
 *   events/         — message.events.ts (MESSAGE_SENT, CONVERSATION_CREATED)
 *   api/handlers/   — messaging.handler.ts (HTTP handlers)
 */

// Domain types
export type {
  Conversation,
  ConversationSummary,
  ConversationParticipant,
  ConversationType,
  DirectMessage,
  MessageView,
  MessageType,
  CreateConversationInput,
  SendMessageInput as SendMessageData,
  ListConversationsInput,
  ListMessagesInput,
} from './domain/message.entity';

// Application — service layer
export {
  listConversations,
  createConversation,
  listMessages,
  sendMessage,
} from './application/messaging.service';
export type {
  ListConversationsResult,
  ListMessagesResult,
  SendMessageInput,
  SendMessageResult,
} from './application/messaging.service';

// API handlers
export {
  handleListConversations,
  handleCreateConversation,
  handleListMessages,
  handleSendMessage,
} from './api/handlers/messaging.handler';

// Domain events
export {
  MESSAGE_SENT,
  CONVERSATION_CREATED,
} from './events/message.events';
export type {
  MessageSentEvent,
  ConversationCreatedEvent,
  MessagingEvent,
} from './events/message.events';
