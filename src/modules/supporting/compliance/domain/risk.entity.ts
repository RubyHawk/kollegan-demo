export type RiskTreatment = 'accept' | 'mitigate' | 'transfer' | 'avoid';
export type RiskStatus    = 'open' | 'in_progress' | 'resolved' | 'accepted';

export interface ComplianceRisk {
  id:             string;
  organizationId: string;
  asset:          string;
  threat:         string;
  vulnerability:  string;
  likelihood:     number; // 1-5
  impact:         number; // 1-5
  riskScore:      number; // likelihood × impact (1-25), computed server-side
  treatment:      RiskTreatment;
  treatmentDesc:  string | null;
  owner:          string | null;
  dueDate:        Date | null;
  status:         RiskStatus;
  createdAt:      Date;
  updatedAt:      Date;
  createdBy:      string;
}

export interface CreateRiskInput {
  organizationId: string;
  asset:          string;
  threat:         string;
  vulnerability:  string;
  likelihood:     number;
  impact:         number;
  treatment:      RiskTreatment;
  treatmentDesc?: string;
  owner?:         string;
  dueDate?:       Date;
  createdBy:      string;
}

export interface UpdateRiskInput {
  asset?:         string;
  threat?:        string;
  vulnerability?: string;
  likelihood?:    number;
  impact?:        number;
  treatment?:     RiskTreatment;
  treatmentDesc?: string | null;
  owner?:         string | null;
  dueDate?:       Date | null;
  status?:        RiskStatus;
}
