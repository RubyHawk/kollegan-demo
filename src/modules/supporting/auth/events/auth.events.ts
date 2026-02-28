// ─── Auth domain events ───────────────────────────────────────────────────────

export const USER_LOGGED_IN = 'user.logged_in';
export const USER_LOGGED_OUT = 'user.logged_out';
export const USER_LOGIN_FAILED = 'user.login_failed';
export const PASSWORD_CHANGED = 'user.password_changed';

export interface UserLoggedInEvent {
  type: typeof USER_LOGGED_IN;
  orgId: string | null;
  occurredAt: string;
  payload: {
    userId: string;
    email: string;
    userType: 'staff' | 'customer';
    ipAddress: string | null;
  };
}

export interface UserLoggedOutEvent {
  type: typeof USER_LOGGED_OUT;
  orgId: string | null;
  occurredAt: string;
  payload: {
    userId: string;
    jti: string;
  };
}

export interface UserLoginFailedEvent {
  type: typeof USER_LOGIN_FAILED;
  orgId: null;
  occurredAt: string;
  payload: {
    email: string;
    ipAddress: string | null;
    reason: string;
  };
}
