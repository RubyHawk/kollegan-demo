import { apiGet, apiPost, apiPut, apiDelete } from '@shared/lib/api-client';
import type { Restaurant, HotelActivity, Amenity } from '../domain/service.entity';

type ServiceType = 'restaurant' | 'activity' | 'amenity';

function endpoint(type: ServiceType, id?: string): string {
  const base = `/api/${type === 'restaurant' ? 'restaurants' : type === 'activity' ? 'activities' : 'amenities'}`;
  return id ? `${base}/${id}` : base;
}

/* ───── Restaurants ───── */

export async function fetchRestaurants(): Promise<Restaurant[]> {
  const data = await apiGet<{ items: Restaurant[] }>('/api/restaurants');
  return data.items ?? [];
}

export async function createRestaurant(data: Omit<Restaurant, 'id'>): Promise<Restaurant> {
  return apiPost('/api/restaurants', data);
}

export async function updateRestaurant(id: string, data: Partial<Restaurant>): Promise<Restaurant> {
  return apiPut(`/api/restaurants/${id}`, data);
}

export async function deleteRestaurant(id: string): Promise<void> {
  await apiDelete(`/api/restaurants/${id}`);
}

/* ───── Activities ───── */

export async function fetchActivities(): Promise<HotelActivity[]> {
  const data = await apiGet<{ items: HotelActivity[] }>('/api/activities');
  return data.items ?? [];
}

export async function createActivity(data: Omit<HotelActivity, 'id'>): Promise<HotelActivity> {
  return apiPost('/api/activities', data);
}

export async function updateActivity(id: string, data: Partial<HotelActivity>): Promise<HotelActivity> {
  return apiPut(`/api/activities/${id}`, data);
}

export async function deleteActivity(id: string): Promise<void> {
  await apiDelete(`/api/activities/${id}`);
}

/* ───── Amenities ───── */

export async function fetchAmenities(): Promise<Amenity[]> {
  const data = await apiGet<{ items: Amenity[] }>('/api/amenities');
  return data.items ?? [];
}

export async function createAmenity(data: Omit<Amenity, 'id'>): Promise<Amenity> {
  return apiPost('/api/amenities', data);
}

export async function updateAmenity(id: string, data: Partial<Amenity>): Promise<Amenity> {
  return apiPut(`/api/amenities/${id}`, data);
}

export async function deleteAmenity(id: string): Promise<void> {
  await apiDelete(`/api/amenities/${id}`);
}

/* ───── Combined ───── */

export async function fetchHotelInfo(): Promise<{ restaurants: Restaurant[]; activities: HotelActivity[]; amenities: Amenity[] }> {
  return apiGet('/api/hotel-info');
}

/* ───── Generic service operations ───── */

export async function createService(type: ServiceType, data: unknown): Promise<unknown> {
  return apiPost(endpoint(type), data);
}

export async function updateService(type: ServiceType, id: string, data: unknown): Promise<unknown> {
  return apiPut(endpoint(type, id), data);
}

export async function deleteService(type: ServiceType, id: string): Promise<void> {
  await apiDelete(endpoint(type, id));
}

export async function toggleServiceActive(type: ServiceType, id: string, isActive: boolean): Promise<unknown> {
  return apiPut(endpoint(type, id), { isActive });
}
