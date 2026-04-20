import { apiDelete, apiGet, apiPost } from '../api-client';

const BASE_URL = '/api/v1/staff';

export type StaffRole = 'receptionist' | 'manager' | 'admin';

export interface StaffUser {
  id: string;
  email: string;
  role: StaffRole | string;
  createdAt: string;
  lastLogin: string | null;
}

export interface CreateStaffUserPayload {
  email: string;
  password: string;
  role: StaffRole;
}

interface StaffListEnvelope {
  data: {
    users: StaffUser[];
  };
}

interface StaffUserEnvelope {
  data: {
    user: StaffUser;
  };
}

export async function listStaffUsers() {
  const res = await apiGet<StaffListEnvelope>(BASE_URL);
  return res.data.users;
}

export async function createStaffUser(payload: CreateStaffUserPayload) {
  const res = await apiPost<StaffUserEnvelope>(BASE_URL, payload);
  return res.data.user;
}

export async function deleteStaffUser(id: string) {
  await apiDelete(`${BASE_URL}?id=${encodeURIComponent(id)}`);
}
