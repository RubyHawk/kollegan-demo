import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@modules/supporting/identity', () => ({
  organizationHasModule: vi.fn(),
}));

vi.mock('../../src/modules/generic/workforce/infrastructure/schedule.repository', () => ({
  scheduleRepository: {
    listShiftsInRange: vi.fn(),
    createShift: vi.fn(),
    findShift: vi.fn(),
    updateShift: vi.fn(),
    memberExistsInOrg: vi.fn(),
    listActiveMembers: vi.fn(),
  },
}));

vi.mock('@platform/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { organizationHasModule } from '@modules/supporting/identity';
import { scheduleRepository } from '../../src/modules/generic/workforce/infrastructure/schedule.repository';
import {
  createScheduleShift,
  listScheduleShifts,
} from '../../src/modules/generic/workforce/application/schedule.service';

describe('schedule service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(organizationHasModule).mockResolvedValue(true);
  });

  it('rejects shifts that end before they start', async () => {
    vi.mocked(scheduleRepository.memberExistsInOrg).mockResolvedValue(true);

    await expect(
      createScheduleShift('org_1', 'user_1', {
        userId: 'user_2',
        startsAt: '2026-06-15T16:00:00.000Z',
        endsAt: '2026-06-15T10:00:00.000Z',
      }),
    ).rejects.toMatchObject({ problem: { status: 400 } });
    expect(scheduleRepository.createShift).not.toHaveBeenCalled();
  });

  it('rejects shifts for users outside the organization', async () => {
    vi.mocked(scheduleRepository.memberExistsInOrg).mockResolvedValue(false);

    await expect(
      createScheduleShift('org_1', 'user_1', {
        userId: 'intruder',
        startsAt: '2026-06-15T10:00:00.000Z',
        endsAt: '2026-06-15T16:00:00.000Z',
      }),
    ).rejects.toMatchObject({ problem: { status: 400 } });
    expect(scheduleRepository.createShift).not.toHaveBeenCalled();
  });

  it('rejects access when the schedule module is disabled', async () => {
    vi.mocked(organizationHasModule).mockResolvedValue(false);

    await expect(
      listScheduleShifts('org_1', { from: '2026-06-15T00:00:00.000Z', to: '2026-06-22T00:00:00.000Z' }),
    ).rejects.toMatchObject({ problem: { status: 403 } });
    expect(scheduleRepository.listShiftsInRange).not.toHaveBeenCalled();
  });
});
