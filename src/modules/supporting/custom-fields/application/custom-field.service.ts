/**
 * Custom Field Definition service — use cases.
 *
 * Orchestrates the repository and enforces domain rules:
 *  - auto-derive `key` from `label` (slugifyKey) when not supplied;
 *  - reject duplicate (org, entityType, key) — surfaced as a conflict;
 *  - require non-empty `options` for fieldType "select", forbid them otherwise;
 *  - validate fieldType / entityType against the allowed unions.
 *
 * No Prisma here — persistence lives in the infrastructure repository.
 */

import { logger } from '@platform/logging/logger';
import {
  isCustomFieldEntityType,
  isCustomFieldType,
  slugifyKey,
  type CustomFieldDefinition,
  type CustomFieldEntityType,
  type CustomFieldOption,
  type CustomFieldType,
} from '../domain/custom-field-definition.entity';
import {
  customFieldRepository,
  CUSTOM_FIELD_DUPLICATE,
} from '../infrastructure/custom-field.repository';

/** Recoverable domain error. `kind` lets the handler pick 400 (validation) vs 409 (conflict). */
export class CustomFieldDomainError extends Error {
  readonly kind: 'validation' | 'conflict';

  constructor(kind: 'validation' | 'conflict', message: string) {
    super(message);
    this.name = 'CustomFieldDomainError';
    this.kind = kind;
  }
}

export interface CreateDefinitionInput {
  entityType: CustomFieldEntityType;
  label: string;
  key?: string;
  fieldType: CustomFieldType;
  options?: CustomFieldOption[] | null;
  required?: boolean;
  sortOrder?: number;
}

export interface UpdateDefinitionPatch {
  label?: string;
  required?: boolean;
  sortOrder?: number;
  options?: CustomFieldOption[] | null;
}

const TAG = 'CustomFieldService';

function assertEntityType(value: string): asserts value is CustomFieldEntityType {
  if (!isCustomFieldEntityType(value)) {
    throw new CustomFieldDomainError('validation', `Unsupported entityType: ${value}`);
  }
}

function assertFieldType(value: string): asserts value is CustomFieldType {
  if (!isCustomFieldType(value)) {
    throw new CustomFieldDomainError('validation', `Unsupported fieldType: ${value}`);
  }
}

/** Enforce that select fields carry options and non-select fields do not. */
function resolveOptions(fieldType: CustomFieldType, options?: CustomFieldOption[] | null): CustomFieldOption[] | null {
  if (fieldType === 'select') {
    if (!options || options.length === 0) {
      throw new CustomFieldDomainError('validation', 'A select field requires at least one option');
    }
    return options;
  }
  if (options && options.length > 0) {
    throw new CustomFieldDomainError('validation', 'Options are only allowed for select fields');
  }
  return null;
}

export async function listDefinitions(
  orgId: string,
  entityType?: CustomFieldEntityType,
): Promise<CustomFieldDefinition[]> {
  return customFieldRepository.list(orgId, entityType);
}

export async function createDefinition(
  orgId: string,
  input: CreateDefinitionInput,
): Promise<CustomFieldDefinition> {
  assertEntityType(input.entityType);
  assertFieldType(input.fieldType);

  const key = (input.key && input.key.trim()) || slugifyKey(input.label);
  if (!key) {
    throw new CustomFieldDomainError('validation', 'Could not derive a key from the label');
  }

  const options = resolveOptions(input.fieldType, input.options);

  try {
    const created = await customFieldRepository.create({
      organizationId: orgId,
      entityType: input.entityType,
      key,
      label: input.label,
      fieldType: input.fieldType,
      options,
      required: input.required ?? false,
      sortOrder: input.sortOrder ?? 0,
    });
    logger.info(TAG, `Custom field created: ${created.entityType}.${created.key}`, { id: created.id });
    return created;
  } catch (error) {
    if (error instanceof Error && error.message === CUSTOM_FIELD_DUPLICATE) {
      throw new CustomFieldDomainError(
        'conflict',
        `A custom field with key "${key}" already exists for ${input.entityType}`,
      );
    }
    throw error;
  }
}

export async function updateDefinition(
  orgId: string,
  id: string,
  patch: UpdateDefinitionPatch,
): Promise<CustomFieldDefinition | null> {
  const existing = await customFieldRepository.findById(id, orgId);
  if (!existing) return null;

  // Options remain bound to the (immutable) fieldType: only select fields may carry them.
  const options = patch.options !== undefined
    ? resolveOptions(existing.fieldType, patch.options)
    : undefined;

  try {
    const updated = await customFieldRepository.update(id, orgId, {
      ...(patch.label !== undefined ? { label: patch.label } : {}),
      ...(patch.required !== undefined ? { required: patch.required } : {}),
      ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
      ...(options !== undefined ? { options } : {}),
    });
    if (updated) logger.info(TAG, `Custom field updated: ${id}`);
    return updated;
  } catch (error) {
    if (error instanceof Error && error.message === CUSTOM_FIELD_DUPLICATE) {
      throw new CustomFieldDomainError('conflict', 'A custom field with this key already exists');
    }
    throw error;
  }
}

export async function deleteDefinition(orgId: string, id: string): Promise<boolean> {
  const deleted = await customFieldRepository.softDelete(id, orgId);
  if (deleted) logger.info(TAG, `Custom field deleted: ${id}`);
  return deleted;
}
