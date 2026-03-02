export type PolicyStatus = 'draft' | 'active' | 'retired';

export interface CompliancePolicy {
  id:              string;
  organizationId:  string;
  name:            string;
  category:        string;
  version:         string;
  content:         string; // Markdown
  reviewCycleDays: number;
  nextReviewDate:  Date | null;
  owner:           string | null;
  approvedAt:      Date | null;
  approvedBy:      string | null;
  status:          PolicyStatus;
  createdAt:       Date;
  updatedAt:       Date;
  createdBy:       string;
}

export interface CreatePolicyInput {
  organizationId:   string;
  name:             string;
  category:         string;
  content:          string;
  version?:         string;
  reviewCycleDays?: number;
  owner?:           string;
  createdBy:        string;
}

export interface UpdatePolicyInput {
  name?:            string;
  category?:        string;
  content?:         string;
  version?:         string;
  reviewCycleDays?: number;
  nextReviewDate?:  Date | null;
  owner?:           string | null;
  approvedAt?:      Date | null;
  approvedBy?:      string | null;
  status?:          PolicyStatus;
}
