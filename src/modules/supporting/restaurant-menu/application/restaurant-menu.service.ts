import { Errors } from '@platform/api/errors';
import { normalizeTenantHost, resolveTenantByHost, tenantHasModule } from '@platform/tenancy/tenant-resolver';
import { restaurantMenuRepository } from '../infrastructure/restaurant-menu.repository';
import type {
  CreateMenuCategoryInput,
  CreateMenuItemInput,
  CreateRestaurantEventInput,
  CreateReservationRequestInput,
  ListReservationRequestsInput,
  PublicRestaurantSite,
  UpdateMenuCategoryInput,
  UpdateMenuItemInput,
  UpdatePublicSiteSettingsInput,
  UpdateRestaurantEventInput,
  UpdateReservationRequestInput,
  UpsertOpeningHourInput,
} from '../domain/restaurant-menu.entity';

export const DEFAULT_RESTAURANT_SLUG = 'fluffys';
const configuredPublicSiteTtl = Number(process.env.PUBLIC_SITE_CACHE_TTL_MS ?? 120_000);
const PUBLIC_SITE_CACHE_TTL_MS = Number.isFinite(configuredPublicSiteTtl)
  ? Math.max(60_000, Math.min(configuredPublicSiteTtl, 300_000))
  : 120_000;

const publicSiteCache = new Map<string, { expiresAt: number; data: PublicRestaurantSite }>();

function publicSiteCacheKey(host: string | null | undefined, organizationId: string): string {
  return `${normalizeTenantHost(host) || 'default'}:${organizationId}`;
}

function clearPublicSiteCache() {
  publicSiteCache.clear();
}

async function resolvePublicRestaurantOrganization(host: string | null | undefined): Promise<string> {
  const tenant = await resolveTenantByHost(host);
  if (tenant?.kind === 'public') return tenant.organizationId;

  const fallback = await restaurantMenuRepository.getOrganizationBySlug(DEFAULT_RESTAURANT_SLUG);
  if (!fallback) throw Errors.notFound('Restaurant site not found');
  return fallback.id;
}

export async function getPublicRestaurantSite(host: string | null | undefined): Promise<PublicRestaurantSite> {
  const organizationId = await resolvePublicRestaurantOrganization(host);
  const enabled = await tenantHasModule(organizationId, 'restaurant_public_site');
  if (!enabled) throw Errors.notFound('Restaurant site not found');

  const cacheKey = publicSiteCacheKey(host, organizationId);
  const cached = publicSiteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const site = await restaurantMenuRepository.getPublicSite(organizationId);
  if (!site) throw Errors.notFound('Restaurant site not found');
  publicSiteCache.set(cacheKey, { expiresAt: Date.now() + PUBLIC_SITE_CACHE_TTL_MS, data: site });
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
  const category = await restaurantMenuRepository.createCategory(organizationId, actorId, input);
  clearPublicSiteCache();
  return category;
}

export async function createRestaurantMenuItem(
  organizationId: string,
  actorId: string,
  input: CreateMenuItemInput,
) {
  const categoryOk = await restaurantMenuRepository.categoryExistsInOrg(organizationId, input.categoryId);
  if (!categoryOk) throw Errors.validation('Menu category does not belong to this organization');
  const item = await restaurantMenuRepository.createItem(organizationId, actorId, input);
  clearPublicSiteCache();
  return item;
}

export async function updateRestaurantMenuCategory(
  organizationId: string,
  categoryId: string,
  input: UpdateMenuCategoryInput,
) {
  const category = await restaurantMenuRepository.updateCategory(organizationId, categoryId, input);
  if (!category) throw Errors.notFound('Menu category not found');
  clearPublicSiteCache();
  return category;
}

export async function deleteRestaurantMenuCategory(organizationId: string, categoryId: string) {
  const ok = await restaurantMenuRepository.softDeleteCategory(organizationId, categoryId);
  if (!ok) throw Errors.notFound('Menu category not found');
  clearPublicSiteCache();
}

