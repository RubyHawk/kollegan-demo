type RestaurantPortalLandingInput = {
  enabledModules: readonly string[];
  roles: readonly string[];
  canReadOrders: boolean;
  canWriteOrders: boolean;
};

export type RestaurantPortalLandingPath = '/kassa' | '/kok';

export function resolveRestaurantPortalLanding({
  enabledModules,
  roles,
  canReadOrders,
  canWriteOrders,
}: RestaurantPortalLandingInput): RestaurantPortalLandingPath | null {
  if (!enabledModules.includes('restaurant_public_site') || !enabledModules.includes('restaurant_orders')) {
    return null;
  }

  const kitchenOnly = roles.includes('restaurant_kitchen')
    && !roles.some((role) => ['restaurant_owner', 'restaurant_manager', 'restaurant_staff'].includes(role));

  if (kitchenOnly && canReadOrders) return '/kok';
  if (canWriteOrders) return '/kassa';
  if (canReadOrders) return '/kok';
  return null;
}
