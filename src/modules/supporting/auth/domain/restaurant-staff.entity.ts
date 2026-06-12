import type { RoleName } from './role.entity';

export type RestaurantStaffRole =
  | 'restaurant_owner'
  | 'restaurant_manager'
  | 'restaurant_staff'
  | 'restaurant_kitchen'
  | 'restaurant_accountant';

export const RESTAURANT_STAFF_ROLES: RestaurantStaffRole[] = [
  'restaurant_owner',
  'restaurant_manager',
  'restaurant_staff',
  'restaurant_kitchen',
  'restaurant_accountant',
];

export interface RestaurantStaffMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  employeeCode: string | null;
  isActive: boolean;
  clockPinUpdatedAt: string | null;
  roles: RestaurantStaffRole[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRestaurantStaffInput {
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  employeeCode: string;
  roles: RestaurantStaffRole[];
  pin: string;
}

export interface UpdateRestaurantStaffInput {
  firstName?: string;
  lastName?: string | null;
  email?: string | null;
  employeeCode?: string;
  roles?: RestaurantStaffRole[];
  isActive?: boolean;
}

export interface ResetRestaurantStaffPinInput {
  pin: string;
}

export function isRestaurantStaffRole(role: RoleName | string): role is RestaurantStaffRole {
  return (RESTAURANT_STAFF_ROLES as string[]).includes(role);
}
