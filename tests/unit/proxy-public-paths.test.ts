import { describe, expect, it } from 'vitest';
import { isPublicPath } from '../../src/proxy';

describe('proxy public path allowlist', () => {
  it('keeps legacy and v1 auth endpoints public for signed-out flows', () => {
    expect(isPublicPath('/api/auth/login')).toBe(true);
    expect(isPublicPath('/api/v1/auth/login')).toBe(true);
    expect(isPublicPath('/api/v1/auth/mfa/verify')).toBe(true);
    expect(isPublicPath('/api/v1/auth/webauthn/authenticate/options')).toBe(true);
  });

  it('does not make unrelated v1 API routes public', () => {
    expect(isPublicPath('/api/v1/projekt')).toBe(false);
    expect(isPublicPath('/api/v1/companies')).toBe(false);
  });
});
