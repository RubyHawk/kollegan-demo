import { z } from 'zod';
import { createHandler } from '@platform/api/handler';
import { Errors } from '@platform/api/errors';
import { created, noContent, ok } from '@platform/api/response';
import type { JWTPayload } from '@platform/auth/jwt';
import {
  createPublicReservationRequest,
  createRestaurantEvent,
  createRestaurantMenuCategory,
  createRestaurantMenuItem,
  deleteRestaurantEvent,
  deleteRestaurantMenuCategory,
  deleteRestaurantMenuItem,
  getPublicSiteSettings,
  getPublicRestaurantSite,
  listRestaurantEvents,
  listReservationRequests,
  listRestaurantMenu,
  listRestaurantOpeningHours,
  updatePublicSiteSettings,
  updateRestaurantEvent,
  updateRestaurantMenuCategory,
  updateRestaurantMenuItem,
  updateReservationRequest,
  upsertRestaurantOpeningHour,
} from '../../application/restaurant-menu.service';
import { tenantHasModule } from '@platform/tenancy/tenant-resolver';

function requireOrg(payload: JWTPayload | null): string {
  if (!payload?.orgId) throw Errors.forbidden('Organization context required');
  return payload.orgId;
}

function idFromUrl(req: Request, label: string): string {
  const pathname = new URL(req.url).pathname;
  const id = pathname.split('/').filter(Boolean).at(-1);
  if (!id) throw Errors.badRequest(`${label} id is required`);
  return id;
}

function eventIdFromUrl(req: Request): string {
  return idFromUrl(req, 'Restaurant event');
}

async function requireRestaurantModule(orgId: string, moduleKey: string) {
  const enabled = await tenantHasModule(orgId, moduleKey);
  if (!enabled) throw Errors.forbidden('Module is not enabled for this organization');
}

const CategorySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

const IngredientSchema = z.object({
  ingredientId: z.string().max(64).nullable().optional(),
  emoji: z.string().max(16).nullable().optional(),
  name: z.string().min(1).max(120),
  quantity: z.string().max(40).nullable().optional(),
  unit: z.string().max(40).nullable().optional(),
  note: z.string().max(200).nullable().optional(),
});

const ItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(160),
  description: z.string().max(1000).nullable().optional(),
  priceCents: z.number().int().min(0).max(1_000_000).nullable().optional(),
  currency: z.string().min(3).max(3).optional(),
  imageUrl: z.string().url().max(1000).nullable().optional(),
  allergens: z.array(z.string().max(40)).max(20).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  ingredients: z.array(IngredientSchema).max(60).optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

const CategoryUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  isActive: z.boolean().optional(),
});

const ItemUpdateSchema = ItemSchema.partial();

const OpeningHourSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  opensAt: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  closesAt: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  isClosed: z.boolean().optional(),
  label: z.string().max(100).nullable().optional(),
});

const ReservationSchema = z.object({
  guestName: z.string().min(1).max(120),
  guestEmail: z.string().email().max(254).nullable().optional(),
  guestPhone: z.string().min(5).max(40).nullable().optional(),
  partySize: z.number().int().min(1).max(40),
  requestedAt: z.string().datetime(),
  message: z.string().max(1000).nullable().optional(),
});

const ReservationStatusSchema = z.enum(['new', 'confirmed', 'declined', 'cancelled']);

const ReservationListQuerySchema = z.object({
  status: ReservationStatusSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const ReservationUpdateSchema = z.object({
  status: ReservationStatusSchema,
});

const NullableText = (max: number) => z.string().max(max).nullable().optional();

const PublicSiteSettingsSchema = z.object({
  siteName: z.string().min(1).max(120).optional(),
  heroTitle: z.string().min(1).max(160).optional(),
  heroSubtitle: NullableText(300),
  about: NullableText(3000),
  phone: NullableText(60),
  email: z.string().email().max(254).nullable().optional(),
  addressLine1: NullableText(160),
  addressLine2: NullableText(160),
  postalCode: NullableText(20),
  city: NullableText(120),
  country: NullableText(2),
  reservationEmail: z.string().email().max(254).nullable().optional(),
  seoTitle: NullableText(160),
  seoDescription: NullableText(300),
});

const EventSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable().optional(),
  isPublished: z.boolean().optional(),
});

