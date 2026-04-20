import { signAccessToken } from '@platform/auth/jwt';
import { DEV_ORG_ID, devLoginRepository } from '../infrastructure/dev-login.repository';

export const DEV_USER_ID = 'dev-user-01';

export async function createDevelopmentAccessToken(): Promise<string> {
  await devLoginRepository.ensureDevOrganization();

  const { token } = await signAccessToken({
    sub: DEV_USER_ID,
    orgId: DEV_ORG_ID,
    userType: 'staff',
    roles: ['admin'],
    aud: 'internal',
  });

  return token;
}
