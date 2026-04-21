import { NextRequest } from 'next/server';
import { addClient, removeClient } from '@platform/sse/sse-manager';
import { getFullState } from '@demos/hotel/server';
import { checkRateLimit } from '@platform/cache/rate-limiter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// SSE serves public hotel demo state — no JWT required (demo is a public showcase).
// Phase 2: gate behind JWT once the /(internal)/ route group is in place.
// Rate limit: 10 connections / 60 s per IP to prevent connection storms.
const SSE_RL_MAX = 10;
const SSE_RL_WINDOW_MS = 60_000;

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const rl = await checkRateLimit(`sse:${ip}`, SSE_RL_MAX, SSE_RL_WINDOW_MS);
  if (!rl.allowed) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }

  let savedController: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(controller) {
      savedController = controller;
      addClient(controller);

      // Send full state immediately on connect
      const state = getFullState();
      const msg = `data: ${JSON.stringify({ type: 'full_state', payload: state })}\n\n`;
      controller.enqueue(new TextEncoder().encode(msg));
    },
    cancel() {
      removeClient(savedController);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