const EventUpdateSchema = EventSchema.partial();

export const handleGetPublicRestaurantSite = createHandler(
  {
    tag: 'RestaurantPublic:GetSite',
    auth: 'none',
    rateLimit: { max: 120, windowMs: 60_000 },
  },
  async ({ req }) => ok(await getPublicRestaurantSite(req.headers.get('host'))),
);

export const handleCreatePublicReservationRequest = createHandler(
  {
    tag: 'RestaurantPublic:Reservation',
    auth: 'none',
    rateLimit: { max: 20, windowMs: 60_000 },
    body: ReservationSchema,
  },
  async ({ req, body }) => created(await createPublicReservationRequest(req.headers.get('host'), body!), '/api/v1/public-site/reservations'),
);

export const handleListRestaurantMenu = createHandler(
  {
    tag: 'RestaurantMenu:List',
    auth: 'jwt',
    permission: 'menu.read',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async ({ auth }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_menu');
    return ok({ categories: await listRestaurantMenu(orgId) });
  },
);

export const handleCreateRestaurantMenuCategory = createHandler(
  {
    tag: 'RestaurantMenu:CreateCategory',
    auth: 'jwt',
    permission: 'menu.write',
    rateLimit: { max: 30, windowMs: 60_000 },
    body: CategorySchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_menu');
    const category = await createRestaurantMenuCategory(orgId, auth!.sub, body!);
    return created({ category }, `/api/v1/restaurant/menu/categories?id=${category.id}`);
  },
);

export const handleCreateRestaurantMenuItem = createHandler(
  {
    tag: 'RestaurantMenu:CreateItem',
    auth: 'jwt',
    permission: 'menu.write',
    rateLimit: { max: 30, windowMs: 60_000 },
    body: ItemSchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_menu');
    const item = await createRestaurantMenuItem(orgId, auth!.sub, body!);
    return created({ item }, `/api/v1/restaurant/menu/items?id=${item.id}`);
  },
);

export const handleUpdateRestaurantMenuCategory = createHandler(
  {
    tag: 'RestaurantMenu:UpdateCategory',
    auth: 'jwt',
    permission: 'menu.write',
    rateLimit: { max: 40, windowMs: 60_000 },
    body: CategoryUpdateSchema,
  },
  async ({ auth, body, req }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_menu');
    const category = await updateRestaurantMenuCategory(orgId, idFromUrl(req, 'Menu category'), body!);
    return ok({ category });
  },
);

export const handleDeleteRestaurantMenuCategory = createHandler(
  {
    tag: 'RestaurantMenu:DeleteCategory',
    auth: 'jwt',
    permission: 'menu.write',
    rateLimit: { max: 20, windowMs: 60_000 },
  },
  async ({ auth, req }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_menu');
    await deleteRestaurantMenuCategory(orgId, idFromUrl(req, 'Menu category'));
    return noContent();
  },
);

export const handleUpdateRestaurantMenuItem = createHandler(
  {
    tag: 'RestaurantMenu:UpdateItem',
    auth: 'jwt',
    permission: 'menu.write',
    rateLimit: { max: 60, windowMs: 60_000 },
    body: ItemUpdateSchema,
  },
  async ({ auth, body, req }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_menu');
    const item = await updateRestaurantMenuItem(orgId, idFromUrl(req, 'Menu item'), body!);
    return ok({ item });
  },
);

export const handleDeleteRestaurantMenuItem = createHandler(
  {
    tag: 'RestaurantMenu:DeleteItem',
    auth: 'jwt',
    permission: 'menu.write',
    rateLimit: { max: 30, windowMs: 60_000 },
  },
  async ({ auth, req }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_menu');
    await deleteRestaurantMenuItem(orgId, idFromUrl(req, 'Menu item'));
    return noContent();
  },
);

export const handleListRestaurantOpeningHours = createHandler(
  {
    tag: 'RestaurantHours:List',
    auth: 'jwt',
    permission: 'menu.read',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async ({ auth }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_menu');
    return ok({ openingHours: await listRestaurantOpeningHours(orgId) });
  },
);

export const handleUpsertRestaurantOpeningHour = createHandler(
  {
    tag: 'RestaurantHours:Upsert',
    auth: 'jwt',
    permission: 'menu.write',
    rateLimit: { max: 30, windowMs: 60_000 },
    body: OpeningHourSchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_menu');
    const openingHour = await upsertRestaurantOpeningHour(orgId, body!);
    return ok({ openingHour });
  },
);

export const handleListRestaurantReservations = createHandler(
  {
    tag: 'RestaurantReservations:List',
    auth: 'jwt',
    permission: 'reservations.read',
    rateLimit: { max: 60, windowMs: 60_000 },
    query: ReservationListQuerySchema,
  },
  async ({ auth, query }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_public_site');
    return ok({ reservations: await listReservationRequests(orgId, query ?? {}) });
  },
);

export const handleGetPublicSiteSettings = createHandler(
  {
    tag: 'RestaurantPublicSiteSettings:Get',
    auth: 'jwt',
    permission: 'public_site.read',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async ({ auth }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_public_site');
    return ok({ settings: await getPublicSiteSettings(orgId) });
  },
);

export const handleUpdatePublicSiteSettings = createHandler(
  {
    tag: 'RestaurantPublicSiteSettings:Update',
    auth: 'jwt',
    permission: 'public_site.write',
    rateLimit: { max: 30, windowMs: 60_000 },
    body: PublicSiteSettingsSchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_public_site');
    return ok({ settings: await updatePublicSiteSettings(orgId, body!) });
  },
);

export const handleListRestaurantEvents = createHandler(
  {
    tag: 'RestaurantEvents:List',
    auth: 'jwt',
    permission: 'public_site.read',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async ({ auth }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_public_site');
    return ok({ events: await listRestaurantEvents(orgId) });
  },
);

export const handleCreateRestaurantEvent = createHandler(
  {
    tag: 'RestaurantEvents:Create',
    auth: 'jwt',
    permission: 'public_site.write',
    rateLimit: { max: 30, windowMs: 60_000 },
    body: EventSchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_public_site');
    const event = await createRestaurantEvent(orgId, auth!.sub, body!);
    return created({ event }, `/api/v1/restaurant/events/${event.id}`);
  },
);

export const handleUpdateRestaurantEvent = createHandler(
  {
    tag: 'RestaurantEvents:Update',
    auth: 'jwt',
    permission: 'public_site.write',
    rateLimit: { max: 40, windowMs: 60_000 },
    body: EventUpdateSchema,
  },
  async ({ auth, body, req }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_public_site');
    return ok({ event: await updateRestaurantEvent(orgId, eventIdFromUrl(req), body!) });
  },
);

export const handleDeleteRestaurantEvent = createHandler(
  {
    tag: 'RestaurantEvents:Delete',
    auth: 'jwt',
    permission: 'public_site.write',
    rateLimit: { max: 20, windowMs: 60_000 },
  },
  async ({ auth, req }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_public_site');
    await deleteRestaurantEvent(orgId, eventIdFromUrl(req));
    return noContent();
  },
);

export const handleUpdateRestaurantReservation = createHandler(
  {
    tag: 'RestaurantReservations:Update',
    auth: 'jwt',
    permission: 'reservations.write',
    rateLimit: { max: 40, windowMs: 60_000 },
    body: ReservationUpdateSchema,
  },
  async ({ auth, body, req }) => {
    const orgId = requireOrg(auth);
    await requireRestaurantModule(orgId, 'restaurant_public_site');
    const reservationId = req.nextUrl.pathname.split('/').filter(Boolean).at(-1);
    if (!reservationId) throw Errors.validation('Reservation id is required');
    const reservation = await updateReservationRequest(orgId, reservationId, auth!.sub, body!);
    return ok({ reservation });
  },
);
