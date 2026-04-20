import bcrypt from 'bcryptjs';
import { staffUsersRepository } from '../infrastructure/staff-users.repository';
import type { CreateLegacyStaffUserInput, LegacyStaffUser } from '../domain/staff-user.entity';

const SALT_ROUNDS = 12;

export async function listLegacyStaffUsers(): Promise<LegacyStaffUser[]> {
  return staffUsersRepository.list();
}

export async function createLegacyStaffUser(input: CreateLegacyStaffUserInput): Promise<Omit<LegacyStaffUser, 'lastLogin'>> {
  const existing = await staffUsersRepository.findByEmail(input.email);
  if (existing) {
    throw Object.assign(new Error('A user with this email already exists'), { code: 'STAFF_EMAIL_EXISTS' });
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  return staffUsersRepository.create({
    email: input.email,
    passwordHash,
    role: input.role,
  });
}

export async function deleteLegacyStaffUser(id: string): Promise<void> {
  await staffUsersRepository.delete(id);
}
