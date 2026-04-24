import { apiPost } from '@shared/lib/api-client';

export async function seedHotelDemoStaff(): Promise<string> {
  await apiPost('/api/demos/hotel/seed');
  return '3 demokonton seedade (demo1234).';
}
