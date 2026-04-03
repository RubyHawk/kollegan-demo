/**
 * Offer email job handlers — registered at module startup.
 *
 * Jobs reuse the same dispatch helpers as the synchronous send flow so queued
 * retries and direct sends behave identically.
 */

import { jobQueue } from '@platform/queue/job-queue';
import { logger } from '@platform/logging/logger';
import type {
  NotifyCreatorPayload,
  ReminderPayload,
  SendToRecipientPayload,
} from '../application/offer-email';
import {
  dispatchCreatorNotification,
  dispatchOfferEmail,
  dispatchReminderEmail,
} from '../application/offer-email-dispatch';

const TAG = 'OfferEmailJobs';

let registered = false;

export function registerOfferEmailJobs(): void {
  if (registered) return;
  registered = true;

  jobQueue.register<SendToRecipientPayload>(
    'offer.email.send_to_recipient',
    async (job) => dispatchOfferEmail(job.payload),
  );

  jobQueue.register<NotifyCreatorPayload>(
    'offer.email.notify_creator',
    async (job) => dispatchCreatorNotification(job.payload),
  );

  jobQueue.register<ReminderPayload>(
    'offer.email.reminder',
    async (job) => dispatchReminderEmail(job.payload),
  );

  logger.info(TAG, 'Offer email job handlers registered');
}
