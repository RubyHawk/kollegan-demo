import { z } from 'zod';
import { createHandler } from '@platform/api/handler';
import { Errors } from '@platform/api/errors';
import { created, ok } from '@platform/api/response';
import type { JWTPayload } from '@platform/auth/jwt';
import { hasPermission } from '@modules/supporting/auth';
import {
  closeBusinessDay,
  createPublicRestaurantOrder,
  createRestaurantOrder,
  getCurrentBusinessDay,
  getRestaurantOrderSummary,
  listRestaurantOrders,
  startBusinessDay,
  updateRestaurantOrder,
} from '../../application/restaurant-order.service';

function requireOrg(payload: JWTPayload | null): string {
  if (!payload?.orgId) throw Errors.forbidden('Organization context required');
  return payload.orgId;
}

function orderIdFromUrl(req: Request): string {
  const pathname = new URL(req.url).pathname;
  const id = pathname.split('/').filter(Boolean).at(-1);
  if (!id) throw Errors.badRequest('Order id is required');
  return id;
}

const OrderStatusSchema = z.enum(['new', 'preparing', 'ready', 'completed', 'cancelled']);
const PaymentStatusSchema = z.enum(['unpaid', 'paid', 'refunded']);
const PaymentMethodSchema = z.enum(['cash', 'card', 'swish', 'other']);
const FulfillmentTypeSchema = z.enum(['takeaway', 'dine_in', 'counter']);

const OrderItemSchema = z.object({
  menuItemId: z.string().uuid().nullable().optional(),
  name: z.string().max(160).nullable().optional(),
  quantity: z.number().int().min(1).max(99),
  unitPriceCents: z.number().int().min(0).max(1_000_000).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});

const CreateOrderSchema = z.object({
  fulfillmentType: FulfillmentTypeSchema.optional(),
  customerName: z.string().max(120).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
  paymentStatus: z.enum(['unpaid', 'paid']).optional(),
  paymentMethod: PaymentMethodSchema.nullable().optional(),
  items: z.array(OrderItemSchema).min(1).max(80),
});

const UpdateOrderSchema = z.object({
  status: OrderStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  paymentMethod: PaymentMethodSchema.nullable().optional(),
  customerName: z.string().max(120).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});

const ListOrdersQuerySchema = z.object({
  businessDayId: z.string().uuid().optional(),
  status: OrderStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  activeOnly: z.enum(['true', 'false']).optional(),
});

const PublicOrderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
  note: z.string().max(300).nullable().optional(),
});

const CreatePublicOrderSchema = z.object({
  fulfillmentType: z.enum(['takeaway', 'delivery']),
  customerName: z.string().min(1).max(120),
  customerPhone: z.string().min(5).max(40),
  deliveryAddress: z.string().max(400).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
  items: z.array(PublicOrderItemSchema).min(1).max(80),
});

const StartBusinessDaySchema = z.object({
  openingNote: z.string().max(1000).nullable().optional(),
}).optional();

const CloseBusinessDaySchema = z.object({
  closingNote: z.string().max(1000).nullable().optional(),
}).optional();

async function permissionFlags(payload: JWTPayload | null) {
  const roles = payload?.roles ?? [];
  const [canMarkPaid, canAdmin] = await Promise.all([
    hasPermission(roles, 'orders.payment'),
    hasPermission(roles, 'orders.admin'),
  ]);
  return { canMarkPaid, canAdmin };
}

export const handleGetCurrentBusinessDay = createHandler(
  {
    tag: 'RestaurantOrders:GetBusinessDay',
    auth: 'jwt',
    permission: 'orders.read',
    rateLimit: { max: 120, windowMs: 60_000 },
  },
  async ({ auth }) => {
    const orgId = requireOrg(auth);
    return ok({ businessDay: await getCurrentBusinessDay(orgId) });
  },
);

export const handleStartBusinessDay = createHandler(
  {
    tag: 'RestaurantOrders:StartBusinessDay',
    auth: 'jwt',
    permission: 'orders.write',
    rateLimit: { max: 30, windowMs: 60_000 },
    body: StartBusinessDaySchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    const businessDay = await startBusinessDay(orgId, auth!.sub, body ?? {});
    return created({ businessDay }, '/api/v1/restaurant/orders/business-day');
  },
);

export const handleCloseBusinessDay = createHandler(
  {
    tag: 'RestaurantOrders:CloseBusinessDay',
    auth: 'jwt',
    permission: 'orders.admin',
    rateLimit: { max: 20, windowMs: 60_000 },
    body: CloseBusinessDaySchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    return ok({ businessDay: await closeBusinessDay(orgId, auth!.sub, body ?? {}) });
  },
);

export const handleListRestaurantOrders = createHandler(
  {
    tag: 'RestaurantOrders:List',
    auth: 'jwt',
    permission: 'orders.read',
    rateLimit: { max: 120, windowMs: 60_000 },
    query: ListOrdersQuerySchema,
  },
  async ({ auth, query }) => {
    const orgId = requireOrg(auth);
    const orders = await listRestaurantOrders(orgId, {
      ...query,
      activeOnly: query?.activeOnly === 'true',
    });
    return ok({ orders });
  },
);

export const handleCreateRestaurantOrder = createHandler(
  {
    tag: 'RestaurantOrders:Create',
    auth: 'jwt',
    permission: 'orders.write',
    rateLimit: { max: 80, windowMs: 60_000 },
    body: CreateOrderSchema,
  },
  async ({ auth, body }) => {
    const orgId = requireOrg(auth);
    const { canMarkPaid } = await permissionFlags(auth);
    const order = await createRestaurantOrder(orgId, auth!.sub, body!, { canMarkPaid });
    return created({ order }, `/api/v1/restaurant/orders/${order.id}`);
  },
);

export const handleUpdateRestaurantOrder = createHandler(
  {
    tag: 'RestaurantOrders:Update',
    auth: 'jwt',
    permission: 'orders.write',
    rateLimit: { max: 120, windowMs: 60_000 },
    body: UpdateOrderSchema,
  },
  async ({ auth, body, req }) => {
    const orgId = requireOrg(auth);
    const flags = await permissionFlags(auth);
    return ok({
      order: await updateRestaurantOrder(orgId, orderIdFromUrl(req), auth!.sub, body!, flags),
    });
  },
);

export const handleGetRestaurantOrderSummary = createHandler(
  {
    tag: 'RestaurantOrders:Summary',
    auth: 'jwt',
    permission: 'restaurant_reports.read',
    rateLimit: { max: 120, windowMs: 60_000 },
  },
  async ({ auth }) => {
    const orgId = requireOrg(auth);
    return ok({ summary: await getRestaurantOrderSummary(orgId) });
  },
);

// Public, unauthenticated customer order from the website. Org is resolved from the request host;
// prices are snapshotted server-side; the order is created as source=public, unpaid.
export const handleCreatePublicRestaurantOrder = createHandler(
  {
    tag: 'RestaurantOrders:PublicCreate',
    auth: 'none',
    rateLimit: { max: 20, windowMs: 60_000 },
    body: CreatePublicOrderSchema,
  },
  async ({ req, body }) =>
    created({ order: await createPublicRestaurantOrder(req.headers.get('host'), body!) }, '/api/v1/public-site/orders'),
);
