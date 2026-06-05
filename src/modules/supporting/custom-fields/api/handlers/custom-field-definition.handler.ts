/**
 * Custom Field Definition API handlers — colocated with the custom-fields module.
 *
 * app/api/v1/custom-fields/ routes are thin re-export wrappers that point here.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, created } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  CUSTOM_FIELD_ENTITY_TYPES,
  CUSTOM_FIELD_TYPES,
} from '../../domain/custom-field-definition.entity';
import {
  listDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
  CustomFieldDomainError,
} from '../../application/custom-field.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

function extractId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').at(-1) ?? '';
}

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  return payload;
}

function translateDomainError(error: unknown): never {
  if (error instanceof CustomFieldDomainError) {
    if (error.kind === 'conflict') throw Errors.conflict(error.message);
    throw Errors.validation(error.message);
  }
  throw error instanceof Error ? error : Errors.internal();
}

function customFieldLocation(id: string): string {
  return `/api/v1/custom-fields/${id}`;
}

// ── Shared schema pieces ──────────────────────────────────────────────────────

const NO_NEWLINE = /^[^\r\n]*$/;

const EntityTypeEnum = z.enum(CUSTOM_FIELD_ENTITY_TYPES);
const FieldTypeEnum = z.enum(CUSTOM_FIELD_TYPES);

const OptionSchema = z.object({
  label: z.string().trim().min(1).max(200).regex(NO_NEWLINE, 'Option label must not contain newlines'),
  value: z.string().trim().min(1).max(200).regex(NO_NEWLINE, 'Option value must not contain newlines'),
});

const LabelSchema = z.string().trim().min(1).max(200).regex(NO_NEWLINE, 'Label must not contain newlines');
const KeySchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9_]+$/, 'Key must be a lowercase slug (a-z, 0-9, underscore)');

// ── List Custom Fields ─────────────────────────────────────────────────────────

const ListQuerySchema = z.object({
  entityType: EntityTypeEnum.optional(),
});

export const handleListCustomFields = createHandler(
  {
    auth: 'jwt',
    tag: 'CustomFields:List',
    query: ListQuerySchema,
    permission: 'custom_fields.read',
    rateLimit: { max: 120, windowMs: 60_000 },
  },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof ListQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const definitions = await listDefinitions(payload.orgId!, query.entityType);
    return ok({ definitions });
  },
);

// ── Create Custom Field ──────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  entityType: EntityTypeEnum,
  label: LabelSchema,
  key: KeySchema.optional(),
  fieldType: FieldTypeEnum,
  options: z.array(OptionSchema).max(100).optional(),
  required: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const handleCreateCustomField = createHandler(
  {
    auth: 'jwt',
    tag: 'CustomFields:Create',
    body: CreateBodySchema,
    permission: 'custom_fields.write',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);

    try {
      const definition = await createDefinition(payload.orgId!, {
        entityType: body.entityType,
        label: body.label,
        key: body.key,
        fieldType: body.fieldType,
        options: body.options ?? null,
        required: body.required,
        sortOrder: body.sortOrder,
      });
      return created(definition, customFieldLocation(definition.id));
    } catch (error) {
      translateDomainError(error);
    }
  },
);

// ── Update Custom Field ──────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  label: LabelSchema.optional(),
  options: z.array(OptionSchema).max(100).optional().nullable(),
  required: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

export const handleUpdateCustomField = createHandler(
  {
    auth: 'jwt',
    tag: 'CustomFields:Update',
    body: UpdateBodySchema,
    permission: 'custom_fields.write',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);

    try {
      const updated = await updateDefinition(payload.orgId!, id, {
        ...(body.label !== undefined ? { label: body.label } : {}),
        ...(body.required !== undefined ? { required: body.required } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.options !== undefined ? { options: body.options } : {}),
      });
      if (!updated) throw Errors.notFound('Custom field not found');
      return ok(updated);
    } catch (error) {
      translateDomainError(error);
    }
  },
);

// ── Delete Custom Field ──────────────────────────────────────────────────────

export const handleDeleteCustomField = createHandler(
  {
    auth: 'jwt',
    tag: 'CustomFields:Delete',
    permission: 'custom_fields.write',
    rateLimit: { max: 30, windowMs: 60_000 },
  },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    const deleted = await deleteDefinition(payload.orgId!, id);
    if (!deleted) throw Errors.notFound('Custom field not found');
    return ok(null);
  },
);
