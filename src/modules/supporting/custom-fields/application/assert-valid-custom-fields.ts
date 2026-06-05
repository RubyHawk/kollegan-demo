/**
 * Shared validate-on-write helper for entity custom-field values (Phase 3).
 *
 * When an entity write carries `customFields`, load the org's active field
 * definitions for that entity type and validate the values against them,
 * surfacing failures as a 400 (RFC 9457 validation error with field-level
 * issues). When `values` is undefined, this is a no-op so existing flows are
 * completely unaffected.
 *
 * This is the consolidated entry point used by product/company/lead writes.
 * The existing offer wrapper (`validateOfferCustomFields`) mirrors this shape.
 */

import { Errors } from '@platform/api/errors';
import { listDefinitions } from './custom-field.service';
import {
  validateCustomFieldValues,
  type CustomFieldEntityType,
} from '../domain/custom-field-definition.entity';

/**
 * Validate a bag of custom-field `values` for `orgId` / `entityType`.
 *
 * Throws a 400 validation error if any value violates its definition. Does
 * nothing when `values` is undefined.
 */
export async function assertValidCustomFields(
  orgId: string,
  entityType: CustomFieldEntityType,
  values: Record<string, unknown> | undefined,
): Promise<void> {
  if (values === undefined) return;

  const defs = await listDefinitions(orgId, entityType);
  const result = validateCustomFieldValues(defs, values);
  if (result.ok) return;

  throw Errors.validation(
    'Ett eller flera anpassade fält är ogiltiga',
    result.errors.map((e) => ({
      pointer: `#/customFields/${e.key}`,
      detail: e.message,
      code: 'custom_field_invalid',
    })),
  );
}
