import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@platform/auth/vapi-auth', () => ({
  validateVapiAuth: vi.fn(),
}));

vi.mock('@platform/auth/jwt', () => ({
  verifyToken: vi.fn(),
  isTokenBlacklisted: vi.fn(),
  isUserBlacklisted: vi.fn(),
  verifyMfaChallengeToken: vi.fn(),
}));

vi.mock('@platform/cache/rate-limiter', () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock('@platform/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@modules/supporting/auth/application/webauthn.service', () => ({
  beginRegistration: vi.fn(),
  completeRegistration: vi.fn(),
  beginAuthentication: vi.fn(),
  completeAuthentication: vi.fn(),
  listCredentials: vi.fn(),
  renameCredential: vi.fn(),
  deleteCredential: vi.fn(),
}));

vi.mock('@modules/supporting/auth/application/auth.service', () => ({
  completeMfaLogin: vi.fn(),
}));

vi.mock('@modules/supporting/auth/application/auth-audit.service', () => ({
  AUTH_AUDIT_ACTIONS: {
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
    USER_PASSKEY_DELETED: 'USER_PASSKEY_DELETED',
  },
  recordAuthAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@modules/supporting/auth/infrastructure/user.repository', () => ({
  userRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('@modules/supporting/auth/api/handlers/auth-handler.utils', () => ({
  assertStepUpForFactorMutation: vi.fn(),
  verifyAccessPayload: vi.fn(),
}));

import { handleDeletePasskey } from '@modules/supporting/auth/api/handlers/webauthn.handler';
import { deleteCredential } from '@modules/supporting/auth/application/webauthn.service';
import { verifyAccessPayload } from '@modules/supporting/auth/api/handlers/auth-handler.utils';
import {
  isTokenBlacklisted,
  makeReq,
  resetApiHandlerMocks,
  verifyToken,
  type JWTPayload,
} from './api-handler.test-utils';

beforeEach(() => {
  resetApiHandlerMocks();
  vi.mocked(verifyToken).mockResolvedValue({
    sub: 'usr_1',
    role: 'staff',
    roles: ['staff'],
    type: 'access',
    jti: 'jti_1',
    iat: Math.floor(Date.now() / 1000),
    amr: ['otp'],
  } as JWTPayload);
  vi.mocked(verifyAccessPayload).mockResolvedValue({
    sub: 'usr_1',
    role: 'staff',
    roles: ['staff'],
    type: 'access',
    jti: 'jti_1',
    iat: Math.floor(Date.now() / 1000),
    amr: ['otp'],
  } as JWTPayload);
});

describe('WebAuthn credential deletion', () => {
  it('rejects blacklisted tokens before deleting passkeys', async () => {
    vi.mocked(isTokenBlacklisted).mockResolvedValue(true);

    const res = await handleDeletePasskey(makeReq({
      method: 'DELETE',
      url: 'http://localhost/api/v1/auth/webauthn/credentials/cred_1',
      headers: { authorization: 'Bearer valid.jwt.token' },
      contentType: null,
    }));

    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
    expect(deleteCredential).not.toHaveBeenCalled();
    expect(verifyAccessPayload).not.toHaveBeenCalled();
  });

  it('clears auth cookies after removing a passkey', async () => {
    const res = await handleDeletePasskey(makeReq({
      method: 'DELETE',
      url: 'http://localhost/api/v1/auth/webauthn/credentials/cred_1',
      headers: { authorization: 'Bearer valid.jwt.token' },
      contentType: null,
    }));

    expect(res.status).toBe(200);
    expect(deleteCredential).toHaveBeenCalledWith('cred_1', 'usr_1');
    expect(res.headers.get('set-cookie')).toContain('token=');
    expect(res.headers.get('set-cookie')).toContain('at=');
    expect(res.headers.get('X-Request-Id')).toMatch(/^req_/);
  });
});
