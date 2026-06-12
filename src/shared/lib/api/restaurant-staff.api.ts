import { apiDelete, apiGet, apiPatch, apiPost } from '../api-client';

interface ApiEnvelope<T> {
  data: T;
}

export type RestaurantStaffRole =
  | 'restaurant_owner'
  | 'restaurant_manager'
  | 'restaurant_staff'
  | 'restaurant_kitchen'
  | 'restaurant_accountant';

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

export interface CreateRestaurantStaffPayload {
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  employeeCode: string;
  roles: RestaurantStaffRole[];
  pin: string;
}

export interface UpdateRestaurantStaffPayload {
  firstName?: string;
  lastName?: string | null;
  email?: string | null;
  employeeCode?: string;
  roles?: RestaurantStaffRole[];
  isActive?: boolean;
}

export async function listRestaurantStaff(): Promise<RestaurantStaffMember[]> {
  const res = await apiGet<ApiEnvelope<{ staff: RestaurantStaffMember[] }>>('/api/v1/restaurant/staff');
  return res.data.staff;
}

export async function createRestaurantStaff(payload: CreateRestaurantStaffPayload): Promise<RestaurantStaffMember> {
  const res = await apiPost<ApiEnvelope<{ staff: RestaurantStaffMember }>>('/api/v1/restaurant/staff', payload);
  return res.data.staff;
}

export async function updateRestaurantStaff(
  id: string,
  payload: UpdateRestaurantStaffPayload,
): Promise<RestaurantStaffMember> {
  const res = await apiPatch<ApiEnvelope<{ staff: RestaurantStaffMember }>>(`/api/v1/restaurant/staff/${id}`, payload);
  return res.data.staff;
}

export async function resetRestaurantStaffPin(id: string, pin: string): Promise<RestaurantStaffMember> {
  const res = await apiPost<ApiEnvelope<{ staff: RestaurantStaffMember }>>(`/api/v1/restaurant/staff/${id}/pin`, { pin });
  return res.data.staff;
}

export async function deactivateRestaurantStaff(id: string): Promise<void> {
  await apiDelete(`/api/v1/restaurant/staff/${id}`);
}
