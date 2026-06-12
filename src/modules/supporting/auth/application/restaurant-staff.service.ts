import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { Errors } from '@platform/api/errors';
import { organizationHasModule } from '@modules/supporting/identity';
import { restaurantStaffRepository } from '../infrastructure/restaurant-staff.repository';
import type {
  CreateRestaurantStaffInput,
  ResetRestaurantStaffPinInput,
  RestaurantStaffMember,
  RestaurantStaffRole,
  UpdateRestaurantStaffInput,
} from '../domain/restaurant-staff.entity';

const SALT_ROUNDS = 12;
const EMPLOYEE_CODE_PATTERN = /^[a-z0-9][a-z0-9._-]{1,31}$/;
const MANAGER_ASSIGNABLE_ROLES: RestaurantStaffRole[] = ['restaurant_staff', 'restaurant_kitchen'];
const OWNER_ASSIGNABLE_ROLES: RestaurantStaffRole[] = [
  'restaurant_owner',
  'restaurant_manager',
  'restaurant_staff',
  'restaurant_kitchen',
  'restaurant_accountant',
];

function normalizeEmployeeCode(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function normalizeEmail(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || null;
}

function generatedStaffEmail(organizationId: string, employeeCode: string): string {
  return `${employeeCode}.${organizationId.slice(0, 8)}@staff.local.invalid`;
}

function validateEmployeeCode(employeeCode: string): string {
  const normalized = normalizeEmployeeCode(employeeCode);
  if (!EMPLOYEE_CODE_PATTERN.test(normalized)) {
    throw Errors.validation('Employee code must be 2-32 lowercase letters, numbers, dots, dashes, or underscores');
  }
  return normalized;
}

function validatePin(pin: string): string {
  const trimmed = pin.trim();
  if (!/^\d{4,8}$/.test(trimmed)) {
    throw Errors.validation('PIN must contain 4-8 digits');
  }
  return trimmed;
}

async function requireClockInModule(organizationId: string) {
  const enabled = await organizationHasModule(organizationId, 'clock_in');
  if (!enabled) throw Errors.forbidden('Clock-in module is not enabled for this organization');
}

function allowedRolesForActor(actorRoles: string[]): RestaurantStaffRole[] {
  if (actorRoles.includes('super_admin') || actorRoles.includes('admin') || actorRoles.includes('restaurant_owner')) {
    return OWNER_ASSIGNABLE_ROLES;
  }
  if (actorRoles.includes('restaurant_manager')) return MANAGER_ASSIGNABLE_ROLES;
  return [];
}

function assertCanManageRoles(
  actorRoles: string[],
  targetRoles: RestaurantStaffRole[],
  existingRoles: RestaurantStaffRole[] = [],
) {
  if (targetRoles.length === 0) throw Errors.validation('At least one restaurant role is required');

  const allowed = allowedRolesForActor(actorRoles);
  if (allowed.length === 0) throw Errors.forbidden('You cannot manage restaurant staff');

  const attemptedRoles = [...new Set([...targetRoles, ...existingRoles])];
  const disallowed = attemptedRoles.filter((role) => !allowed.includes(role));
  if (disallowed.length > 0) {
    throw Errors.forbidden('Managers can only manage restaurant staff and kitchen roles');
  }
}

async function assertEmployeeCodeAvailable(
  organizationId: string,
  employeeCode: string,
  currentUserId?: string,
) {
  const existing = await restaurantStaffRepository.findByEmployeeCode(organizationId, employeeCode);
  if (existing && existing.id !== currentUserId) {
    throw Errors.conflict('Employee code is already in use');
  }
}

export async function listRestaurantStaff(organizationId: string): Promise<RestaurantStaffMember[]> {
  await requireClockInModule(organizationId);
  return restaurantStaffRepository.list(organizationId);
}

export async function createRestaurantStaff(
  organizationId: string,
  actorId: string,
  actorRoles: string[],
  input: CreateRestaurantStaffInput,
): Promise<RestaurantStaffMember> {
  await requireClockInModule(organizationId);
  assertCanManageRoles(actorRoles, input.roles);

  const employeeCode = validateEmployeeCode(input.employeeCode);
  await assertEmployeeCodeAvailable(organizationId, employeeCode);

  const pin = validatePin(input.pin);
  const clockPinHash = await bcrypt.hash(pin, SALT_ROUNDS);
  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), SALT_ROUNDS);
  const email = normalizeEmail(input.email) ?? generatedStaffEmail(organizationId, employeeCode);

  return restaurantStaffRepository.create({
    organizationId,
    email,
    passwordHash,
    firstName: input.firstName.trim(),
    lastName: input.lastName?.trim() || null,
    employeeCode,
    clockPinHash,
    roles: input.roles,
    actorId,
  });
}

export async function updateRestaurantStaff(
  organizationId: string,
  userId: string,
  actorId: string,
  actorRoles: string[],
  input: UpdateRestaurantStaffInput,
): Promise<RestaurantStaffMember> {
  await requireClockInModule(organizationId);

  const existing = await restaurantStaffRepository.findById(organizationId, userId);
  if (!existing) throw Errors.notFound('Restaurant staff member not found');

  const roles = input.roles ?? existing.roles;
  assertCanManageRoles(actorRoles, roles, existing.roles);

  const employeeCode = input.employeeCode !== undefined
    ? validateEmployeeCode(input.employeeCode)
    : undefined;
  if (employeeCode) await assertEmployeeCodeAvailable(organizationId, employeeCode, userId);

  const staff = await restaurantStaffRepository.update(organizationId, userId, actorId, {
    ...(input.email !== undefined ? { email: normalizeEmail(input.email) ?? generatedStaffEmail(organizationId, employeeCode ?? existing.employeeCode ?? userId.slice(0, 8)) } : {}),
    ...(input.firstName !== undefined ? { firstName: input.firstName.trim() } : {}),
    ...(input.lastName !== undefined ? { lastName: input.lastName?.trim() || null } : {}),
    ...(employeeCode !== undefined ? { employeeCode } : {}),
    ...(input.roles !== undefined ? { roles } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  });
  if (!staff) throw Errors.notFound('Restaurant staff member not found');
  return staff;
}

export async function resetRestaurantStaffPin(
  organizationId: string,
  userId: string,
  actorRoles: string[],
  input: ResetRestaurantStaffPinInput,
): Promise<RestaurantStaffMember> {
  await requireClockInModule(organizationId);

  const existing = await restaurantStaffRepository.findById(organizationId, userId);
  if (!existing) throw Errors.notFound('Restaurant staff member not found');
  assertCanManageRoles(actorRoles, existing.roles, existing.roles);

  const clockPinHash = await bcrypt.hash(validatePin(input.pin), SALT_ROUNDS);
  const staff = await restaurantStaffRepository.setPinHash(organizationId, userId, clockPinHash);
  if (!staff) throw Errors.notFound('Restaurant staff member not found');
  return staff;
}

export async function deactivateRestaurantStaff(
  organizationId: string,
  userId: string,
  actorId: string,
  actorRoles: string[],
): Promise<void> {
  await requireClockInModule(organizationId);
  if (userId === actorId) throw Errors.conflict('You cannot deactivate your own account');

  const existing = await restaurantStaffRepository.findById(organizationId, userId);
  if (!existing) throw Errors.notFound('Restaurant staff member not found');
  assertCanManageRoles(actorRoles, existing.roles, existing.roles);

  const ok = await restaurantStaffRepository.deactivate(organizationId, userId);
  if (!ok) throw Errors.notFound('Restaurant staff member not found');
}
