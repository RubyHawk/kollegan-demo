/**
 * Identity & Organization domain types.
 *
 * Multi-tenancy root. Every tenant-owned record points to an Organization.
 * Identity is a supporting domain — it serves the core automation domain
 * by providing org context for every request and every domain event.
 */

export type OrgPlan = 'dev' | 'demo' | 'starter' | 'growth' | 'enterprise';

/** Notification event tags. Extend as new features are added. */
export type NotificationTag = 'offer_signed' | 'offer_declined';

export interface NotificationRecipient {
  id: string;           // client-generated uuid — used as React key + delete target
  email: string;
  tags: NotificationTag[];
}

export interface Organization {
  id: string;
  name: string;
  /** URL-safe unique identifier, e.g. 'grand-hotel-kollegan' */
  slug: string;
  plan: OrgPlan;
  createdAt: string;
  updatedAt: string;
  /** Custom sender email for outgoing offers (must be verified in Resend) */
  senderEmail?: string;
  /** Display name in the From header, e.g. "Acme AB" */
  senderName?: string;
  /** JSON config for default visual email header */
  emailHeaderConfig?: string;
  /** Serialised NotificationRecipient[] — who gets which notification emails */
  notificationRecipients?: string;
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
