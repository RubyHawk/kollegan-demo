import { prisma } from '@platform/database/prisma';
import type {
  CreateConversationInput,
  SendMessageInput,
  ListConversationsInput,
  ListMessagesInput,
  ConversationSummary,
  MessageView,
} from '../domain/message.entity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

// ─── Conversations ───────────────────────────────────────────────────────────

/**
 * List conversations the user participates in, including last message and unread counts.
 */
export async function listConversations(
  input: ListConversationsInput,
): Promise<{ conversations: ConversationSummary[]; total: number }> {
  // Get conversation IDs where user is a participant
  const participations = await db.conversationParticipant.findMany({
    where: { userId: input.userId },
    select: { conversationId: true },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversationIds = participations.map((p: any) => p.conversationId);

  const where = {
    organizationId: input.organizationId,
    deletedAt: null,
    id: { in: conversationIds },
  };

  const [conversations, total] = await Promise.all([
    db.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: input.limit,
      skip: input.offset,
      include: {
        participants: { select: { userId: true } },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, createdAt: true, senderName: true },
        },
      },
    }),
    db.conversation.count({ where }),
  ]);

  // Fetch unread counts per conversation
  const unreadCounts = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conversations.map(async (conv: any) => {
      const participant = await db.conversationParticipant.findFirst({
        where: { conversationId: conv.id, userId: input.userId },
      });
      const lastRead = participant?.lastReadAt ?? new Date(0);
      const count = await db.directMessage.count({
        where: {
          conversationId: conv.id,
          createdAt: { gt: lastRead },
          deletedAt: null,
          senderId: { not: input.userId },
        },
      });
      return { id: conv.id, unread: count };
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unreadMap = Object.fromEntries(unreadCounts.map((u: any) => [u.id, u.unread]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: ConversationSummary[] = conversations.map((conv: any) => ({
    id: conv.id,
    title: conv.title,
    type: conv.type,
    participantCount: conv.participants.length,
    lastMessage: conv.messages[0] ?? null,
    unreadCount: unreadMap[conv.id] ?? 0,
    updatedAt: conv.updatedAt.toISOString(),
    createdAt: conv.createdAt.toISOString(),
  }));

  return { conversations: result, total };
}

/**
 * Create a new conversation with participants and optional initial message.
 */
export async function createConversation(input: CreateConversationInput) {
  const allParticipants = Array.from(new Set([input.createdBy, ...input.participantIds]));

  return db.conversation.create({
    data: {
      organizationId: input.organizationId,
      title: input.title ?? null,
      type: input.type,
      createdBy: input.createdBy,
      participants: {
        create: allParticipants.map((userId: string) => ({ userId })),
      },
      ...(input.initialMessage
        ? {
            messages: {
              create: [
                {
                  organizationId: input.organizationId,
                  senderId: input.createdBy,
                  senderName: input.createdBy,
                  body: input.initialMessage,
                  type: 'text',
                },
              ],
            },
          }
        : {}),
    },
  });
}

/**
 * Find a conversation by ID within an organization (non-deleted).
 */
export async function findConversation(id: string, organizationId: string) {
  return db.conversation.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
}

// ─── Messages ────────────────────────────────────────────────────────────────

/**
 * List messages in a conversation with pagination.
 */
export async function listMessages(
  input: ListMessagesInput,
): Promise<{ messages: MessageView[]; total: number }> {
  const [messages, total] = await Promise.all([
    db.directMessage.findMany({
      where: { conversationId: input.conversationId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      take: input.limit,
      skip: input.offset,
    }),
    db.directMessage.count({
      where: { conversationId: input.conversationId, deletedAt: null },
    }),
  ]);

  // Mark conversation as read for this user
  await db.conversationParticipant.updateMany({
    where: { conversationId: input.conversationId, userId: input.userId },
    data: { lastReadAt: new Date() },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: MessageView[] = messages.map((m: any) => ({
    id: m.id,
    senderId: m.senderId,
    senderName: m.senderName,
    body: m.body,
    type: m.type,
    refId: m.refId,
    createdAt: m.createdAt.toISOString(),
    editedAt: m.editedAt?.toISOString() ?? null,
  }));

  return { messages: result, total };
}

/**
 * Create a new message and bump the conversation's updatedAt timestamp.
 */
export async function createMessage(input: SendMessageInput) {
  const message = await db.directMessage.create({
    data: {
      conversationId: input.conversationId,
      organizationId: input.organizationId,
      senderId: input.senderId,
      senderName: input.senderName,
      body: input.body,
      type: input.type,
      refId: input.refId ?? null,
    },
  });

  await db.conversation.update({
    where: { id: input.conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

/**
 * Resolve a sender's display name from the User table.
 */
export async function resolveSenderName(userId: string): Promise<string> {
  const userRecord = await db.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, email: true },
  });

  if (!userRecord) return userId;

  return (
    [userRecord.firstName, userRecord.lastName].filter(Boolean).join(' ') ||
    userRecord.email ||
    userId
  );
}
