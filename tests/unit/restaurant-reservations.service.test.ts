import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/modules/supporting/restaurant-menu/infrastructure/restaurant-menu.repository', () => ({
  restaurantMenuRepository: {
    listReservationRequests: vi.fn(),
    updateReservationRequest: vi.fn(),
  },
}));

import { restaurantMenuRepository } from '../../src/modules/supporting/restaurant-menu/infrastructure/restaurant-menu.repository';
import {
  listReservationRequests,
  updateReservationRequest,
} from '../../src/modules/supporting/restaurant-menu/application/restaurant-menu.service';

const reservation = {
  id: 'res_1',
  guestName: 'Test Guest',
  guestEmail: 'guest@example.com',
  guestPhone: null,
  partySize: 4,
  requestedAt: '2026-06-20T18:00:00.000Z',
  message: null,
  status: 'confirmed' as const,
  handledBy: 'user_1',
  handledAt: '2026-06-12T12:00:00.000Z',
  createdAt: '2026-06-12T11:00:00.000Z',
};

describe('restaurant reservations service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists reservation requests scoped to the organization', async () => {
    vi.mocked(restaurantMenuRepository.listReservationRequests).mockResolvedValue([reservation]);

    const result = await listReservationRequests('org_1', { status: 'new' });

    expect(restaurantMenuRepository.listReservationRequests).toHaveBeenCalledWith('org_1', { status: 'new' });
    expect(result).toEqual([reservation]);
  });

  it('returns the updated reservation with handling metadata', async () => {
    vi.mocked(restaurantMenuRepository.updateReservationRequest).mockResolvedValue(reservation);

    const result = await updateReservationRequest('org_1', 'res_1', 'user_1', { status: 'confirmed' });

    expect(restaurantMenuRepository.updateReservationRequest).toHaveBeenCalledWith('org_1', 'res_1', 'user_1', {
      status: 'confirmed',
    });
    expect(result.status).toBe('confirmed');
    expect(result.handledBy).toBe('user_1');
  });

  it('throws 404 when the reservation does not belong to the organization', async () => {
    vi.mocked(restaurantMenuRepository.updateReservationRequest).mockResolvedValue(null);

    await expect(
      updateReservationRequest('org_other', 'res_1', 'user_1', { status: 'declined' }),
    ).rejects.toMatchObject({ problem: { status: 404 } });
  });
});
