import { NextRequest } from 'next/server';
import { addClient, removeClient } from '@infra/sse/sse-manager';
import { getFullState } from '@features/hotel/rooms/lib/room-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
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
