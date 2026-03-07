import { SSEMessage } from './types';

declare global {
  // eslint-disable-next-line no-var
  var __sseClients: Set<ReadableStreamDefaultController> | undefined;
}

function getClients(): Set<ReadableStreamDefaultController> {
  if (!global.__sseClients) {
    global.__sseClients = new Set();
  }
  return global.__sseClients;
}

export function addClient(controller: ReadableStreamDefaultController): void {
  getClients().add(controller);
}

export function removeClient(controller: ReadableStreamDefaultController): void {
  getClients().delete(controller);
}

export function broadcast(message: SSEMessage): void {
  const data = `data: ${JSON.stringify(message)}\n\n`;
  const encoded = new TextEncoder().encode(data);
  const clients = getClients();
  const dead: ReadableStreamDefaultController[] = [];

  for (const controller of clients) {
    try {
      controller.enqueue(encoded);
    } catch {
      dead.push(controller);
    }
  }

  for (const c of dead) clients.delete(c);
}
