/**
 * Shared browser-safe custom-field types.
 *
 * Mirrors the backend contract in `@modules/supporting/custom-fields`, but is
 * defined here (not imported from the module) so browser code never pulls in
 * server/Prisma code — same convention as the feature API clients.
 *
 * This is the single source of truth for the CLIENT shape. The settings
 * `_types` barrel re-exports these so existing feature imports keep working,
 * and shared cross-feature UI (e.g. `CustomFieldsSection`) imports from here.
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
