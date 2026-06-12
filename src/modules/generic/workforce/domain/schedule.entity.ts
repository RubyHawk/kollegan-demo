export type StaffScheduleShiftStatus = 'scheduled' | 'completed' | 'cancelled';

export interface StaffScheduleShift {
  id: string;
  organizationId: string;
  userId: string;
  startsAt: string;
  endsAt: string;
  roleLabel: string | null;
  notes: string | null;
  status: StaffScheduleShiftStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffScheduleShiftWithUser extends StaffScheduleShift {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface ScheduleMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface CreateScheduleShiftInput {
  userId: string;
  startsAt: string;
  endsAt: string;
  roleLabel?: string | null;
  notes?: string | null;
}

export interface UpdateScheduleShiftInput {
  startsAt?: string;
  endsAt?: string;
  roleLabel?: string | null;
  notes?: string | null;
  status?: StaffScheduleShiftStatus;
}

export interface ListScheduleShiftsInput {
  from: string;
  to: string;
}
