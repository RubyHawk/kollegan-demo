import { controlRepository }  from '../infrastructure/control.repository';
import { evidenceRepository } from '../infrastructure/evidence.repository';
import type { ControlWithStatus } from '../domain/control.entity';
import type { ComplianceEvidence } from '../domain/evidence.entity';

export async function listControlsWithStatus(organizationId: string): Promise<ControlWithStatus[]> {
  const [controls, latestEvidence] = await Promise.all([
    controlRepository.findAll(),
    evidenceRepository.listLatestPerControl(organizationId),
  ]);

  // Build a lookup by controlId (UUID)
  const evidenceByControlId: Record<string, ComplianceEvidence> = {};
  for (const e of latestEvidence) {
    evidenceByControlId[e.controlId] = e;
  }

  return controls.map(control => ({
    ...control,
    latestEvidence: evidenceByControlId[control.id]
      ? {
          status:      evidenceByControlId[control.id].status,
          summary:     evidenceByControlId[control.id].summary,
          collectedAt: evidenceByControlId[control.id].collectedAt,
        }
      : null,
  }));
}

export async function getControlWithEvidence(
  controlId: string,
  organizationId: string,
  limit = 20
): Promise<{ control: ControlWithStatus; history: ComplianceEvidence[] } | null> {
  const control = await controlRepository.findById(controlId);
  if (!control) return null;

  const history = await evidenceRepository.listForControl(organizationId, controlId, { limit });
  const latest  = history[0] ?? null;

  return {
    control: {
      ...control,
      latestEvidence: latest
        ? { status: latest.status, summary: latest.summary, collectedAt: latest.collectedAt }
        : null,
    },
    history,
  };
}
