/**
 * Custom Field Definition — domain types and pure helpers.
 *
 * Org-defined extra fields. Definitions live in `org_custom_field_definitions`;
 * the values they describe live in a `customFields Json?` column on each parent
 * entity (Offer, OfferProduct, Company, Lead, Customer, Project).
 *
 * Everything in this file is pure — no Prisma, no I/O. The validator is reused
 * by Phase 3 when entity records persist their custom field values.
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

export function isCustomFieldEntityType(value: unknown): value is CustomFieldEntityType {
  return typeof value === 'string' && (CUSTOM_FIELD_ENTITY_TYPES as readonly string[]).includes(value);
}

export function isCustomFieldType(value: unknown): value is CustomFieldType {
  return typeof value === 'string' && (CUSTOM_FIELD_TYPES as readonly string[]).includes(value);
}

/**
 * Derive a stable machine key from a human label.
 *
 * Lowercases, strips diacritics (so "Fastighetsbeteckning" stays ascii-ish and
 * "å/ä/ö" fold to "a/a/o"), replaces any run of non-alphanumerics with a single
 * underscore, and trims leading/trailing underscores. Result is safe to use as
 * a JSON object key.
 *
 * @example slugifyKey('Fastighetsbeteckning') -> 'fastighetsbeteckning'
 * @example slugifyKey('Plot number #2')        -> 'plot_number_2'
 */
export function slugifyKey(label: string): string {
  return label
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export type CustomFieldValues = Record<string, unknown>;

export interface CustomFieldValueError {
  key: string;
  message: string;
}

export type ValidateCustomFieldValuesResult =
  | { ok: true }
  | { ok: false; errors: CustomFieldValueError[] };

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

/**
 * Validate a bag of custom field values against the active definitions for an
 * entity. Pure — used both for API input checks and (Phase 3) persistence.
 *
 * Enforces:
 *  - required fields are present and non-blank
 *  - text   -> string
 *  - number -> finite number (numeric strings are coerced)
 *  - date   -> ISO-8601-parseable date string
 *  - boolean-> boolean (or "true"/"false" string)
 *  - select -> value must match one of the definition's option values
 *
 * Unknown keys (not described by any definition) are ignored, not errors.
 */
export function validateCustomFieldValues(
  defs: CustomFieldDefinition[],
  values: CustomFieldValues,
): ValidateCustomFieldValuesResult {
  const errors: CustomFieldValueError[] = [];

  for (const def of defs) {
    const raw = values[def.key];

    if (isBlank(raw)) {
      if (def.required) {
        errors.push({ key: def.key, message: `${def.label} is required` });
      }
      continue;
    }

    switch (def.fieldType) {
      case 'text': {
        if (typeof raw !== 'string') {
          errors.push({ key: def.key, message: `${def.label} must be text` });
        }
        break;
      }
      case 'number': {
        const num = typeof raw === 'number' ? raw : Number(raw);
        if (typeof raw === 'boolean' || Number.isNaN(num) || !Number.isFinite(num)) {
          errors.push({ key: def.key, message: `${def.label} must be a number` });
        }
        break;
      }
      case 'date': {
        const asDate = typeof raw === 'string' || raw instanceof Date ? new Date(raw as string) : new Date(NaN);
        if (Number.isNaN(asDate.getTime())) {
          errors.push({ key: def.key, message: `${def.label} must be a valid date` });
        }
        break;
      }
      case 'boolean': {
        const okBool = typeof raw === 'boolean' || raw === 'true' || raw === 'false';
        if (!okBool) {
          errors.push({ key: def.key, message: `${def.label} must be true or false` });
        }
        break;
      }
      case 'select': {
        const allowed = (def.options ?? []).map((o) => o.value);
        if (!allowed.includes(String(raw))) {
          errors.push({ key: def.key, message: `${def.label} must be one of: ${allowed.join(', ')}` });
        }
        break;
      }
      default: {
        errors.push({ key: def.key, message: `${def.label} has an unsupported field type` });
      }
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
