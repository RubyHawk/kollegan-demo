// ─── Audit log entity ─────────────────────────────────────────────────────────
// Append-only. No updates. No deletes. Ever.

export type ActorType = 'user' | 'system' | 'api_key';

export interface AuditLogEntry {
  id: string;
  organizationId: string | null;
  actorId: string | null;    // tombstone UUID on GDPR deletion — never null/removed
  actorType: ActorType;
  action: string;            // 'user.login', 'lead.stage_changed', 'portal.provisioned'
  resourceType: string;      // 'User', 'Lead', 'WorkflowRun', 'Portal'
  resourceId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  occurredAt: Date;
}

export interface CreateAuditLogInput {
  organizationId?: string | null;
  actorId?: string | null;
  actorType?: ActorType;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

// Well-known action constants
export const AUDIT_ACTIONS = {
  // Auth
  USER_LOGIN: 'user.login',
  USER_LOGIN_FAILED: 'user.login_failed',
  USER_LOGOUT: 'user.logout',
  USER_TOKEN_REFRESHED: 'user.token_refreshed',
  USER_SESSIONS_REVOKED: 'user.sessions_revoked',
  USER_CREATED: 'user.created',
  USER_DEACTIVATED: 'user.deactivated',
  PASSWORD_CHANGED: 'user.password_changed',
  EMAIL_VERIFIED: 'user.email_verified',

  // Portal
  PORTAL_PROVISIONED: 'portal.provisioned',
  PORTAL_MEMBER_INVITED: 'portal.member_invited',
  PORTAL_MEMBER_JOINED: 'portal.member_joined',

  // Leads
  LEAD_CREATED: 'lead.created',
  LEAD_STAGE_CHANGED: 'lead.stage_changed',
  LEAD_CONVERTED: 'lead.converted',
  LEAD_DELETED: 'lead.deleted',

  // Feature flags
  FEATURE_FLAG_CREATED: 'feature_flag.created',
  FEATURE_FLAG_UPDATED: 'feature_flag.updated',
  FEATURE_FLAG_DELETED: 'feature_flag.deleted',
} as const;
