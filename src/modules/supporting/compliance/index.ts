// ─── Compliance module public API ──────────────────────────────────────────────

export type { ComplianceControl, ControlWithStatus } from './domain/control.entity';
export type { ComplianceEvidence, CreateEvidenceInput, EvidenceStatus, CollectorResult } from './domain/evidence.entity';
export type { ComplianceRisk, CreateRiskInput, UpdateRiskInput, RiskTreatment, RiskStatus } from './domain/risk.entity';
export type { CompliancePolicy, CreatePolicyInput, UpdatePolicyInput, PolicyStatus } from './domain/policy.entity';
export { ISO_27001_CONTROLS } from './domain/control-registry';

export {
  listControlsWithStatus,
  getControlWithEvidence,
} from './application/compliance.service';

export {
  collectAllEvidence,
} from './application/evidence.service';

export {
  createRisk, updateRisk, deleteRisk, getRisk, listRisks,
} from './application/risk.service';

export {
  createPolicy, updatePolicy, deletePolicy, getPolicy, listPolicies,
} from './application/policy.service';

export { buildEvidencePackage } from './application/report.service';

export { registerComplianceJobs } from './application/jobs';

// ── API Handlers ─────────────────────────────────────────────────────────────
export {
  handleListControls,
  handleControlEvidence,
  handleCollectEvidence,
  handleComplianceReport,
  handleListRisks,
  handleCreateRisk,
  handleUpdateRisk,
  handleDeleteRisk,
  handleListPolicies,
  handleCreatePolicy,
  handleUpdatePolicy,
  handleDeletePolicy,
} from './api/handlers/compliance.handler';
