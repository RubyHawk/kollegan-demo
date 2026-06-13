import { z } from 'zod';
import { createHandler } from '@platform/api/handler';
import { Errors } from '@platform/api/errors';
import { created, ok } from '@platform/api/response';
import type { JWTPayload } from '@platform/auth/jwt';
import { tenantHasModule } from '@platform/tenancy/tenant-resolver';
import {
  createCustomIngredient,
  getIngredientCatalog,
} from '../../application/ingredient-catalog.service';

function requireOrg(payload: JWTPayload | null): string {
  if (!payload?.orgId) throw Errors.forbidden('Organization context required');
  return payload.orgId;
}

async function requireMenuModule(orgId: string) {
  const enabled = await tenantHasModule(orgId, 'restaurant_menu');
  if (!enabled) throw Errors.forbidden('Module is not enabled for this organization');
}

const CreateIngredientSchema = z.object({
  categoryId: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  emoji: z.string().max(16).nullable().optional(),
  defaultUnit: z.string().max(40).nullable().optional(),
  aliases: z.array(z.string().max(60)).max(20).optional(),
  allergens: z.array(z.string().max(40)).max(20).optional(),
});

export const handleListIngredientCatalog = createHandler(
  {
    tag: 'IngredientCatalog:List',
    auth: 'jwt',
    permission: 'menu.read',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async ({ auth }) => {
    const orgId = requireOrg(auth);
    await requireMenuModule(orgId);
    return ok({ catalog: await getIngredientCatalog(orgId) });
  },
);

export const handleCreateIngredient = createHandler(
  {
    tag: 'IngredientCatalog:Create',
    auth: 'jwt',
    permission: 'menu.write',
    rateLimit: { max: 40, windowMs: 60_000 },
    body: CreateIngredientSchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    await requireMenuModule(orgId);
    const ingredient = await createCustomIngredient(orgId, auth!.sub, body!);
    return created({ ingredient }, `/api/v1/restaurant/ingredients?id=${ingredient.id}`);
  },
);
