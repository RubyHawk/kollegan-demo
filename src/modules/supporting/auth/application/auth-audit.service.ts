import { logger } from '@platform/logging/logger';
import { authAuditRepository } from '../infrastructure/auth-audit.repository';

const TAG = 'AuthAuditService';

export const AUTH_AUDIT_ACTIONS = {
  USER_LOGIN: 'user.login',
  USER_LOGIN_FAILED: 'user.login_failed',
  USER_LOGOUT: 'user.logout',
  USER_TOKEN_REFRESHED: 'user.token_refreshed',
  USER_MFA_TOTP_SETUP_STARTED: 'user.mfa_totp_setup_started',
  USER_MFA_TOTP_ENABLED: 'user.mfa_totp_enabled',
  USER_MFA_TOTP_DISABLED: 'user.mfa_totp_disabled',
  USER_MFA_BACKUP_CODES_REGENERATED: 'user.mfa_backup_codes_regenerated',
  USER_MFA_BACKUP_CODE_USED: 'user.mfa_backup_code_used',
  USER_PASSKEY_REGISTERED: 'user.passkey_registered',
  USER_PASSKEY_RENAMED: 'user.passkey_renamed',
  USER_PASSKEY_DELETED: 'user.passkey_deleted',
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
