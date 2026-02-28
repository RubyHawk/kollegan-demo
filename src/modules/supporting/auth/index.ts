// ─── Auth module public API ───────────────────────────────────────────────────
// Only export what other modules and route handlers are allowed to import.

export { login, logout, refreshTokens } from './application/auth.service';
export type { LoginInput, LoginResult } from './application/auth.service';

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
