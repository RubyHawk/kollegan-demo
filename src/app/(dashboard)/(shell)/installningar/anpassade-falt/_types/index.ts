/**
 * Client-side types for the custom-fields settings UI.
 *
 * The core client shapes now live in the shared, browser-safe module
 * `@shared/lib/custom-fields/types` so cross-feature UI (e.g. the shared
 * `CustomFieldsSection`) can reuse a single source of truth without bundling
 * server code. They are re-exported here so existing feature imports keep
 * working unchanged. The UI-only helpers below remain local to this feature.
 */

export {
  CUSTOM_FIELD_ENTITY_TYPES,
  CUSTOM_FIELD_TYPES,
} from '@shared/lib/custom-fields/types';
export type {
  CustomFieldEntityType,
  CustomFieldType,
  CustomFieldOption,
  CustomFieldDefinition,
  CreateCustomFieldPayload,
  UpdateCustomFieldPatch,
} from '@shared/lib/custom-fields/types';

import type { CustomFieldEntityType, CustomFieldType } from '@shared/lib/custom-fields/types';

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
