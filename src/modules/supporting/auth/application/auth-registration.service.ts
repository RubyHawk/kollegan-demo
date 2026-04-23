import bcrypt from 'bcryptjs';
import { login } from './auth.service';
import { userRepository } from '../infrastructure/user.repository';
import { authOrganizationRepository } from '../infrastructure/auth-organization.repository';

export interface RegisterStaffAccountInput {
  email: string;
  password: string;
  orgName?: string;
}

export interface RegisterStaffAccountResult {
  user: {
    id: string;
    email: string;
  };
  accessToken?: string;
  refreshToken?: string;
}

function buildOrgSlugBase(email: string): string {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24);
}

async function createPersonalOrganization(email: string, orgName?: string) {
  const slugBase = buildOrgSlugBase(email);
  const resolvedOrgName = orgName?.trim() || `${email.split('@')[0]}'s Organization`;
  const plan = process.env.NODE_ENV === 'production' ? 'starter' : 'dev';

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = Date.now().toString(36).slice(-4);
    const slug = attempt === 0 ? `${slugBase}-${suffix}` : `${slugBase}-${suffix}-${attempt}`;
    const existing = await authOrganizationRepository.findBySlug(slug);
    if (!existing) {
      return authOrganizationRepository.create({ name: resolvedOrgName, slug, plan });
    }
  }

  throw Object.assign(new Error('Unable to provision organization'), { code: 'ORG_CREATE_FAILED' });
}

export async function registerStaffAccount(input: RegisterStaffAccountInput): Promise<RegisterStaffAccountResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw Object.assign(new Error('An account with that email already exists.'), { code: 'EMAIL_EXISTS' });
  }

  const org = await createPersonalOrganization(email, input.orgName);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const mfaGraceExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const user = await userRepository.create({
    email,
    passwordHash,
    userType: 'staff',
    organizationId: org.id,
    mfaGraceExpiresAt,
  });

  const adminRole = await userRepository.findRoleByName('admin');
  if (adminRole) {
    await userRepository.assignRole(user.id, adminRole.id, org.id, user.id);
  }

  try {
    const loginOutcome = await login({ email, password: input.password });
    if (!('status' in loginOutcome)) {
      return {
        user: { id: user.id, email: user.email },
        accessToken: loginOutcome.accessToken,
        refreshToken: loginOutcome.refreshToken,
      };
    }
  } catch {
    // Preserve existing behavior: account is created even if auto-login fails.
  }

  return {
    user: { id: user.id, email: user.email },
  };
}
