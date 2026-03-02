export interface ComplianceControl {
  id:           string;
  controlId:    string;   // e.g. "A.8.5"
  name:         string;
  description:  string;
  category:     string;
  evidenceType: 'automated' | 'manual';
  isActive:     boolean;
}

export interface ControlWithStatus extends ComplianceControl {
  latestEvidence: {
    status:      'pass' | 'fail' | 'warn' | 'unknown';
    summary:     string;
    collectedAt: Date;
  } | null;
}
