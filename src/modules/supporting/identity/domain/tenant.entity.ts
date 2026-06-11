export type OrganizationDomainKind = 'public' | 'portal' | 'offer';

export interface OrganizationDomain {
  id: string;
  organizationId: string;
  hostname: string;
  kind: OrganizationDomainKind;
  isPrimary: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationModule {
  id: string;
  organizationId: string;
  moduleKey: string;
  enabled: boolean;
  config: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantResolution {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  hostname: string;
  kind: OrganizationDomainKind;
  enabledModules: string[];
}
