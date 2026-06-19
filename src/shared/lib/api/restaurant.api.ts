import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../api-client';

interface ApiEnvelope<T> {
  data: T;
}

export interface MenuItemIngredient {
  ingredientId: string | null;
  emoji: string | null;
  name: string;
  quantity: string | null;
  unit: string | null;
  note: string | null;
}

export interface MenuItemVariant {
  id: string | null;
  name: string;
  priceCents: number;
  isDefault: boolean;
  isAvailable: boolean;
  sortOrder: number;
}

export interface MenuItemVariantInput {
  id?: string | null;
  name: string;
  priceCents: number;
  isDefault?: boolean;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface MenuItemModifierOption {
  id: string | null;
  name: string;
  priceDeltaCents: number;
  isAvailable: boolean;
  sortOrder: number;
}

export interface MenuItemModifierOptionInput {
  id?: string | null;
  name: string;
  priceDeltaCents?: number;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface MenuItemModifierGroup {
  id: string | null;
  name: string;
  minSelected: number;
  maxSelected: number;
  required: boolean;
  sortOrder: number;
  options: MenuItemModifierOption[];
}

export interface MenuItemModifierGroupInput {
  id?: string | null;
  name: string;
  minSelected?: number;
  maxSelected?: number;
  required?: boolean;
  sortOrder?: number;
  options?: MenuItemModifierOptionInput[];
}

export interface RestaurantMenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number | null;
  currency: string;
  imageUrl: string | null;
  allergens: string[];
  tags: string[];
  ingredients: MenuItemIngredient[];
  variants?: MenuItemVariant[];
  modifierGroups?: MenuItemModifierGroup[];
  kitchenStation?: string | null;
  isAvailable: boolean;
  sortOrder: number;
}

export interface RestaurantMenuCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  items: RestaurantMenuItem[];
}

export interface RestaurantOpeningHour {
  id: string;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
  label: string | null;
}