export async function updateRestaurantMenuItem(
  organizationId: string,
  itemId: string,
  input: UpdateMenuItemInput,
) {
  if (input.categoryId !== undefined) {
    const categoryOk = await restaurantMenuRepository.categoryExistsInOrg(organizationId, input.categoryId);
    if (!categoryOk) throw Errors.validation('Menu category does not belong to this organization');
  }
  const item = await restaurantMenuRepository.updateItem(organizationId, itemId, input);
  if (!item) throw Errors.notFound('Menu item not found');
  clearPublicSiteCache();
  return item;
}

export async function deleteRestaurantMenuItem(organizationId: string, itemId: string) {
  const ok = await restaurantMenuRepository.softDeleteItem(organizationId, itemId);
  if (!ok) throw Errors.notFound('Menu item not found');
  clearPublicSiteCache();
}

export async function listRestaurantOpeningHours(organizationId: string) {
  return restaurantMenuRepository.listOpeningHours(organizationId);
}

export async function upsertRestaurantOpeningHour(
  organizationId: string,
  input: UpsertOpeningHourInput,
) {
  const openingHour = await restaurantMenuRepository.upsertOpeningHour(organizationId, input);
  clearPublicSiteCache();
  return openingHour;
}

export async function listReservationRequests(
  organizationId: string,
  input: ListReservationRequestsInput,
) {
  return restaurantMenuRepository.listReservationRequests(organizationId, input);
}

export async function getPublicSiteSettings(organizationId: string) {
  const settings = await restaurantMenuRepository.getPublicSiteSettings(organizationId);
  if (!settings) throw Errors.notFound('Public site settings not found');
  return settings;
}

export async function updatePublicSiteSettings(
  organizationId: string,
  input: UpdatePublicSiteSettingsInput,
) {
  const settings = await restaurantMenuRepository.upsertPublicSiteSettings(organizationId, input);
  if (!settings) throw Errors.notFound('Public site settings not found');
  clearPublicSiteCache();
  return settings;
}

export async function listRestaurantEvents(organizationId: string) {
  return restaurantMenuRepository.listEvents(organizationId);
}

function assertEventDates(input: CreateRestaurantEventInput | UpdateRestaurantEventInput) {
  if (input.startsAt && Number.isNaN(new Date(input.startsAt).getTime())) {
    throw Errors.validation('Event start time must be a valid date');
  }
  if (input.endsAt && Number.isNaN(new Date(input.endsAt).getTime())) {
    throw Errors.validation('Event end time must be a valid date');
  }
  if (input.startsAt && input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) {
    throw Errors.validation('Event end time must be after the start time');
  }
}

export async function createRestaurantEvent(
  organizationId: string,
  actorId: string,
  input: CreateRestaurantEventInput,
) {
  assertEventDates(input);
  const event = await restaurantMenuRepository.createEvent(organizationId, actorId, input);
  clearPublicSiteCache();
  return event;
}

export async function updateRestaurantEvent(
  organizationId: string,
  eventId: string,
  input: UpdateRestaurantEventInput,
) {
  assertEventDates(input);
  const event = await restaurantMenuRepository.updateEvent(organizationId, eventId, input);
  if (!event) throw Errors.notFound('Restaurant event not found');
  clearPublicSiteCache();
  return event;
}

export async function deleteRestaurantEvent(organizationId: string, eventId: string) {
  const ok = await restaurantMenuRepository.softDeleteEvent(organizationId, eventId);
  if (!ok) throw Errors.notFound('Restaurant event not found');
  clearPublicSiteCache();
}

export async function updateReservationRequest(
  organizationId: string,
  reservationId: string,
  actorId: string,
  input: UpdateReservationRequestInput,
) {
  const reservation = await restaurantMenuRepository.updateReservationRequest(
    organizationId,
    reservationId,
    actorId,
    input,
  );
  if (!reservation) throw Errors.notFound('Reservation request not found');
  return reservation;
}
