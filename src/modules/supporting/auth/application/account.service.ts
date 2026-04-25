import bcrypt from 'bcryptjs';
import { identityService } from '@modules/supporting/identity';
import { userRepository } from '../infrastructure/user.repository';
import { revokeAllSessions } from './auth.service';
import type {
  AccountProfile,
  ThemeFontSize,
  ThemeMode,
  UpdateAccountProfileData,
} from '../domain/account.entity';

export type { AccountProfile, ThemeFontSize, ThemeMode };

export interface UpdateAccountProfileInput {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  themeMode?: ThemeMode;
  themeAccent?: string;
  themeFontFamily?: string;
  themeFontSize?: ThemeFontSize;
}

export interface ChangeAccountPasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function getAccountProfile(userId: string): Promise<AccountProfile | null> {
  const profile = await userRepository.findAccountProfile(userId);
  if (!profile) return null;

  const organizationId = await userRepository.findOrganizationIdById(userId);
  if (!organizationId) return profile;

  const organization = await identityService.getOrg(organizationId);
  if (!organization) return profile;

  return {
    ...profile,
    organizationThemeMode: organization.themeMode ?? null,
    organizationThemeAccent: organization.themeAccent ?? null,
    organizationThemeFontFamily: organization.themeFontFamily ?? null,
    organizationThemeFontSize: organization.themeFontSize ?? null,
  };
}

export async function updateAccountProfile(userId: string, input: UpdateAccountProfileInput): Promise<void> {
  const data: UpdateAccountProfileData = {};

  if (input.firstName !== undefined) data.firstName = input.firstName || null;
  if (input.lastName !== undefined) data.lastName = input.lastName || null;
  if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;
  if (input.themeMode !== undefined) data.themeMode = input.themeMode || null;
  if (input.themeAccent !== undefined) data.themeAccent = input.themeAccent || null;
  if (input.themeFontFamily !== undefined) data.themeFontFamily = input.themeFontFamily || null;
  if (input.themeFontSize !== undefined) data.themeFontSize = input.themeFontSize || null;

  await userRepository.updateAccountProfile(userId, data);
}

export async function changeAccountPassword(userId: string, input: ChangeAccountPasswordInput): Promise<void> {
  if (input.newPassword !== input.confirmPassword) {
    throw Object.assign(new Error('Passwords do not match'), { code: 'PASSWORD_MISMATCH' });
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { code: 'USER_NOT_FOUND' });
  }

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid current password'), { code: 'INVALID_CURRENT_PASSWORD' });
  }

  const newHash = await bcrypt.hash(input.newPassword, 12);
  await userRepository.updatePasswordHash(user.id, newHash);
  await revokeAllSessions(user.id);
}
