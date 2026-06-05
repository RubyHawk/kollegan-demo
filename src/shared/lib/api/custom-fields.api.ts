import { apiDelete, apiGet, apiPost, apiPut } from '../api-client';
import type {
  CreateCustomFieldPayload,
  CustomFieldDefinition,
  CustomFieldEntityType,
  UpdateCustomFieldPatch,
} from '@/app/(dashboard)/(shell)/installningar/anpassade-falt/_types';

const BASE_URL = '/api/v1/custom-fields';

interface ApiEnvelope<T> {
  data: T;
}

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listCustomFields(
  entityType: CustomFieldEntityType,
): Promise<CustomFieldDefinition[]> {
  const res = await apiGet<ApiEnvelope<{ definitions: CustomFieldDefinition[] }>>(
    `${BASE_URL}${query({ entityType })}`,
  );
  return res.data.definitions;
}

export async function createCustomField(
  payload: CreateCustomFieldPayload,
): Promise<CustomFieldDefinition> {
  const res = await apiPost<ApiEnvelope<CustomFieldDefinition>>(BASE_URL, payload);
  return res.data;
}

export async function updateCustomField(
  id: string,
  patch: UpdateCustomFieldPatch,
): Promise<CustomFieldDefinition> {
  const res = await apiPut<ApiEnvelope<CustomFieldDefinition>>(`${BASE_URL}/${id}`, patch);
  return res.data;
}

export async function deleteCustomField(id: string): Promise<void> {
  await apiDelete(`${BASE_URL}/${id}`);
}
