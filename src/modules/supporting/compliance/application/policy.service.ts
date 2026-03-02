import { policyRepository } from '../infrastructure/policy.repository';
import type { CompliancePolicy, CreatePolicyInput, UpdatePolicyInput, PolicyStatus } from '../domain/policy.entity';

export async function createPolicy(input: CreatePolicyInput): Promise<CompliancePolicy> {
  return policyRepository.create(input);
}

export async function updatePolicy(
  id: string,
  organizationId: string,
  updates: UpdatePolicyInput
): Promise<CompliancePolicy | null> {
  return policyRepository.update(id, organizationId, updates);
}

export async function deletePolicy(id: string, organizationId: string): Promise<boolean> {
  return policyRepository.softDelete(id, organizationId);
}

export async function getPolicy(id: string, organizationId: string): Promise<CompliancePolicy | null> {
  return policyRepository.findById(id, organizationId);
}

export async function listPolicies(
  organizationId: string,
  options: { status?: PolicyStatus; limit?: number; offset?: number } = {}
): Promise<{ items: CompliancePolicy[]; total: number }> {
  return policyRepository.list(organizationId, options);
}
