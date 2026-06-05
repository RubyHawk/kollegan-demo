/**
 * Client-side types for the custom-fields settings UI.
 *
 * These mirror the backend contract but are redefined here (not imported from
 * `@modules/supporting/custom-fields`) to avoid bundling server code — same
 * convention as `customers.api.ts` / `offers.api.ts`, which redefine their
 * domain types in the client api layer.
 */

export const CUSTOM_FIELD_ENTITY_TYPES = [
  'offer',
  'product',
  'company',
  'lead',
  'customer',
  'project',
] as const;

export type CustomFieldEntityType = (typeof CUSTOM_FIELD_ENTITY_TYPES)[number];

export const CUSTOM_FIELD_TYPES = ['text', 'number', 'date', 'select', 'boolean'] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export interface CustomFieldOption {
  label: string;
  value: string;
}

export interface CustomFieldDefinition {
  id: string;
  organizationId: string;
  entityType: CustomFieldEntityType;
  key: string;
  label: string;
  fieldType: CustomFieldType;
  options: CustomFieldOption[] | null;
  required: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomFieldPayload {
  entityType: CustomFieldEntityType;
  label: string;
  key?: string;
  fieldType: CustomFieldType;
  options?: CustomFieldOption[];
  required?: boolean;
  sortOrder?: number;
}

export interface UpdateCustomFieldPatch {
  label?: string;
  options?: CustomFieldOption[] | null;
  required?: boolean;
  sortOrder?: number;
}

// ── UI helpers ─────────────────────────────────────────────────────────────────

export const ENTITY_TYPE_LABELS: Record<CustomFieldEntityType, string> = {
  offer: 'Offert',
  product: 'Produkt',
  company: 'Företag',
  lead: 'Lead',
  customer: 'Kund',
  project: 'Projekt',
};

export const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Text',
  number: 'Nummer',
  date: 'Datum',
  select: 'Lista',
  boolean: 'Ja/Nej',
};

/**
 * Mirrors the server's `slugifyKey` so the create form can preview the
 * auto-derived key. The server remains the source of truth.
 */
export function slugifyKey(label: string): string {
  return label
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
