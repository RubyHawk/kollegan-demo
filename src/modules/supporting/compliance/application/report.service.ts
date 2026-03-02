/**
 * Report service — builds a complete ISO 27001 evidence package for auditors.
 * The output is a structured JSON that can be exported and handed to a
 * certified auditor (BSI, Bureau Veritas, etc.).
 */

import { prisma } from '@core/database/prisma';
import { controlRepository }  from '../infrastructure/control.repository';
import { evidenceRepository } from '../infrastructure/evidence.repository';
import { riskRepository }     from '../infrastructure/risk.repository';
import { policyRepository }   from '../infrastructure/policy.repository';
import type { EvidenceStatus } from '../domain/evidence.entity';
import type { ComplianceControl } from '../domain/control.entity';
import type { ComplianceRisk } from '../domain/risk.entity';
import type { CompliancePolicy } from '../domain/policy.entity';

export interface EvidencePackage {
  generatedAt:   string;
  standard:      string;
  organization:  { id: string; name: string } | null;
  summary:       { pass: number; fail: number; warn: number; unknown: number; total: number };
  controls: Array<{
    controlId:      string;
    name:           string;
    description:    string;
    latestStatus:   EvidenceStatus | null;
    lastCollectedAt: string | null;
    recentEvidence: Array<{
      status:      EvidenceStatus;
      summary:     string;
      payload:     Record<string, unknown>;
      collectedAt: string;
      collectedBy: string;
    }>;
  }>;
  risks:    unknown[];
  policies: unknown[];
}

export async function buildEvidencePackage(organizationId: string): Promise<EvidencePackage> {
  const [controls, latestEvidence, { items: risks }, { items: policies }, org] = await Promise.all([
    controlRepository.findAll(),
    evidenceRepository.listLatestPerControl(organizationId),
    riskRepository.list(organizationId, { limit: 500 }),
    policyRepository.list(organizationId, { limit: 500 }),
    prisma.organization.findUnique({
      where:  { id: organizationId },
      select: { id: true, name: true },
    }),
  ]);

  const latestByControlId: Record<string, (typeof latestEvidence)[0]> = {};
  for (const e of latestEvidence) {
    latestByControlId[e.controlId] = e;
  }

  const summary = { pass: 0, fail: 0, warn: 0, unknown: 0, total: controls.length };

  const controlsWithEvidence = await Promise.all(
    controls.map(async (control: ComplianceControl) => {
      const latest = latestByControlId[control.id] ?? null;
      const history = await evidenceRepository.listForControl(organizationId, control.id, { limit: 10 });

      const status: EvidenceStatus = latest?.status ?? 'unknown';
      summary[status]++;

      return {
        controlId:       control.controlId,
        name:            control.name,
        description:     control.description,
        latestStatus:    status,
        lastCollectedAt: latest?.collectedAt.toISOString() ?? null,
        recentEvidence:  history.map(e => ({
          status:      e.status,
          summary:     e.summary,
          payload:     e.payload,
          collectedAt: e.collectedAt.toISOString(),
          collectedBy: e.collectedBy,
        })),
      };
    })
  );

  return {
    generatedAt:  new Date().toISOString(),
    standard:     'ISO/IEC 27001:2022 Annex A (Technological Controls)',
    organization: org ?? null,
    summary,
    controls:     controlsWithEvidence,
    risks:        risks.map((r: ComplianceRisk) => ({ ...r, dueDate: r.dueDate?.toISOString() ?? null, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })),
    policies:     policies.map((p: CompliancePolicy) => ({
      ...p,
      nextReviewDate: p.nextReviewDate?.toISOString() ?? null,
      approvedAt:     p.approvedAt?.toISOString()     ?? null,
      createdAt:      p.createdAt.toISOString(),
      updatedAt:      p.updatedAt.toISOString(),
    })),
  };
}
