import { apiGet, apiPatch, apiPost } from '../api-client';

interface ApiEnvelope<T> {
  data: T;
}

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

export async function getCurrentAttendanceShift(): Promise<AttendanceShift | null> {
  const res = await apiGet<ApiEnvelope<{ shift: AttendanceShift | null }>>('/api/v1/attendance/current');
  return res.data.shift;
}

export async function clockIn(payload: { deviceLabel?: string | null; location?: string | null } = {}): Promise<AttendanceShift> {
  const res = await apiPost<ApiEnvelope<{ shift: AttendanceShift }>>('/api/v1/attendance/clock-in', payload);
  return res.data.shift;
}

export async function clockOut(payload: { deviceLabel?: string | null; location?: string | null } = {}): Promise<AttendanceShift> {
  const res = await apiPost<ApiEnvelope<{ shift: AttendanceShift }>>('/api/v1/attendance/clock-out', payload);
  return res.data.shift;
}

export async function listTodayAttendance(): Promise<AttendanceShiftWithUser[]> {
  const res = await apiGet<ApiEnvelope<{ shifts: AttendanceShiftWithUser[] }>>('/api/v1/attendance/today');
  return res.data.shifts;
}

export async function listKioskClockableStaff(): Promise<ClockableStaffMember[]> {
  const res = await apiGet<ApiEnvelope<{ staff: ClockableStaffMember[] }>>('/api/v1/attendance/kiosk/staff');
  return res.data.staff;
}

export async function kioskClockIn(payload: {
  userId: string;
  pin: string;
  deviceLabel?: string | null;
  location?: string | null;
}): Promise<AttendanceShift> {
  const res = await apiPost<ApiEnvelope<{ shift: AttendanceShift }>>('/api/v1/attendance/kiosk/clock-in', payload);
  return res.data.shift;
}

export async function kioskClockOut(payload: {
  userId: string;
  pin: string;
  deviceLabel?: string | null;
  location?: string | null;
}): Promise<AttendanceShift> {
  const res = await apiPost<ApiEnvelope<{ shift: AttendanceShift }>>('/api/v1/attendance/kiosk/clock-out', payload);
  return res.data.shift;
}

export async function correctAttendanceShift(
  id: string,
  payload: {
    clockInAt?: string;
    clockOutAt?: string | null;
    status?: 'active' | 'completed' | 'corrected';
    correctionReason: string;
  },
): Promise<AttendanceShift> {
  const res = await apiPatch<ApiEnvelope<{ shift: AttendanceShift }>>(`/api/v1/attendance/${id}/correction`, payload);
  return res.data.shift;
}
