import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('@modules/supporting/identity', () => ({
  organizationHasModule: vi.fn(),
}));

vi.mock('../../src/modules/generic/workforce/infrastructure/attendance.repository', () => ({
  attendanceRepository: {
    findActiveShift: vi.fn(),
    createShift: vi.fn(),
    completeActiveShift: vi.fn(),
    findClockPinState: vi.fn(),
    listShiftsInRange: vi.fn(),
    listClockableStaff: vi.fn(),
    correctShift: vi.fn(),
  },
}));

vi.mock('@platform/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { organizationHasModule } from '@modules/supporting/identity';
import { attendanceRepository } from '../../src/modules/generic/workforce/infrastructure/attendance.repository';
import { clockIn, kioskClockIn, localDayBounds } from '../../src/modules/generic/workforce/application/attendance.service';

describe('attendance service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(organizationHasModule).mockResolvedValue(true);
  });

  it('rejects duplicate active shifts for the same user and organization', async () => {
    vi.mocked(attendanceRepository.findActiveShift).mockResolvedValue({
      id: 'shift_1',
      organizationId: 'org_1',
      userId: 'user_1',
      clockInAt: new Date().toISOString(),
      clockOutAt: null,
      status: 'active',
      clockInSource: 'portal',
      clockOutSource: null,
      deviceLabel: null,
      location: null,
      correctedBy: null,
      correctionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await expect(clockIn('org_1', 'user_1', {})).rejects.toMatchObject({
      problem: { status: 409 },
    });
    expect(attendanceRepository.createShift).not.toHaveBeenCalled();
  });

  it('rejects kiosk clock-in when the selected employee PIN is wrong', async () => {
    vi.mocked(attendanceRepository.findClockPinState).mockResolvedValue({
      id: 'user_1',
      isActive: true,
      clockPinHash: await bcrypt.hash('1234', 4),
    });

    await expect(kioskClockIn('org_1', 'user_1', '9999', {})).rejects.toMatchObject({
      problem: { status: 403 },
    });
    expect(attendanceRepository.createShift).not.toHaveBeenCalled();
  });

  it('records kiosk clock-in against the selected user after PIN validation', async () => {
    vi.mocked(attendanceRepository.findClockPinState).mockResolvedValue({
      id: 'user_1',
      isActive: true,
      clockPinHash: await bcrypt.hash('1234', 4),
    });
    vi.mocked(attendanceRepository.findActiveShift).mockResolvedValue(null);
    vi.mocked(attendanceRepository.createShift).mockResolvedValue({
      id: 'shift_1',
      organizationId: 'org_1',
      userId: 'user_1',
      clockInAt: new Date().toISOString(),
      clockOutAt: null,
      status: 'active',
      clockInSource: 'kiosk',
      clockOutSource: null,
      deviceLabel: null,
      location: null,
      correctedBy: null,
      correctionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await expect(kioskClockIn('org_1', 'user_1', '1234', {})).resolves.toMatchObject({
      userId: 'user_1',
      clockInSource: 'kiosk',
    });
    expect(attendanceRepository.createShift).toHaveBeenCalledWith('org_1', 'user_1', { source: 'kiosk' });
  });
});

describe('localDayBounds', () => {
  it('covers the full Stockholm day in winter (CET, UTC+1)', () => {
    const { from, to } = localDayBounds(new Date('2026-01-15T10:00:00Z'));
    expect(from.toISOString()).toBe('2026-01-14T23:00:00.000Z');
    expect(to.toISOString()).toBe('2026-01-15T23:00:00.000Z');
  });

  it('covers the full Stockholm day in summer (CEST, UTC+2)', () => {
    const { from, to } = localDayBounds(new Date('2026-06-15T10:00:00Z'));
    expect(from.toISOString()).toBe('2026-06-14T22:00:00.000Z');
    expect(to.toISOString()).toBe('2026-06-15T22:00:00.000Z');
  });

  it('handles the spring DST transition day (23-hour day)', () => {
    const { from, to } = localDayBounds(new Date('2026-03-29T10:00:00Z'));
    expect(from.toISOString()).toBe('2026-03-28T23:00:00.000Z');
    expect(to.toISOString()).toBe('2026-03-29T22:00:00.000Z');
  });
});
