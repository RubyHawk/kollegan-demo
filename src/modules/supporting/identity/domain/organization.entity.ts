/**
 * Identity & Organization domain types.
 *
 * Multi-tenancy root. Every tenant-owned record points to an Organization.
 * Identity is a supporting domain — it serves the core automation domain
 * by providing org context for every request and every domain event.
 */

export type OrgPlan = 'dev' | 'demo' | 'starter' | 'growth' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  /** URL-safe unique identifier, e.g. 'grand-hotel-kollegan' */
  slug: string;
  plan: OrgPlan;
  createdAt: string;
  updatedAt: string;
}

export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface OrgMember {
  id: string;
  orgId: string;
  staffUserId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface CreateOrgInput {
  name: string;
  slug: string;
  plan?: OrgPlan;
}
