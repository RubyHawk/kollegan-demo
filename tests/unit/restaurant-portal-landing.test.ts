import { describe, expect, it } from 'vitest';
import { resolveRestaurantPortalLanding } from '../../src/app/(dashboard)/(shell)/restaurant-portal-landing';

const restaurantModules = ['restaurant_public_site', 'restaurant_orders'];

describe('restaurant portal landing', () => {
  it('lands cashier-capable staff on kassa first', () => {
    expect(resolveRestaurantPortalLanding({
      enabledModules: restaurantModules,
      roles: ['restaurant_staff'],
      canReadOrders: true,
      canWriteOrders: true,
    })).toBe('/kassa');
  });

  it('lands kitchen-only staff on the kitchen board', () => {
    expect(resolveRestaurantPortalLanding({
      enabledModules: restaurantModules,
      roles: ['restaurant_kitchen'],
      canReadOrders: true,
      canWriteOrders: true,
    })).toBe('/kok');
  });

  it('lands read-only restaurant users on the kitchen board', () => {
    expect(resolveRestaurantPortalLanding({
      enabledModules: restaurantModules,
      roles: ['accountant'],
      canReadOrders: true,
      canWriteOrders: false,
    })).toBe('/kok');
  });

  it('stays on the restaurant dashboard when the order module or permission is missing', () => {
    expect(resolveRestaurantPortalLanding({
      enabledModules: ['restaurant_public_site'],
      roles: ['restaurant_staff'],
      canReadOrders: true,
      canWriteOrders: true,
    })).toBeNull();
    expect(resolveRestaurantPortalLanding({
      enabledModules: restaurantModules,
      roles: ['restaurant_staff'],
      canReadOrders: false,
      canWriteOrders: false,
    })).toBeNull();
  });
});
