import { apiGet, apiPost, apiPut } from '../api-client';

interface ApiEnvelope<T> {
  data: T;
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

export interface CreateMenuCategoryPayload {
  name: string;
  description?: string | null;
  sortOrder?: number;
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
