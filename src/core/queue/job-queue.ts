/**
 * Background job queue — Phase 1: in-process, setTimeout-based.
 *
 * Architecture evolution path:
 *   Phase 1 (now)    → setTimeout — zero infra, jobs lost on restart.
 *   Phase 2 (6-12mo) → BullMQ (Redis-backed) — durable, retryable, monitorable.
 *   Phase 3 (12mo+)  → Dedicated worker process consuming from Redis/SQS.
 *
 * Consumer code (job handlers registered via `register()`) never changes between
 * phases. Only this file's `add()` and `process()` implementation changes.
 *
 * Built-in job types — register handlers for these at startup:
 *   'transcript.process'   — send recording to transcription service
 *   'summary.generate'     — send transcript to LLM for AI summary
 *   'workflow.run'         — execute an automation workflow
 *   'email.send'           — dispatch transactional email
 *   'billing.record_usage' — record LLM token usage per org
 */

import { logger } from '@core/logging/logger';
import type { Job, JobHandler, JobOptions } from './types';

const TAG = 'JobQueue';

class InProcessJobQueue {
  private readonly handlers = new Map<string, JobHandler>();

  /**
   * Register a handler for a job type.
   * Must be called at startup before any jobs of this type are enqueued.
   */
  register<T>(jobType: string, handler: JobHandler<T>): void {
    this.handlers.set(jobType, handler as JobHandler);
    logger.info(TAG, `Registered handler for "${jobType}"`);
  }

  /**
   * Enqueue a job. Returns the job ID.
   * Processing begins after `options.delayMs` milliseconds (default: 0).
   */
  async add<T>(
    jobType: string,
    payload: T,
    options: JobOptions = {},
  ): Promise<string> {
    const job: Job<T> = {
      id: crypto.randomUUID(),
      type: jobType,
      payload,
      options,
      createdAt: new Date().toISOString(),
      attemptCount: 0,
    };

    const delay = options.delayMs ?? 0;
    setTimeout(() => void this.process(job), delay);

    logger.info(TAG, `Queued "${jobType}"`, { jobId: job.id, delayMs: delay });
    return job.id;
  }

  private async process<T>(job: Job<T>): Promise<void> {
    const handler = this.handlers.get(job.type);

    if (!handler) {
      logger.warn(TAG, `No handler for job type "${job.type}"`, { jobId: job.id });
      return;
    }

    job.attemptCount++;
    logger.info(TAG, `Processing "${job.type}"`, {
      jobId: job.id,
      attempt: job.attemptCount,
    });

    try {
      await handler(job as Job);
      logger.info(TAG, `Completed "${job.type}"`, { jobId: job.id });
    } catch (err) {
      const maxRetries = job.options.retries ?? 0;
      logger.error(TAG, `Failed "${job.type}" attempt ${job.attemptCount}`, err);

      if (job.attemptCount <= maxRetries) {
        const backoffMs = Math.pow(2, job.attemptCount) * 1000;
        logger.info(TAG, `Retrying "${job.type}" in ${backoffMs}ms`, { jobId: job.id });
        setTimeout(() => void this.process(job), backoffMs);
      } else {
        logger.error(TAG, `"${job.type}" exhausted retries`, { jobId: job.id });
      }
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __jobQueue: InProcessJobQueue | undefined;
}

export const jobQueue: InProcessJobQueue =
  global.__jobQueue ?? new InProcessJobQueue();

if (process.env.NODE_ENV !== 'production') {
  global.__jobQueue = jobQueue;
}
