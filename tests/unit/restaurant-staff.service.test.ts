import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@modules/supporting/identity', () => ({
  organizationHasModule: vi.fn(),
}));

vi.mock('../../src/modules/supporting/auth/infrastructure/restaurant-staff.repository', () => ({
  restaurantStaffRepository: {
    list: vi.fn(),
    findById: vi.fn(),
    findByEmployeeCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setPinHash: vi.fn(),
    deactivate: vi.fn(),
  },
}));

import { organizationHasModule } from '@modules/supporting/identity';
import { restaurantStaffRepository } from '../../src/modules/supporting/auth/infrastructure/restaurant-staff.repository';
import {
  createRestaurantStaff,
  updateRestaurantStaff,
} from '../../src/modules/supporting/auth/application/restaurant-staff.service';
import type { RestaurantStaffMember } from '../../src/modules/supporting/auth';

function staff(overrides: Partial<RestaurantStaffMember> = {}): RestaurantStaffMember {
  return {
    id: 'user_1',
    email: 'staff@example.com',
    firstName: 'Sam',
    lastName: 'Staff',
    employeeCode: 'sam',
    isActive: true,
    clockPinUpdatedAt: new Date().toISOString(),
    roles: ['restaurant_staff'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('restaurant staff service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(organizationHasModule).mockResolvedValue(true);
    vi.mocked(restaurantStaffRepository.findByEmployeeCode).mockResolvedValue(null);
  });

  it('allows managers to create staff and kitchen users', async () => {
    vi.mocked(restaurantStaffRepository.create).mockResolvedValue(staff({
      roles: ['restaurant_kitchen'],
    }));

    await expect(createRestaurantStaff('org_1', 'manager_1', ['restaurant_manager'], {
      firstName: 'Kim',
      employeeCode: 'kim',
      roles: ['restaurant_kitchen'],
      pin: '1234',
    })).resolves.toMatchObject({ roles: ['restaurant_kitchen'] });
  });

  it('blocks managers from creating owner users', async () => {
    await expect(createRestaurantStaff('org_1', 'manager_1', ['restaurant_manager'], {
      firstName: 'Olivia',
      employeeCode: 'olivia',
      roles: ['restaurant_owner'],
      pin: '1234',
    })).rejects.toMatchObject({
      problem: { status: 403 },
    });
    expect(restaurantStaffRepository.create).not.toHaveBeenCalled();
  });

  it('blocks managers from editing existing owner users', async () => {
    vi.mocked(restaurantStaffRepository.findById).mockResolvedValue(staff({
      roles: ['restaurant_owner'],
    }));

    await expect(updateRestaurantStaff('org_1', 'owner_1', 'manager_1', ['restaurant_manager'], {
      firstName: 'Owner',
    })).rejects.toMatchObject({
      problem: { status: 403 },
    });
    expect(restaurantStaffRepository.update).not.toHaveBeenCalled();
  });
});
