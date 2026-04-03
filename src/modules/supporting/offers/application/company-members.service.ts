import { logger } from '@platform/logging/logger';
import bcrypt from 'bcryptjs';
import { companiesRepository } from '../infrastructure/companies.repository';
import { userRepository } from '@modules/supporting/auth';

const TAG = 'CompanyMembersService';

export interface CreateCompanyMemberAccountInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'staff' | 'admin';
}

export async function listCompanyMembers(companyId: string, orgId: string) {
  const [members, availableUsers] = await Promise.all([
    companiesRepository.listMembers(companyId, orgId),
    companiesRepository.listAssignableUsers(orgId),
  ]);

  return {
    members,
    availableUsers,
  };
}

export async function upsertCompanyMember(
  companyId: string,
  orgId: string,
  userId: string,
  role: 'staff' | 'admin',
  grantedBy?: string,
) {
  const member = await companiesRepository.upsertMember({
    companyId,
    organizationId: orgId,
    userId,
    role,
    grantedBy,
  });

  logger.info(TAG, 'Company member upserted', { companyId, userId, role });
  return member;
}

export async function createCompanyMemberAccount(
  companyId: string,
  orgId: string,
  input: CreateCompanyMemberAccountInput,
  grantedBy?: string,
) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await userRepository.findByEmail(normalizedEmail);
  if (existing && existing.deletedAt === null) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const mfaGraceExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const user = await userRepository.create({
    email: normalizedEmail,
    passwordHash,
    firstName: input.firstName?.trim() || undefined,
    lastName: input.lastName?.trim() || undefined,
    userType: 'staff',
    organizationId: orgId,
    mfaGraceExpiresAt,
  });

  const staffRole = await userRepository.findRoleByName('user');
  if (!staffRole) {
    throw new Error('DEFAULT_ROLE_MISSING');
  }

  await userRepository.assignRole(user.id, staffRole.id, orgId, grantedBy);
  const member = await upsertCompanyMember(companyId, orgId, user.id, input.role, grantedBy);

  logger.info(TAG, 'Company member account created', {
    companyId,
    userId: user.id,
    email: normalizedEmail,
    role: input.role,
  });

  return member;
}

export async function removeCompanyMember(companyId: string, orgId: string, userId: string) {
  const deleted = await companiesRepository.removeMember(companyId, orgId, userId);
  if (deleted) {
    logger.info(TAG, 'Company member removed', { companyId, userId });
  }
  return deleted;
}
