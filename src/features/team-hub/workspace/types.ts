/**
 * Workspace — the top-level multi-tenant unit in Team Hub.
 *
 * One workspace = one organization/company. All Team Hub data is
 * scoped to a workspace. This is the foundation of the SaaS model.
 *
 * A workspace has:
 *  - Members with roles (owner, admin, member, guest)
 *  - Connected integrations (GitHub org, Slack workspace)
 *  - Billing plan (free, pro, enterprise)
 *  - Settings (name, avatar, timezone, notification prefs)
 */

export type WorkspacePlan = 'free' | 'pro' | 'enterprise';
export type WorkspaceMemberRole = 'owner' | 'admin' | 'member' | 'guest';

export interface Workspace {
  id: string;
  slug: string;                  // URL-safe identifier: "acme-corp"
  name: string;
  avatarUrl?: string;
  plan: WorkspacePlan;
  timezone: string;              // IANA timezone: "Europe/Stockholm"
  createdAt: string;
  ownerId: string;               // StaffUser.id
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;                // StaffUser.id
  role: WorkspaceMemberRole;
  joinedAt: string;
  invitedBy?: string;            // StaffUser.id
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceMemberRole;
  token: string;                 // Secure random invite token
  expiresAt: string;
  createdBy: string;
  createdAt: string;
  acceptedAt?: string;
}

export interface WorkspaceSettings {
  workspaceId: string;
  notifyOnNewBooking: boolean;
  notifyOnNewLead: boolean;
  slackNotificationChannelId?: string;
  githubRepoFilter?: string[];   // Only show these repos in Team Hub
}
