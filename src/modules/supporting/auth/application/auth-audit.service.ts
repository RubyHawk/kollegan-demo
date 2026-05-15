import { logger } from '@platform/logging/logger';
import { authAuditRepository } from '../infrastructure/auth-audit.repository';

const TAG = 'AuthAuditService';

export const AUTH_AUDIT_ACTIONS = {
  USER_LOGIN: 'user.login',
  USER_LOGIN_FAILED: 'user.login_failed',
  USER_LOGOUT: 'user.logout',
  USER_TOKEN_REFRESHED: 'user.token_refreshed',
  USER_MFA_RESET: 'user.mfa_reset',
} as const;

export async function recordAuthAudit(input: {
  organizationId?: string | null;
  actorId?: string | null;
  actorType?: 'user' | 'system' | 'api_key';
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  await authAuditRepository.append(input);
  logger.info(TAG, `Audit: ${input.action} on ${input.resourceType}/${input.resourceId}`, {
    actorId: input.actorId,
    orgId: input.organizationId,
  });
}
