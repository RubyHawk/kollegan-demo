import { Errors } from '@platform/api/errors';
import { resolveTenantByHost, tenantHasModule } from '@platform/tenancy/tenant-resolver';
import { restaurantMenuRepository } from '../infrastructure/restaurant-menu.repository';
import type {
  CreateMenuCategoryInput,
  CreateMenuItemInput,
  CreateReservationRequestInput,
  UpsertOpeningHourInput,
} from '../domain/restaurant-menu.entity';

const DEFAULT_RESTAURANT_SLUG = 'restaurant-demo';

async function resolvePublicRestaurantOrganization(host: string | null | undefined): Promise<string> {
  const tenant = await resolveTenantByHost(host);
  if (tenant?.kind === 'public') return tenant.organizationId;

  const fallback = await restaurantMenuRepository.getOrganizationBySlug(DEFAULT_RESTAURANT_SLUG);
  if (!fallback) throw Errors.notFound('Restaurant site not found');
  return fallback.id;
}

export async function getPublicRestaurantSite(host: string | null | undefined) {
  const organizationId = await resolvePublicRestaurantOrganization(host);
  const enabled = await tenantHasModule(organizationId, 'restaurant_public_site');
  if (!enabled) throw Errors.notFound('Restaurant site not found');

  const site = await restaurantMenuRepository.getPublicSite(organizationId);
  if (!site) throw Errors.notFound('Restaurant site not found');
  return site;
}

export async function createPublicReservationRequest(
  host: string | null | undefined,
  input: CreateReservationRequestInput,
) {
  const organizationId = await resolvePublicRestaurantOrganization(host);
  const enabled = await tenantHasModule(organizationId, 'restaurant_public_site');
  if (!enabled) throw Errors.notFound('Restaurant site not found');
  return restaurantMenuRepository.createReservationRequest(organizationId, input);
}

export async function listRestaurantMenu(organizationId: string) {
  return restaurantMenuRepository.listMenu(organizationId);
}

export async function createRestaurantMenuCategory(
  organizationId: string,
  actorId: string,
  input: CreateMenuCategoryInput,
) {
  return restaurantMenuRepository.createCategory(organizationId, actorId, input);
}

export async function createRestaurantMenuItem(
  organizationId: string,
  actorId: string,
  input: CreateMenuItemInput,
) {
  const categoryOk = await restaurantMenuRepository.categoryExistsInOrg(organizationId, input.categoryId);
  if (!categoryOk) throw Errors.validation('Menu category does not belong to this organization');
  return restaurantMenuRepository.createItem(organizationId, actorId, input);
}

export async function listRestaurantOpeningHours(organizationId: string) {
  return restaurantMenuRepository.listOpeningHours(organizationId);
}

export async function upsertRestaurantOpeningHour(
  organizationId: string,
  input: UpsertOpeningHourInput,
) {
  return restaurantMenuRepository.upsertOpeningHour(organizationId, input);
}
