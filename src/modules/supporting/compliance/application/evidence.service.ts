/**
 * Evidence service — orchestrates all collectors and persists results.
 *
 * Runs all 13 collectors via Promise.allSettled so a failure in one
 * collector never blocks the others. Each result is persisted as an
 * append-only snapshot.
 */

import { logger } from '@core/logging/logger';
import { controlRepository }  from '../infrastructure/control.repository';
import { evidenceRepository } from '../infrastructure/evidence.repository';
import type { CollectorResult } from '../domain/evidence.entity';

// ─── Collector imports ─────────────────────────────────────────────────────────

import { mfaAdoptionCollector }        from './evidence-collectors/mfa-adoption.collector';
import { failedLoginsCollector }       from './evidence-collectors/failed-logins.collector';
import { sessionTrackingCollector }    from './evidence-collectors/session-tracking.collector';
import { privilegedAccessCollector }   from './evidence-collectors/privileged-access.collector';
import { rbacConfigCollector }         from './evidence-collectors/rbac-config.collector';
import { auditLogHealthCollector }     from './evidence-collectors/audit-log-health.collector';
import { rateLimitCollector }          from './evidence-collectors/rate-limit.collector';
import { securityHeadersCollector }    from './evidence-collectors/security-headers.collector';
import { tokenSecurityCollector }      from './evidence-collectors/token-security.collector';
import { securityTestingCollector }    from './evidence-collectors/security-testing.collector';
import { clockSyncCollector }          from './evidence-collectors/clock-sync.collector';
import { testInfoProtectionCollector } from './evidence-collectors/test-info-protection.collector';
import { accessReviewCollector }       from './evidence-collectors/access-review.collector';

const TAG = 'ComplianceEvidence';

// ─── Collector registry ────────────────────────────────────────────────────────

type CollectorFn = (organizationId: string, controlId: string) => Promise<CollectorResult>;

// Maps ISO 27001 control ID to collector function.
// controlId here is the ISO string (e.g. 'A.8.5'); the service resolves
// the DB UUID at collection time.
const COLLECTOR_MAP: Record<string, CollectorFn> = {
  'A.8.2':  privilegedAccessCollector,
  'A.8.3':  rbacConfigCollector,
  'A.8.5':  mfaAdoptionCollector,
  'A.8.6':  rateLimitCollector,
  'A.8.7':  securityHeadersCollector,
  'A.8.15': auditLogHealthCollector,
  'A.8.16': failedLoginsCollector,
  'A.8.17': clockSyncCollector,
  'A.8.28': tokenSecurityCollector,
  'A.8.29': securityTestingCollector,
  'A.8.32': sessionTrackingCollector,
  'A.8.33': testInfoProtectionCollector,
  'A.8.34': accessReviewCollector,
};

// ─── Public API ────────────────────────────────────────────────────────────────

export interface CollectionSummary {
  organizationId: string;
  collectedAt:    string;
  collected:      number;
  failed:         number;
  controls: Array<{
    controlId: string;
    status:    string;
    summary:   string;
  }>;
}

export async function collectAllEvidence(
  organizationId: string,
  triggeredBy = 'system'
): Promise<CollectionSummary> {
  logger.info(TAG, 'Starting evidence collection', { organizationId, triggeredBy });

  // Load all active controls from DB to get their UUIDs
  const controls = await controlRepository.findAll();
  const controlByIso: Record<string, { id: string; controlId: string }> = {};
  for (const c of controls) {
    controlByIso[c.controlId] = c;
  }

  // Run all collectors in parallel — failures are isolated
  const tasks = Object.entries(COLLECTOR_MAP).map(async ([isoId, collectorFn]) => {
    const control = controlByIso[isoId];
    if (!control) {
      logger.warn(TAG, `Control ${isoId} not found in DB — run prisma db seed`);
      return null;
    }
    try {
      const result = await collectorFn(organizationId, control.id);
      await evidenceRepository.append({
        organizationId,
        controlId:   result.controlId,
        status:      result.status,
        payload:     result.payload,
        summary:     result.summary,
        collectedBy: triggeredBy,
      });
      return { controlId: isoId, status: result.status, summary: result.summary };
    } catch (err) {
      logger.error(TAG, `Collector failed for ${isoId}`, { err });
      // Persist a failure snapshot so the dashboard shows something
      await evidenceRepository.append({
        organizationId,
        controlId:   control.id,
        status:      'unknown',
        payload:     { error: err instanceof Error ? err.message : String(err) },
        summary:     `Evidence collection failed for ${isoId}: ${err instanceof Error ? err.message : 'unknown error'}`,
        collectedBy: triggeredBy,
      }).catch(() => {}); // swallow secondary failure
      return null;
    }
  });

  const results = await Promise.allSettled(tasks);

  const collected: CollectionSummary['controls'] = [];
  let failed = 0;

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      collected.push(r.value);
    } else {
      failed++;
    }
  }

  logger.info(TAG, 'Evidence collection complete', {
    organizationId, collected: collected.length, failed,
  });

  return {
    organizationId,
    collectedAt: new Date().toISOString(),
    collected:   collected.length,
    failed,
    controls:    collected,
  };
}
