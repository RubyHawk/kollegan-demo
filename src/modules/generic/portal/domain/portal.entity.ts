export type PortalMemberStatus = 'invited' | 'active' | 'suspended';

export interface Portal {
  id: string;
  organizationId: string;
  slug: string;
  isActive: boolean;
  customDomain: string | null;
  createdAt: Date;
  updatedAt: Date;
  provisionedBy: string | null;
  provisionedAt: Date | null;
}

export interface PortalMember {
  id: string;
  portalId: string;
  userId: string;
  organizationId: string | null;
  inviteEmail: string | null;
  status: PortalMemberStatus;
  invitedAt: Date;
  joinedAt: Date | null;
}

export interface CreatePortalInput {
  organizationId: string;
  slug: string;
  provisionedBy?: string;
}
