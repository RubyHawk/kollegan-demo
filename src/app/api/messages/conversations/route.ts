/**
 * GET  /api/messages/conversations  — list conversations for the current user
 * POST /api/messages/conversations  — create a new conversation
 *
 * Thin wrapper — all logic lives in @modules/supporting/messaging.
 */

export {
  handleListConversations as GET,
  handleCreateConversation as POST,
} from '@modules/supporting/messaging';
