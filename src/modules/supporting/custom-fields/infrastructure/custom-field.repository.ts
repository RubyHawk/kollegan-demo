/**
 * Custom Field Definition repository — Prisma CRUD.
 *
 * All queries are org-scoped and soft-delete-aware (deletedAt IS NULL), and
 * ordered by sortOrder asc, createdAt asc. Rows are mapped to the domain entity
 * with dates serialised to ISO strings. Prisma is allowed only in this layer.
 */

import { Prisma, prisma } from '@platform/database/prisma';
import type {
  CustomFieldDefinition,
  CustomFieldEntityType,
  CustomFieldOption,
  CustomFieldType,
} from '../domain/custom-field-definition.entity';

export interface CreateCustomFieldInput {
  organizationId: string;
  entityType: CustomFieldEntityType;
  key: string;
  label: string;
  fieldType: CustomFieldType;
  options?: CustomFieldOption[] | null;
  required?: boolean;
  sortOrder?: number;
}

export interface UpdateCustomFieldInput {
  label?: string;
  required?: boolean;
  sortOrder?: number;
  options?: CustomFieldOption[] | null;
}

type CustomFieldRow = {
  id: string;
  organizationId: string;
  entityType: string;
  key: string;
  label: string;
  fieldType: string;
  options: Prisma.JsonValue | null;
  required: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

const CUSTOM_FIELD_SELECT = {
  id: true,
  organizationId: true,
  entityType: true,
  key: true,
  label: true,
  fieldType: true,
  options: true,
  required: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomFieldDefinitionSelect;

function mapOptions(value: Prisma.JsonValue | null): CustomFieldOption[] | null {
  if (!Array.isArray(value)) return null;
  const options: CustomFieldOption[] = [];
  for (const entry of value) {
    if (entry && typeof entry === 'object' && 'label' in entry && 'value' in entry) {
      const record = entry as Record<string, unknown>;
      options.push({ label: String(record.label), value: String(record.value) });
    }
  }
  return options.length > 0 ? options : null;
}

function mapDefinition(row: CustomFieldRow): CustomFieldDefinition {
  return {
    id: row.id,
    organizationId: row.organizationId,
    entityType: row.entityType as CustomFieldEntityType,
    key: row.key,
    label: row.label,
    fieldType: row.fieldType as CustomFieldType,
    options: mapOptions(row.options),
    required: row.required,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function optionsToJson(options?: CustomFieldOption[] | null): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (!options || options.length === 0) return Prisma.JsonNull;
  return options.map((o) => ({ label: o.label, value: o.value }));
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/** Sentinel thrown on a duplicate (org, entityType, key); translated to 409 at the handler. */
export const CUSTOM_FIELD_DUPLICATE = 'CUSTOM_FIELD_DUPLICATE';

export const customFieldRepository = {
  async list(orgId: string, entityType?: CustomFieldEntityType): Promise<CustomFieldDefinition[]> {
    const rows = await prisma.customFieldDefinition.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(entityType ? { entityType } : {}),
      },
      select: CUSTOM_FIELD_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => mapDefinition(row as CustomFieldRow));
  },

  async findById(id: string, orgId: string): Promise<CustomFieldDefinition | null> {
    const row = await prisma.customFieldDefinition.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: CUSTOM_FIELD_SELECT,
    });
    return row ? mapDefinition(row as CustomFieldRow) : null;
  },

  async create(input: CreateCustomFieldInput): Promise<CustomFieldDefinition> {
    try {
      const row = await prisma.customFieldDefinition.create({
        data: {
          organizationId: input.organizationId,
          entityType: input.entityType,
          key: input.key,
          label: input.label,
          fieldType: input.fieldType,
          options: optionsToJson(input.options),
          required: input.required ?? false,
          sortOrder: input.sortOrder ?? 0,
        },
        select: CUSTOM_FIELD_SELECT,
      });
      return mapDefinition(row as CustomFieldRow);
    } catch (error) {
      if (isUniqueConstraintError(error)) throw new Error(CUSTOM_FIELD_DUPLICATE);
      throw error;
    }
  },

  async update(id: string, orgId: string, patch: UpdateCustomFieldInput): Promise<CustomFieldDefinition | null> {
    const existing = await prisma.customFieldDefinition.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    try {
      const row = await prisma.customFieldDefinition.update({
        where: { id },
        data: {
          ...(patch.label !== undefined ? { label: patch.label } : {}),
          ...(patch.required !== undefined ? { required: patch.required } : {}),
          ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
          ...(patch.options !== undefined ? { options: optionsToJson(patch.options) } : {}),
        },
        select: CUSTOM_FIELD_SELECT,
      });
      return mapDefinition(row as CustomFieldRow);
    } catch (error) {
      if (isUniqueConstraintError(error)) throw new Error(CUSTOM_FIELD_DUPLICATE);
      throw error;
    }
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.customFieldDefinition.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return false;

    await prisma.customFieldDefinition.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
    return true;
  },
};
