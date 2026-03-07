/**
 * Audit service — write-only interface to the immutable audit log.
 *
 * All audit writes are synchronous (not fire-and-forget) for compliance:
 * an audit entry must be written before the operation is considered complete.
 *
 * Never import this service from generic/* or core/*. Only supporting/* and
 * route handlers may call audit.log().
 */

import { logger } from '@platform/logging/logger';
import { auditLogRepository } from '../infrastructure/audit-log.repository';
import type { CreateAuditLogInput, AuditLogEntry } from '../domain/audit-log.entity';

const TAG = 'AuditService';

/**
 * Append a single audit log entry. Throws on DB failure (do not swallow —
 * a missing audit entry is a compliance defect).
 */
export async function log(input: CreateAuditLogInput): Promise<AuditLogEntry> {
  const entry = await auditLogRepository.append(input);
  logger.info(TAG, `Audit: ${input.action} on ${input.resourceType}/${input.resourceId}`, {
    actorId: input.actorId,
    orgId: input.organizationId,
  });
  return entry;
}

/**
 * List audit log entries for an organization (read-only, for the admin UI).
 */
export async function listForOrg(
  organizationId: string,
  options: { limit?: number; offset?: number; action?: string } = {}
): Promise<AuditLogEntry[]> {
  return auditLogRepository.listForOrg(organizationId, options);
}
