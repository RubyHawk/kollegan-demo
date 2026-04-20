export type LegacyStaffRole = 'receptionist' | 'manager' | 'admin';

export interface LegacyStaffUser {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  lastLogin: Date | null;
}

export interface CreateLegacyStaffUserInput {
  email: string;
  password: string;
  role: LegacyStaffRole;
}
