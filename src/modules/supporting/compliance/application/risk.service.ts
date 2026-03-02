import { riskRepository } from '../infrastructure/risk.repository';
import type { ComplianceRisk, CreateRiskInput, UpdateRiskInput, RiskStatus } from '../domain/risk.entity';

// riskScore is ALWAYS computed here — never accepted from client input
function computeRiskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

export async function createRisk(input: CreateRiskInput): Promise<ComplianceRisk> {
  const riskScore = computeRiskScore(input.likelihood, input.impact);
  return riskRepository.create({ ...input, riskScore });
}

export async function updateRisk(
  id: string,
  organizationId: string,
  updates: UpdateRiskInput
): Promise<ComplianceRisk | null> {
  // Re-compute score if likelihood or impact changed
  const existing = await riskRepository.findById(id, organizationId);
  if (!existing) return null;

  const newLikelihood = updates.likelihood ?? existing.likelihood;
  const newImpact     = updates.impact     ?? existing.impact;
  const riskScore     = computeRiskScore(newLikelihood, newImpact);

  return riskRepository.update(id, organizationId, { ...updates, riskScore });
}

export async function deleteRisk(id: string, organizationId: string): Promise<boolean> {
  return riskRepository.softDelete(id, organizationId);
}

export async function getRisk(id: string, organizationId: string): Promise<ComplianceRisk | null> {
  return riskRepository.findById(id, organizationId);
}

export async function listRisks(
  organizationId: string,
  options: { status?: RiskStatus; limit?: number; offset?: number } = {}
): Promise<{ items: ComplianceRisk[]; total: number }> {
  return riskRepository.list(organizationId, options);
}
