import { apiDelete, apiGet, apiPost } from '../api-client';

const BASE_URL = '/api/v1/admin/compliance';
const ACCESS_REVIEW_URL = '/api/v1/admin/access-review';

interface ApiEnvelope<T> {
  data: T;
  pagination?: {
    total?: number;
    count: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type EvidenceStatus = 'pass' | 'fail' | 'warn' | 'unknown';
export type PolicyStatus = 'draft' | 'active' | 'retired';
export type RiskStatus = 'open' | 'in_progress' | 'resolved' | 'accepted';
export type RiskTreatment = 'accept' | 'mitigate' | 'transfer' | 'avoid';

export interface LatestEvidence {
  status: EvidenceStatus;
  summary: string;
  collectedAt: string;
}

export interface ComplianceControl {
  id: string;
  controlId: string;
  name: string;
  description: string;
  evidenceType: string;
  latestEvidence: LatestEvidence | null;
}

export interface ControlsResponse {
  controls: ComplianceControl[];
  total: number;
}

export interface AccessReviewUserRow {
  id: string;
  email: string;
  name: string | null;
  userType: string;
  isActive: boolean;
  organizationId: string | null;
  roles: string[];
  lastLoginAt: string | null;
  mfaEnabled: boolean;
  totpConfigured: boolean;
  passkeysRegistered: number;
  mfaGraceExpiresAt: string | null;
  activeSessions: number;
  createdAt: string;
}

export interface AccessReviewData {
  generatedAt: string;
  totalUsers: number;
  users: AccessReviewUserRow[];
}

export interface Policy {
  id: string;
  name: string;
  category: string;
  version: string;
  status: PolicyStatus;
  owner: string | null;
  nextReviewDate: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  content: string;
}

export interface CreatePolicyPayload {
  name: string;
  category: string;
  content: string;
  version: string;
  reviewCycleDays: number;
  owner?: string;
}

export interface Risk {
  id: string;
  asset: string;
  threat: string;
  vulnerability: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  treatment: RiskTreatment;
  treatmentDesc: string | null;
  owner: string | null;
  dueDate: string | null;
  status: RiskStatus;
  createdAt: string;
}

export interface CreateRiskPayload {
  asset: string;
  threat: string;
  vulnerability: string;
  likelihood: number;
  impact: number;
  treatment: RiskTreatment;
  treatmentDesc?: string;
  owner?: string;
  dueDate?: string;
}

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listComplianceControls(): Promise<ControlsResponse> {
  const res = await apiGet<ApiEnvelope<ControlsResponse>>(`${BASE_URL}/controls`);
  return res.data;
}

export async function getAccessReview(params: { orgId?: string } = {}): Promise<AccessReviewData> {
  const res = await apiGet<ApiEnvelope<AccessReviewData>>(`${ACCESS_REVIEW_URL}${query(params)}`);
  return res.data;
}

export async function collectComplianceEvidence(): Promise<unknown> {
  const res = await apiPost<ApiEnvelope<unknown>>(`${BASE_URL}/evidence/collect`);
  return res.data;
}

export async function getComplianceReport(): Promise<unknown> {
  const res = await apiGet<ApiEnvelope<unknown>>(`${BASE_URL}/report`);
  return res.data;
}

export async function listPolicies(params: { status?: PolicyStatus; limit?: number; offset?: number } = {}) {
  const res = await apiGet<ApiEnvelope<Policy[]>>(`${BASE_URL}/policies${query(params)}`);
  return { policies: res.data, total: res.pagination?.total ?? res.data.length };
}

export async function createPolicy(payload: CreatePolicyPayload): Promise<Policy> {
  const res = await apiPost<ApiEnvelope<Policy>>(`${BASE_URL}/policies`, payload);
  return res.data;
}

export async function deletePolicy(id: string): Promise<void> {
  await apiDelete(`${BASE_URL}/policies/${id}`);
}

export async function listRisks(params: { status?: RiskStatus; limit?: number; offset?: number } = {}) {
  const res = await apiGet<ApiEnvelope<Risk[]>>(`${BASE_URL}/risks${query(params)}`);
  return { risks: res.data, total: res.pagination?.total ?? res.data.length };
}

export async function createRisk(payload: CreateRiskPayload): Promise<Risk> {
  const res = await apiPost<ApiEnvelope<Risk>>(`${BASE_URL}/risks`, payload);
  return res.data;
}

export async function deleteRisk(id: string): Promise<void> {
  await apiDelete(`${BASE_URL}/risks/${id}`);
}
