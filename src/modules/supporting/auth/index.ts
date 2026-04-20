// ─── Auth module public API ───────────────────────────────────────────────────
// Only export what other modules and route handlers are allowed to import.

export { login, logout, refreshTokens, revokeAllSessions, completeMfaLogin, getUserOrganizationId } from './application/auth.service';
export type { LoginInput, LoginResult, MfaChallengeResult, LoginOutcome } from './application/auth.service';

export {
  generateTotpSetup,
  verifyTotpCode,
  enableTotp,
  disableMfa,
  regenerateBackupCodes,
  getBackupCodeCount,
  consumeBackupCode,
  getMfaStatus,
} from './application/mfa.service';
export type { TotpSetupResult, MfaStatus } from './application/mfa.service';

export {
  beginRegistration,
  completeRegistration,
  beginAuthentication,
  completeAuthentication,
  listCredentials,
  deleteCredential,
} from './application/webauthn.service';

export { hasPermission, invalidatePermissionCache } from './application/rbac.service';

export { userRepository } from './infrastructure/user.repository';
export { sessionRepository } from './infrastructure/session.repository';

export type { User, CreateUserInput, UserType } from './domain/user.entity';
export type { Session, CreateSessionInput } from './domain/session.entity';
export type { RoleName } from './domain/role.entity';
export { SYSTEM_ROLES } from './domain/role.entity';

export {
  USER_LOGGED_IN,
  USER_LOGGED_OUT,
  USER_LOGIN_FAILED,
  PASSWORD_CHANGED,
} from './events/auth.events';
export type {
  UserLoggedInEvent,
  UserLoggedOutEvent,
  UserLoginFailedEvent,
} from './events/auth.events';

// ── API Handlers ─────────────────────────────────────────────────────────────
export { handleLogin, handleLogout, handleRefresh, handleRegister } from './api/handlers/auth.handler';
export {
  handleMfaSetup,
  handleMfaEnable,
  handleMfaDisable,
  handleBackupCodeCount,
  handleRegenerateBackupCodes,
  handleMfaVerify,
} from './api/handlers/mfa.handler';
export {
  handleRegisterOptions,
  handleRegisterVerify,
  handleAuthenticateOptions,
  handleAuthenticateVerify,
} from './api/handlers/webauthn.handler';
