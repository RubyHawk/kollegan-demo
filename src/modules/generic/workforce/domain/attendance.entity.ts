export interface AttendanceShift {
  id: string;
  organizationId: string;
  userId: string;
  clockInAt: string;
  clockOutAt: string | null;
  status: 'active' | 'completed' | 'corrected';
  clockInSource: string | null;
  clockOutSource: string | null;
  deviceLabel: string | null;
  location: string | null;
  correctedBy: string | null;
  correctionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceShiftWithUser extends AttendanceShift {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface ClockableStaffMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  employeeCode: string | null;
  clockPinUpdatedAt: string | null;
  activeShift: AttendanceShift | null;
}

export interface ClockInInput {
  deviceLabel?: string | null;
  location?: string | null;
  source?: 'portal' | 'kiosk';
}

export interface ClockOutInput {
  deviceLabel?: string | null;
  location?: string | null;
  source?: 'portal' | 'kiosk';
}

export interface CorrectAttendanceShiftInput {
  clockInAt?: string;
  clockOutAt?: string | null;
  status?: 'active' | 'completed' | 'corrected';
  correctionReason: string;
}
