/**
 * Compliance job registration.
 *
 * Registers the daily evidence collection job and schedules it to run
 * at startup (delayMs: 0) then self-re-enqueue every 24 hours.
 *
 * Phase 1: Uses InProcessJobQueue (in-memory, lost on restart — acceptable
 *   since initializeApp() re-registers and re-enqueues with delayMs: 0 on
 *   every server boot, giving collection within seconds of startup).
 *
 * Phase 2: Replace InProcessJobQueue with BullMQ. Job name and handler
 *   stay identical — just add { repeat: { pattern: '0 2 * * *' } }.
 */

import { prisma }   from '@platform/database/prisma';
import { logger }   from '@platform/logging/logger';
import { collectAllEvidence } from './evidence.service';

const TAG = 'ComplianceJobs';
const JOB_NAME = 'compliance.evidence.collect';
const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Minimal in-process scheduler ─────────────────────────────────────────────
// Uses recursive setTimeout to simulate a job queue until BullMQ is wired.

function scheduleNext(organizationId: string): void {
  setTimeout(async () => {
    try {
      await collectAllEvidence(organizationId, 'system');
    } catch (err) {
      logger.error(TAG, `Evidence collection failed for org ${organizationId}`, { err });
    }
    scheduleNext(organizationId); // re-schedule regardless of success/failure
  }, INTERVAL_MS);
}

export async function registerComplianceJobs(): Promise<void> {
  logger.info(TAG, `Registering ${JOB_NAME} job...`);

  // Get all active organizations
  let orgs: { id: string }[];
  try {
    orgs = await prisma.organization.findMany({ select: { id: true } });
  } catch (err) {
    logger.error(TAG, 'Failed to load organizations for compliance scheduling', { err });
    return;
  }

  if (orgs.length === 0) {
    logger.warn(TAG, 'No organizations found — compliance jobs not scheduled');
    return;
  }

  // Run initial collection immediately, then schedule daily repeats
  for (const org of orgs) {
    // Stagger initial collections by 1s per org to avoid DB thundering herd
    const staggerMs = orgs.indexOf(org) * 1000;
    setTimeout(async () => {
      try {
        logger.info(TAG, `Running initial evidence collection for org ${org.id}`);
        await collectAllEvidence(org.id, 'system');
      } catch (err) {
        logger.error(TAG, `Initial collection failed for org ${org.id}`, { err });
      }
      scheduleNext(org.id); // wire up daily recurrence
    }, staggerMs);
  }

  logger.info(TAG, `Compliance jobs registered for ${orgs.length} org(s)`);
}
