/**
 * Messaging API handlers — colocated with the messaging module.
 *
 * All handlers use createHandler from @platform/api which provides:
 *   - JWT authentication
 *   - Rate limiting
 *   - Zod validation
 *   - RFC 9110 / 9457 compliant error responses
 *
 * app/api/ routes are thin re-export wrappers that point here.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, created } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  listConversations,
  createConversation,
  listMessages,
  sendMessage,
} from '../../application/messaging.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function extractAuth(req: NextRequest) {
  const token =
    req.headers.get('authorization')?.slice(7) ??
    req.cookies.get('token')?.value ??
    '';
  const payload = await verifyToken(token);
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  return payload;
}

function extractConvId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  const idx = parts.indexOf('conversations');
  return parts[idx + 1] ?? '';
}

// ─── GET /api/v1/messages/conversations ──────────────────────────────────────

const ListConversationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const handleListConversations = createHandler(
  {
    auth: 'jwt',
    tag: 'Messages:ListConversations',
    query: ListConversationsQuerySchema,
    rateLimit: { max: 120, windowMs: 60_000 },
  },
  async (ctx) => {
    const { query, req } = ctx as {
      query: z.infer<typeof ListConversationsQuerySchema>;
      req: NextRequest;
    };
    const payload = await extractAuth(req);

    const result = await listConversations({
      organizationId: payload.orgId!,
      userId: payload.sub,
      limit: query.limit,
      offset: query.offset,
    });

    return ok(result);
  },
);

// ─── POST /api/v1/messages/conversations ─────────────────────────────────────

const CreateConversationBodySchema = z.object({
  title: z.string().max(200).optional(),
  type: z.enum(['direct', 'group', 'channel']).default('direct'),
  participantIds: z.array(z.string()).min(1).max(50),
  initialMessage: z.string().max(5000).optional(),
});

export const handleCreateConversation = createHandler(
  {
    auth: 'jwt',
    tag: 'Messages:CreateConversation',
    body: CreateConversationBodySchema,
    rateLimit: { max: 30, windowMs: 60_000 },
  },
  async (ctx) => {
    const { body, req } = ctx as {
      body: z.infer<typeof CreateConversationBodySchema>;
      req: NextRequest;
    };
    const payload = await extractAuth(req);

    const result = await createConversation({
      organizationId: payload.orgId!,
      title: body.title,
      type: body.type,
      createdBy: payload.sub,
      participantIds: body.participantIds,
      initialMessage: body.initialMessage,
    });

    return created(result);
  },
);

// ─── GET /api/v1/messages/conversations/[id]/messages ────────────────────────

const ListMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const handleListMessages = createHandler(
  {
    auth: 'jwt',
    tag: 'Messages:ListMessages',
    query: ListMessagesQuerySchema,
    rateLimit: { max: 200, windowMs: 60_000 },
  },
  async (ctx) => {
    const { query, req } = ctx as unknown as {
      query: z.infer<typeof ListMessagesQuerySchema>;
      req: NextRequest;
    };
    const convId = extractConvId(req);
    const payload = await extractAuth(req);

    const result = await listMessages({
      conversationId: convId,
      organizationId: payload.orgId!,
      userId: payload.sub,
      limit: query.limit,
      offset: query.offset,
    });

    return ok(result);
  },
);

// ─── POST /api/v1/messages/conversations/[id]/messages ───────────────────────

const SendMessageBodySchema = z.object({
  body: z.string().min(1).max(10000),
  type: z.enum(['text', 'system', 'transcript_ref']).default('text'),
  refId: z.string().optional(),
});

export const handleSendMessage = createHandler(
  {
    auth: 'jwt',
    tag: 'Messages:SendMessage',
    body: SendMessageBodySchema,
    rateLimit: { max: 120, windowMs: 60_000 },
  },
  async (ctx) => {
    const { body, req } = ctx as unknown as {
      body: z.infer<typeof SendMessageBodySchema>;
      req: NextRequest;
    };
    const convId = extractConvId(req);
    const payload = await extractAuth(req);

    const result = await sendMessage({
      conversationId: convId,
      organizationId: payload.orgId!,
      senderId: payload.sub,
      body: body.body,
      type: body.type,
      refId: body.refId,
    });

    return created(result);
  },
);
