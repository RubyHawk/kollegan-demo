// ─── Auth module public API ───────────────────────────────────────────────────
// Only export what other modules and route handlers are allowed to import.

export { login, logout, refreshTokens, revokeAllSessions, completeMfaLogin, getUserOrganizationId, listActiveSessions } from './application/auth.service';
export type { LoginInput, LoginResult, MfaChallengeResult, LoginOutcome } from './application/auth.service';
export { changeAccountPassword, getAccountProfile, updateAccountProfile } from './application/account.service';
export { getSessionUser } from './application/server-session.service';
export type {
  AccountProfile,
  ChangeAccountPasswordInput,
  ThemeFontSize,
  ThemeMode,
  UpdateAccountProfileInput,
} from './application/account.service';
export { createDevelopmentAccessToken } from './application/dev-login.service';
export { createLegacyStaffUser, deleteLegacyStaffUser, listLegacyStaffUsers } from './application/staff-users.service';
export type {
  CreateLegacyStaffUserInput,
  LegacyStaffRole,
  LegacyStaffUser,
} from './domain/staff-user.entity';

export {
  generateTotpSetup,
  verifyTotpCode,
  enableTotp,
  disableMfa,
  regenerateBackupCodes,
  getBackupCodeCount,
  consumeBackupCode,
  getMfaStatus,
  resetMfaForRecovery,
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
export type { Session, CreateSessionInput, SessionUser } from './domain/session.entity';
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
export { handleChangePassword, handleGetProfile, handleUpdateProfile } from './api/handlers/account.handler';
export { handleDevLogin } from './api/handlers/dev-login.handler';
export {
  handleCreateStaff,
  handleDeleteStaff,
  handleListStaff,
} from './api/handlers/staff.handler';
export {
  handleMfaStatus,
  handleMfaSetup,
  handleMfaEnable,
  handleMfaDisable,
  handleBackupCodeCount,
  handleRegenerateBackupCodes,
  handleListSessions,
  handleResetUserMfa,
  handleMfaVerify,
} from './api/handlers/mfa.handler';
export {
  handleRegisterOptions,
  handleRegisterVerify,
  handleAuthenticateOptions,
  handleAuthenticateVerify,
  handleListPasskeys,
  handleDeletePasskey,
} from './api/handlers/webauthn.handler';
