import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@modules/supporting/identity', () => ({
  organizationHasModule: vi.fn(),
}));

vi.mock('../../src/modules/generic/workforce/infrastructure/attendance.repository', () => ({
  attendanceRepository: {
    findActiveShift: vi.fn(),
    createShift: vi.fn(),
    completeActiveShift: vi.fn(),
    listShiftsInRange: vi.fn(),
    correctShift: vi.fn(),
  },
}));

vi.mock('@platform/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { organizationHasModule } from '@modules/supporting/identity';
import { attendanceRepository } from '../../src/modules/generic/workforce/infrastructure/attendance.repository';
import { clockIn } from '../../src/modules/generic/workforce/application/attendance.service';

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
});
