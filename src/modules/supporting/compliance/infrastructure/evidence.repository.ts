// ─── Evidence repository ───────────────────────────────────────────────────────
// CRITICAL: append-only. This repository must NEVER expose update or delete methods.
// Evidence snapshots are the tamper-evident audit trail for ISO 27001 auditors.

import { prisma } from '@core/database/prisma';
import type { ComplianceEvidence, CreateEvidenceInput } from '../domain/evidence.entity';

type EvidenceRow = {
  id: string; organizationId: string; controlId: string; status: string;
  payload: unknown; summary: string; collectedAt: Date; collectedBy: string;
};

function toEntity(raw: EvidenceRow): ComplianceEvidence {
  return {
    id:             raw.id,
    organizationId: raw.organizationId,
    controlId:      raw.controlId,
    status:         raw.status as ComplianceEvidence['status'],
    payload:        raw.payload as Record<string, unknown>,
    summary:        raw.summary,
    collectedAt:    raw.collectedAt,
    collectedBy:    raw.collectedBy,
  };
}

export const evidenceRepository = {
  // CRITICAL: append-only. Never expose update or delete.
  async append(input: CreateEvidenceInput): Promise<ComplianceEvidence> {
    const raw = await prisma.complianceEvidence.create({
      data: {
        organizationId: input.organizationId,
        controlId:      input.controlId,
        status:         input.status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload:        input.payload as any,
        summary:        input.summary,
        collectedBy:    input.collectedBy ?? 'system',
      },
    });
    return toEntity(raw as EvidenceRow);
  },

  async listForControl(
    organizationId: string,
    controlId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<ComplianceEvidence[]> {
    const rows = await prisma.complianceEvidence.findMany({
      where:   { organizationId, controlId },
      orderBy: { collectedAt: 'desc' },
      take:    options.limit  ?? 20,
      skip:    options.offset ?? 0,
    });
    return (rows as EvidenceRow[]).map(toEntity);
  },

  // Returns the most recent snapshot per control for an org — feeds the dashboard.
  async listLatestPerControl(organizationId: string): Promise<ComplianceEvidence[]> {
    // Prisma doesn't support DISTINCT ON natively; use raw query for efficiency.
    const rows = await prisma.$queryRaw<EvidenceRow[]>`
      SELECT DISTINCT ON (e."controlId")
        e.id, e."organizationId", e."controlId", e.status,
        e.payload, e.summary, e."collectedAt", e."collectedBy"
      FROM cmp_evidence e
      WHERE e."organizationId" = ${organizationId}
      ORDER BY e."controlId", e."collectedAt" DESC
    `;
    return rows.map(toEntity);
  },
};
