/**
 * GET  /api/messages/conversations/[id]/messages  — list messages in a conversation
 * POST /api/messages/conversations/[id]/messages  — send a message
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

function extractConvId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  const idx = parts.indexOf('conversations');
  return parts[idx + 1] ?? '';
}

// ─── GET ──────────────────────────────────────────────────────────────────────

const GetQuerySchema = z.object({
  limit:  z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const GET = createHandler(
  { auth: 'jwt', tag: 'Messages:ListMessages', query: GetQuerySchema, rateLimit: { max: 200, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as unknown as { query: z.infer<typeof GetQuerySchema>; req: NextRequest };
    const convId = extractConvId(req);
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const conversation = await prisma.conversation.findFirst({
      where: { id: convId, organizationId: payload.orgId, deletedAt: null },
    });
    if (!conversation) throw Errors.notFound('Conversation not found');

    const [messages, total] = await Promise.all([
      prisma.directMessage.findMany({
        where:   { conversationId: convId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        take:    query.limit,
        skip:    query.offset,
      }),
      prisma.directMessage.count({ where: { conversationId: convId, deletedAt: null } }),
    ]);

    await prisma.conversationParticipant.updateMany({
      where: { conversationId: convId, userId: payload.sub },
      data:  { lastReadAt: new Date() },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = messages.map((m: any) => ({
      id:         m.id,
      senderId:   m.senderId,
      senderName: m.senderName,
      body:       m.body,
      type:       m.type,
      refId:      m.refId,
      createdAt:  m.createdAt.toISOString(),
      editedAt:   m.editedAt?.toISOString() ?? null,
    }));

    return ok({ messages: result, total });
  },
);

// ─── POST ─────────────────────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  body:  z.string().min(1).max(10000),
  type:  z.enum(['text', 'system', 'transcript_ref']).default('text'),
  refId: z.string().optional(),
});

export const POST = createHandler(
  { auth: 'jwt', tag: 'Messages:SendMessage', body: CreateBodySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as unknown as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const convId = extractConvId(req);
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const conversation = await prisma.conversation.findFirst({
      where: { id: convId, organizationId: payload.orgId, deletedAt: null },
    });
    if (!conversation) throw Errors.notFound('Conversation not found');

    const userRecord = await prisma.user.findUnique({
      where:  { id: payload.sub },
      select: { firstName: true, lastName: true, email: true },
    });
    const senderName = userRecord
      ? [userRecord.firstName, userRecord.lastName].filter(Boolean).join(' ') || userRecord.email
      : payload.sub;

    const message = await prisma.directMessage.create({
      data: {
        conversationId: convId,
        organizationId: payload.orgId,
        senderId:   payload.sub,
        senderName: senderName ?? payload.sub,
        body:       body.body,
        type:       body.type,
        refId:      body.refId ?? null,
      },
    });

    await prisma.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });

    return created({
      message: {
        id:         message.id,
        senderId:   message.senderId,
        senderName: message.senderName,
        body:       message.body,
        type:       message.type,
        refId:      message.refId,
        createdAt:  message.createdAt.toISOString(),
      },
    });
  },
);