export interface PublicSiteSettings {
  siteName: string;
  heroTitle: string;
  heroSubtitle: string | null;
  about: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  reservationEmail: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface RestaurantEvent {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RestaurantReservationStatus = 'new' | 'confirmed' | 'declined' | 'cancelled';

export interface RestaurantReservation {
  id: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  partySize: number;
  requestedAt: string;
  message: string | null;
  status: RestaurantReservationStatus;
  handledBy: string | null;
  handledAt: string | null;
  createdAt: string;
}

export interface CreateMenuCategoryPayload {
  name: string;
  description?: string | null;
  sortOrder?: number;
}

export interface MenuItemIngredientInput {
  ingredientId?: string | null;
  emoji?: string | null;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  note?: string | null;
}

export interface IngredientCategory {
  id: string;
  name: string;
  emoji: string | null;
  sortOrder: number;
}

export interface CatalogIngredient {
  id: string;
  categoryId: string;
  name: string;
  emoji: string | null;
  defaultUnit: string | null;
  aliases: string[];
  allergens: string[];
  isCustom: boolean;
}

export interface IngredientCatalog {
  categories: IngredientCategory[];
  ingredients: CatalogIngredient[];
}

export interface CreateIngredientPayload {
  categoryId: string;
  name: string;
  emoji?: string | null;
  defaultUnit?: string | null;
  aliases?: string[];
  allergens?: string[];
}

export interface CreateMenuItemPayload {
  categoryId: string;
  name: string;
  description?: string | null;
  priceCents?: number | null;
  currency?: string;
  imageUrl?: string | null;
  allergens?: string[];
  tags?: string[];
  ingredients?: MenuItemIngredientInput[];
  variants?: MenuItemVariantInput[];
  modifierGroups?: MenuItemModifierGroupInput[];
  kitchenStation?: string | null;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface UpdateMenuCategoryPayload {
  name?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateMenuItemPayload {
  categoryId?: string;
  name?: string;
  description?: string | null;
  priceCents?: number | null;
  currency?: string;
  imageUrl?: string | null;
  allergens?: string[];
  tags?: string[];
  ingredients?: MenuItemIngredientInput[];
  variants?: MenuItemVariantInput[];
  modifierGroups?: MenuItemModifierGroupInput[];
  kitchenStation?: string | null;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface SaveOpeningHourPayload {
  dayOfWeek: number;
  opensAt?: string | null;
  closesAt?: string | null;
  isClosed?: boolean;
  label?: string | null;
}

export interface PublicReservationPayload {
  guestName: string;
  guestEmail?: string | null;
  guestPhone?: string | null;
  partySize: number;
  requestedAt: string;
  message?: string | null;
}

export type PublicOrderFulfillmentType = 'takeaway' | 'delivery';

export interface PublicOrderItemPayload {
  menuItemId: string;
  quantity: number;
  variantLabel?: string | null;
  note?: string | null;
}

export interface PublicOrderPayload {
  fulfillmentType: PublicOrderFulfillmentType;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string | null;
  note?: string | null;
  items: PublicOrderItemPayload[];
}

export interface PublicOrderResult {
  orderNumber: number;
  status: string;
  fulfillmentType: PublicOrderFulfillmentType;
}

export interface ReservationListParams {
  status?: RestaurantReservationStatus;
  from?: string;
  to?: string;
}

export type SavePublicSiteSettingsPayload = Partial<PublicSiteSettings>;

export interface SaveRestaurantEventPayload {
  title?: string;
  description?: string | null;
  startsAt?: string;
  endsAt?: string | null;
  isPublished?: boolean;
}

export async function listRestaurantMenu(): Promise<RestaurantMenuCategory[]> {
  const res = await apiGet<ApiEnvelope<{ categories: RestaurantMenuCategory[] }>>('/api/v1/restaurant/menu');
  return res.data.categories;
}

export async function createRestaurantMenuCategory(payload: CreateMenuCategoryPayload): Promise<RestaurantMenuCategory> {
  const res = await apiPost<ApiEnvelope<{ category: RestaurantMenuCategory }>>('/api/v1/restaurant/menu/categories', payload);
  return res.data.category;
}

export async function createRestaurantMenuItem(payload: CreateMenuItemPayload): Promise<RestaurantMenuItem> {
  const res = await apiPost<ApiEnvelope<{ item: RestaurantMenuItem }>>('/api/v1/restaurant/menu/items', payload);
  return res.data.item;
}

export async function updateRestaurantMenuCategory(id: string, payload: UpdateMenuCategoryPayload): Promise<RestaurantMenuCategory> {
  const res = await apiPatch<ApiEnvelope<{ category: RestaurantMenuCategory }>>(`/api/v1/restaurant/menu/categories/${id}`, payload);
  return res.data.category;
}

export async function deleteRestaurantMenuCategory(id: string): Promise<void> {
  await apiDelete(`/api/v1/restaurant/menu/categories/${id}`);
}

export async function updateRestaurantMenuItem(id: string, payload: UpdateMenuItemPayload): Promise<RestaurantMenuItem> {
  const res = await apiPatch<ApiEnvelope<{ item: RestaurantMenuItem }>>(`/api/v1/restaurant/menu/items/${id}`, payload);
  return res.data.item;
}

export async function deleteRestaurantMenuItem(id: string): Promise<void> {
  await apiDelete(`/api/v1/restaurant/menu/items/${id}`);
}

export async function getIngredientCatalog(): Promise<IngredientCatalog> {
  const res = await apiGet<ApiEnvelope<{ catalog: IngredientCatalog }>>('/api/v1/restaurant/ingredients');
  return res.data.catalog;
}

export async function createIngredient(payload: CreateIngredientPayload): Promise<CatalogIngredient> {
  const res = await apiPost<ApiEnvelope<{ ingredient: CatalogIngredient }>>('/api/v1/restaurant/ingredients', payload);
  return res.data.ingredient;
}

export async function listRestaurantOpeningHours(): Promise<RestaurantOpeningHour[]> {
  const res = await apiGet<ApiEnvelope<{ openingHours: RestaurantOpeningHour[] }>>('/api/v1/restaurant/opening-hours');
  return res.data.openingHours;
}

export async function saveRestaurantOpeningHour(payload: SaveOpeningHourPayload): Promise<RestaurantOpeningHour> {
  const res = await apiPut<ApiEnvelope<{ openingHour: RestaurantOpeningHour }>>('/api/v1/restaurant/opening-hours', payload);
  return res.data.openingHour;
}

export async function createPublicReservation(payload: PublicReservationPayload): Promise<{ id: string; status: string; createdAt: string }> {
  const res = await apiPost<ApiEnvelope<{ id: string; status: string; createdAt: string }>>('/api/v1/public-site/reservations', payload);
  return res.data;
}

export async function createPublicOrder(payload: PublicOrderPayload): Promise<PublicOrderResult> {
  const res = await apiPost<ApiEnvelope<{ order: PublicOrderResult }>>('/api/v1/public-site/orders', payload);
  return res.data.order;
}

export async function listRestaurantReservations(params: ReservationListParams = {}): Promise<RestaurantReservation[]> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  const res = await apiGet<ApiEnvelope<{ reservations: RestaurantReservation[] }>>(`/api/v1/restaurant/reservations${suffix}`);
  return res.data.reservations;
}

export async function updateRestaurantReservation(
  id: string,
  status: RestaurantReservationStatus,
): Promise<RestaurantReservation> {
  const res = await apiPatch<ApiEnvelope<{ reservation: RestaurantReservation }>>(
    `/api/v1/restaurant/reservations/${id}`,
    { status },
  );
  return res.data.reservation;
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const res = await apiGet<ApiEnvelope<{ settings: PublicSiteSettings }>>('/api/v1/restaurant/public-site-settings');
  return res.data.settings;
}

export async function savePublicSiteSettings(payload: SavePublicSiteSettingsPayload): Promise<PublicSiteSettings> {
  const res = await apiPatch<ApiEnvelope<{ settings: PublicSiteSettings }>>('/api/v1/restaurant/public-site-settings', payload);
  return res.data.settings;
}

export async function listRestaurantEvents(): Promise<RestaurantEvent[]> {
  const res = await apiGet<ApiEnvelope<{ events: RestaurantEvent[] }>>('/api/v1/restaurant/events');
  return res.data.events;
}

export async function createRestaurantEvent(payload: Required<Pick<SaveRestaurantEventPayload, 'title' | 'startsAt'>> & SaveRestaurantEventPayload): Promise<RestaurantEvent> {
  const res = await apiPost<ApiEnvelope<{ event: RestaurantEvent }>>('/api/v1/restaurant/events', payload);
  return res.data.event;
}

export async function updateRestaurantEvent(id: string, payload: SaveRestaurantEventPayload): Promise<RestaurantEvent> {
  const res = await apiPatch<ApiEnvelope<{ event: RestaurantEvent }>>(`/api/v1/restaurant/events/${id}`, payload);
  return res.data.event;
}

export async function deleteRestaurantEvent(id: string): Promise<void> {
  await apiDelete(`/api/v1/restaurant/events/${id}`);
}
