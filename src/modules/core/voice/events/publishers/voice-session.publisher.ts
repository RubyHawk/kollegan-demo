/**
 * Voice Session Publisher.
 *
 * Publishes voice call lifecycle events to the event bus.
 * Consumers (CRM, Automation) subscribe to these events to react to calls.
 *
 * Phase 1: stubs — emit events, log them.
 * Phase 2: hook into actual Vapi session lifecycle.
 */

import { eventBus, EventTypes } from '@platform/events';
import { logger } from '@platform/logging/logger';

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? 'demo';
const TAG = 'VoiceSessionPublisher';

export async function publishCallStarted(payload: { callId: string; assistantId: string }): Promise<void> {
  await eventBus.publish({
    type:       EventTypes.CALL_STARTED,
    orgId:      DEMO_ORG_ID,
    occurredAt: new Date().toISOString(),
    aggregateId: payload.callId,
    payload,
  });
  logger.info(TAG, `Call started: ${payload.callId}`);
}

export async function publishCallEnded(payload: {
  callId: string;
  durationMs: number;
  transcriptId?: string;
}): Promise<void> {
  await eventBus.publish({
    type:       EventTypes.CALL_ENDED,
    orgId:      DEMO_ORG_ID,
    occurredAt: new Date().toISOString(),
    aggregateId: payload.callId,
    payload,
  });
  logger.info(TAG, `Call ended: ${payload.callId} (${payload.durationMs}ms)`);
}
