/**
 * GET  /api/messages/conversations  — list conversations for the current user
 * POST /api/messages/conversations  — create a new conversation
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, created } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { prisma as _prisma } from '@core/database/prisma';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;

// ─── GET ──────────────────────────────────────────────────────────────────────

const GetQuerySchema = z.object({
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const GET = createHandler(
  { auth: 'jwt', tag: 'Messages:ListConversations', query: GetQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof GetQuerySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    // Only return conversations where user is a participant
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: payload.sub },
      select: { conversationId: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversationIds = participations.map((p: any) => p.conversationId);

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { organizationId: payload.orgId, deletedAt: null, id: { in: conversationIds } },
        orderBy: { updatedAt: 'desc' },
        take:  query.limit,
        skip:  query.offset,
        include: {
          participants: { select: { userId: true } },
          messages: {
            where:   { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take:    1,
            select:  { body: true, createdAt: true, senderName: true },
          },
        },
      }),
      prisma.conversation.count({
        where: { organizationId: payload.orgId, deletedAt: null, id: { in: conversationIds } },
      }),
    ]);

    // Also fetch unread counts
    const unreadCounts = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conversations.map(async (conv: any) => {
        const participant = await prisma.conversationParticipant.findFirst({
          where: { conversationId: conv.id, userId: payload.sub },
        });
        const lastRead = participant?.lastReadAt ?? new Date(0);
        const count = await prisma.directMessage.count({
          where: { conversationId: conv.id, createdAt: { gt: lastRead }, deletedAt: null, senderId: { not: payload.sub } },
        });
        return { id: conv.id, unread: count };
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unreadMap = Object.fromEntries(unreadCounts.map((u: any) => [u.id, u.unread]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = conversations.map((conv: any) => ({
      id:           conv.id,
      title:        conv.title,
      type:         conv.type,
      participantCount: conv.participants.length,
      lastMessage:  conv.messages[0] ?? null,
      unreadCount:  unreadMap[conv.id] ?? 0,
      updatedAt:    conv.updatedAt.toISOString(),
      createdAt:    conv.createdAt.toISOString(),
    }));

    return ok({ conversations: result, total });
  },
);

// ─── POST ─────────────────────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  title:          z.string().max(200).optional(),
  type:           z.enum(['direct', 'group', 'channel']).default('direct'),
  participantIds: z.array(z.string()).min(1).max(50),
  initialMessage: z.string().max(5000).optional(),
});

export const POST = createHandler(
  { auth: 'jwt', tag: 'Messages:CreateConversation', body: CreateBodySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    // Include the creator in participants
    const allParticipants = Array.from(new Set([payload.sub, ...body.participantIds]));

    const conversation = await prisma.conversation.create({
      data: {
        organizationId: payload.orgId,
        title:     body.title ?? null,
        type:      body.type,
        createdBy: payload.sub,
        participants: {
          create: allParticipants.map(userId => ({ userId })),
        },
        ...(body.initialMessage ? {
          messages: {
            create: [{
              organizationId: payload.orgId,
              senderId:   payload.sub,
              senderName: payload.sub,
              body:       body.initialMessage,
              type:       'text',
            }],
          },
        } : {}),
      },
    });

    return created({ conversation });
  },
);
