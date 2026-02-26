/**
 * In-process event bus — Phase 1 of the event-driven architecture evolution.
 *
 * Architecture evolution path:
 *   Phase 1 (now)    → In-process EventEmitter. Zero infra, same process.
 *   Phase 2 (3-6mo)  → Persist events to `evt_domain_events` table for replay/audit.
 *   Phase 3 (6-12mo) → BullMQ (Redis-backed) for durable async fan-out.
 *   Phase 4 (12mo+)  → NATS or Redis Streams for cross-service messaging.
 *
 * Feature code that publishes/subscribes NEVER changes between phases.
 * Only this file's implementation changes.
 */

import { EventEmitter } from 'events';
import { logger } from '@core/logging/logger';
import type { DomainEvent, EventHandler } from './types';

const TAG = 'EventBus';

class InProcessEventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    // Prevent MaxListenersExceededWarning — many features subscribe at startup
    this.emitter.setMaxListeners(200);
  }

  /**
   * Publish a domain event. Synchronous emit, fire-and-forget.
   * Listeners run asynchronously; errors are caught internally and never
   * propagate back to the publisher.
   */
  publish<T extends DomainEvent>(event: T): void {
    logger.info(TAG, `→ ${event.type}`, { orgId: event.orgId });
    this.emitter.emit(event.type, event);
  }

  /**
   * Subscribe to a domain event type.
   * Returns an unsubscribe function — call it to remove the listener.
   *
   * Handler errors are caught and logged; they never crash the publisher.
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
  ): () => void {
    const safe = async (event: T) => {
      try {
        await handler(event);
      } catch (err) {
        logger.error(TAG, `Handler for "${eventType}" threw`, err);
      }
    };

    this.emitter.on(eventType, safe);
    return () => this.emitter.off(eventType, safe);
  }

  /** Number of listeners for a given event type — useful for tests. */
  listenerCount(eventType: string): number {
    return this.emitter.listenerCount(eventType);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __eventBus: InProcessEventBus | undefined;
}

// Singleton that survives Next.js HMR reloads in development
export const eventBus: InProcessEventBus =
  global.__eventBus ?? new InProcessEventBus();

if (process.env.NODE_ENV !== 'production') {
  global.__eventBus = eventBus;
}
