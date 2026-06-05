/**
 * Custom Fields Module — public interface.
 *
 * Org-defined extra fields per entity type. Other modules ONLY import from this
 * file. Internals (infrastructure, application, api) are not imported directly.
 */

export type {
  CustomFieldEntityType,
  CustomFieldType,
  CustomFieldOption,
  CustomFieldDefinition,
  CustomFieldValues,
  CustomFieldValueError,
  ValidateCustomFieldValuesResult,
} from './domain/custom-field-definition.entity';
export {
  CUSTOM_FIELD_ENTITY_TYPES,
  CUSTOM_FIELD_TYPES,
  isCustomFieldEntityType,
  isCustomFieldType,
  slugifyKey,
  validateCustomFieldValues,
} from './domain/custom-field-definition.entity';

export {
  listDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
  CustomFieldDomainError,
} from './application/custom-field.service';
export type {
  CreateDefinitionInput,
  UpdateDefinitionPatch,
} from './application/custom-field.service';

export { assertValidCustomFields } from './application/assert-valid-custom-fields';

export {
  handleListCustomFields,
  handleCreateCustomField,
  handleUpdateCustomField,
  handleDeleteCustomField,
} from './api/handlers/custom-field-definition.handler';
