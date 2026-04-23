/**
 * Identity & Organization domain types.
 *
 * Multi-tenancy root. Every tenant-owned record points to an Organization.
 * Identity is a supporting domain — it serves the core automation domain
 * by providing org context for every request and every domain event.
 */

export type OrgPlan = 'dev' | 'demo' | 'starter' | 'growth' | 'enterprise';

export type {
  ActiveNotificationTag,
  NotificationRecipient,
  NotificationTag,
  NotificationTagDefinition,
  NotificationTagScope,
} from './notification-routing';

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
  /** Default internal app theme mode for org members */
  themeMode?: string;
  /** Default internal app accent theme for org members */
  themeAccent?: string;
  /** Default internal app font family for org members */
  themeFontFamily?: string;
  /** Default internal app font size for org members */
  themeFontSize?: string;
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
