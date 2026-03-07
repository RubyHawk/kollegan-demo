import type { CreatePortalInput } from '../domain/portal.entity';
import { portalRepository } from '../infrastructure/portal.repository';

export async function provisionPortal(input: CreatePortalInput) {
  const existing = await portalRepository.getByOrg(input.organizationId);
  if (existing) return existing;
  return portalRepository.create(input);
}

export async function getPortalByOrg(organizationId: string) {
  return portalRepository.getByOrg(organizationId);
}

export async function getPortalBySlug(slug: string) {
  return portalRepository.getBySlug(slug);
}
