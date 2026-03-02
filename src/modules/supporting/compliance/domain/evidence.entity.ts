export type EvidenceStatus = 'pass' | 'fail' | 'warn' | 'unknown';

export interface ComplianceEvidence {
  id:             string;
  organizationId: string;
  controlId:      string;
  status:         EvidenceStatus;
  payload:        Record<string, unknown>;
  summary:        string;
  collectedAt:    Date;
  collectedBy:    string;
}

export interface CreateEvidenceInput {
  organizationId: string;
  controlId:      string;
  status:         EvidenceStatus;
  payload:        Record<string, unknown>;
  summary:        string;
  collectedBy?:   string;
}

export interface CollectorResult {
  controlId:  string;   // ComplianceControl.id (UUID)
  status:     EvidenceStatus;
  summary:    string;
  payload:    Record<string, unknown>;
}
