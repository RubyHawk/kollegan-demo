/**
 * Custom-field value validation for offer create/update (Phase 3).
 *
 * When an offer write carries `customFields`, we load the org's active offer
 * field definitions and validate the values against them, surfacing failures as
 * a 400 — the same shape the rest of the offers API uses (RFC 9457 validation
 * error with field-level issues). When `customFields` is absent, this is a
 * no-op so existing flows are completely unaffected.
 *
 * Cross-module access goes ONLY through the custom-fields module's public
 * entrypoint (`@modules/supporting/custom-fields`), never its internals.
 */

import { Errors } from '@platform/api/errors';
import {
  listDefinitions,
  validateCustomFieldValues,
} from '@modules/supporting/custom-fields';

/**
 * Validate a bag of offer custom-field values for `orgId`.
 *
 * Throws a 400 validation error if any value violates its definition. Does
 * nothing when `customFields` is undefined.
 */
export async function validateOfferCustomFields(
  orgId: string,
  customFields: Record<string, unknown> | undefined,
): Promise<void> {
  if (customFields === undefined) return;

  const defs = await listDefinitions(orgId, 'offer');
  const result = validateCustomFieldValues(defs, customFields);
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
