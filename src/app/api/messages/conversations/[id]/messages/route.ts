/**
 * GET  /api/messages/conversations/[id]/messages  — list messages in a conversation
 * POST /api/messages/conversations/[id]/messages  — send a message
 *
 * Thin wrapper — all logic lives in @modules/supporting/messaging.
 */

export {
  handleListMessages as GET,
  handleSendMessage as POST,
} from '@modules/supporting/messaging';
