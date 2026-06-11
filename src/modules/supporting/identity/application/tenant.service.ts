import {
  listEnabledTenantModules,
  normalizeTenantHost as normalizePlatformTenantHost,
  resolveTenantByHost as resolvePlatformTenantByHost,
  tenantHasModule,
} from '@platform/tenancy/tenant-resolver';
import type { TenantResolution } from '../domain/tenant.entity';

export function normalizeTenantHost(host: string | null | undefined): string {
  return normalizePlatformTenantHost(host);
}

export async function resolveTenantByHost(host: string | null | undefined): Promise<TenantResolution | null> {
  return resolvePlatformTenantByHost(host);
}

export async function listEnabledOrganizationModules(organizationId: string): Promise<string[]> {
  return listEnabledTenantModules(organizationId);
}

export async function organizationHasModule(organizationId: string, moduleKey: string): Promise<boolean> {
  return tenantHasModule(organizationId, moduleKey);
}
