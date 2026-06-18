import { apiGet, apiPatch, apiPost } from '../api-client';

interface ApiEnvelope<T> {
  data: T;
}

export type RestaurantOrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type RestaurantPaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type RestaurantPaymentMethod = 'cash' | 'card' | 'swish' | 'other';
export type RestaurantFulfillmentType = 'takeaway' | 'dine_in' | 'counter';
export type RestaurantBusinessDayStatus = 'open' | 'closed';

export interface RestaurantBusinessDay {
  id: string;
  organizationId: string;
  businessDate: string;
  status: RestaurantBusinessDayStatus;
  openedBy: string | null;
  openedAt: string;
  closedBy: string | null;
  closedAt: string | null;
  openingNote: string | null;
  closingNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantOrderItem {
  id: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  note: string | null;
  sortOrder: number;
}

export interface RestaurantOrder {
  id: string;
  organizationId: string;
  businessDayId: string | null;
  orderNumber: number;
  source: 'portal' | 'public';
  status: RestaurantOrderStatus;
  paymentStatus: RestaurantPaymentStatus;
  paymentMethod: RestaurantPaymentMethod | null;
  fulfillmentType: RestaurantFulfillmentType;
  customerName: string | null;
  note: string | null;
  subtotalCents: number;
  totalCents: number;
  currency: string;
  paidAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  items: RestaurantOrderItem[];
}

export interface RestaurantOrderSummary {
  businessDay: RestaurantBusinessDay | null;
  salesCents: number;
  orderCount: number;
  paidOrderCount: number;
  unpaidOrderCount: number;
  activeOrderCount: number;
  cancelledOrderCount: number;
  averageOrderCents: number;
  bestSellers: Array<{
    name: string;
    menuItemId: string | null;
    quantity: number;
    salesCents: number;
  }>;
  paymentMethods: Array<{
    method: RestaurantPaymentMethod | 'unknown';
    count: number;
    salesCents: number;
  }>;
}

export interface CreateRestaurantOrderItemPayload {
  menuItemId?: string | null;
  name?: string | null;
  quantity: number;
  unitPriceCents?: number | null;
  note?: string | null;
}

export interface CreateRestaurantOrderPayload {
  fulfillmentType?: RestaurantFulfillmentType;
  customerName?: string | null;
  note?: string | null;
  paymentStatus?: Extract<RestaurantPaymentStatus, 'unpaid' | 'paid'>;
  paymentMethod?: RestaurantPaymentMethod | null;
  items: CreateRestaurantOrderItemPayload[];
}

export interface UpdateRestaurantOrderPayload {
  status?: RestaurantOrderStatus;
  paymentStatus?: RestaurantPaymentStatus;
  paymentMethod?: RestaurantPaymentMethod | null;
  customerName?: string | null;
  note?: string | null;
}

export interface ListRestaurantOrdersParams {
  businessDayId?: string;
  status?: RestaurantOrderStatus;
  paymentStatus?: RestaurantPaymentStatus;
  from?: string;
  to?: string;
  activeOnly?: boolean;
}

function orderQuery(params: ListRestaurantOrdersParams = {}): string {
  const search = new URLSearchParams();
  if (params.businessDayId) search.set('businessDayId', params.businessDayId);
  if (params.status) search.set('status', params.status);
  if (params.paymentStatus) search.set('paymentStatus', params.paymentStatus);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.activeOnly !== undefined) search.set('activeOnly', String(params.activeOnly));
  const suffix = search.toString();
  return suffix ? `?${suffix}` : '';
}

export async function getCurrentBusinessDay(): Promise<RestaurantBusinessDay | null> {
  const res = await apiGet<ApiEnvelope<{ businessDay: RestaurantBusinessDay | null }>>('/api/v1/restaurant/orders/business-day');
  return res.data.businessDay;
}

export async function startBusinessDay(openingNote?: string | null): Promise<RestaurantBusinessDay> {
  const res = await apiPost<ApiEnvelope<{ businessDay: RestaurantBusinessDay }>>(
    '/api/v1/restaurant/orders/business-day',
    openingNote ? { openingNote } : {},
  );
  return res.data.businessDay;
}

export async function closeBusinessDay(closingNote?: string | null): Promise<RestaurantBusinessDay> {
  const res = await apiPatch<ApiEnvelope<{ businessDay: RestaurantBusinessDay }>>(
    '/api/v1/restaurant/orders/business-day/close',
    closingNote ? { closingNote } : {},
  );
  return res.data.businessDay;
}

export async function listRestaurantOrders(params: ListRestaurantOrdersParams = {}): Promise<RestaurantOrder[]> {
  const res = await apiGet<ApiEnvelope<{ orders: RestaurantOrder[] }>>(`/api/v1/restaurant/orders${orderQuery(params)}`);
  return res.data.orders;
}

export async function createRestaurantOrder(payload: CreateRestaurantOrderPayload): Promise<RestaurantOrder> {
  const res = await apiPost<ApiEnvelope<{ order: RestaurantOrder }>>('/api/v1/restaurant/orders', payload);
  return res.data.order;
}

export async function updateRestaurantOrder(
  id: string,
  payload: UpdateRestaurantOrderPayload,
): Promise<RestaurantOrder> {
  const res = await apiPatch<ApiEnvelope<{ order: RestaurantOrder }>>(`/api/v1/restaurant/orders/${id}`, payload);
  return res.data.order;
}

export async function getRestaurantOrderSummary(): Promise<RestaurantOrderSummary> {
  const res = await apiGet<ApiEnvelope<{ summary: RestaurantOrderSummary }>>('/api/v1/restaurant/orders/summary');
  return res.data.summary;
}
