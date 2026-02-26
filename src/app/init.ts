/**
 * Application bootstrap — runs exactly once at server startup.
 *
 * Registers tools into the automation tool registry and wires up all
 * cross-module event listeners. Order matters:
 *   1. Tools first  — listeners may call tools during handling
 *   2. Listeners second — they subscribe to the event bus
 *
 * This file is called from instrumentation.ts (Next.js startup hook).
 * Do NOT import this file in route handlers or React components.
 */

import { registerVoiceTools }          from '@features/voice/register';
import { registerAutomationListeners } from '@features/automation/listeners';
import { logger }                      from '@core/logging/logger';

let initialized = false;

export function initializeApp(): void {
  if (initialized) return;
  initialized = true;

  const TAG = 'Bootstrap';
  logger.info(TAG, 'Initializing platform...');

  // 1. Register all tools into the central tool registry
  registerVoiceTools();
  // Future: registerLeadsTools(), registerOffersTools(), ...

  // 2. Register all cross-module event listeners
  registerAutomationListeners();
  // Future: registerCrmListeners(), registerLeadsListeners(), ...

  logger.info(TAG, 'Platform initialized');
}
