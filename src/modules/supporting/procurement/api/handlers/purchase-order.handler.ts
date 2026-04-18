import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { created, ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  createPurchaseOrder,
  markPurchaseOrderReceived,
  markPurchaseOrderSubmitted,
} from '../../application/procurement.service';

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? req.cookies.get('token')?.value ?? '';
}

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  if (!payload.roles.some((r) => ['super_admin', 'admin', 'user'].includes(r))) throw Errors.forbidden('Staff role required');
  return payload;
}

function extractProjectId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  return parts[parts.indexOf('projekt') + 1] ?? '';
}

function extractPurchaseOrderId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  return parts[parts.indexOf('purchase-orders') + 1] ?? '';
}

const PurchaseOrderLineSchema = z.object({
  projectLineItemId: z.string().uuid().optional().nullable(),
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit: z.string().max(50).optional(),
  unitCost: z.number().min(0),
  vatRate: z.number().min(0).max(1).default(0.25),
});

const CreatePurchaseOrderBodySchema = z.object({
  supplierId: z.string().uuid(),
  items: z.array(PurchaseOrderLineSchema).min(1),
  expectedDeliveryDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const handleCreateProjectPurchaseOrder = createHandler(
  { auth: 'jwt', tag: 'PurchaseOrders:Create', body: CreatePurchaseOrderBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreatePurchaseOrderBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    try {
      const purchaseOrder = await createPurchaseOrder(
        extractProjectId(req),
        payload.orgId!,
        body.supplierId,
        body.items,
        payload.sub,
        {
          expectedDeliveryDate: body.expectedDeliveryDate ? new Date(body.expectedDeliveryDate) : null,
          notes: body.notes,
        },
      );
      return created({ purchaseOrder });
    } catch (err) {
      if ((err as { code?: string }).code === 'PROJECT_NOT_FOUND') throw Errors.notFound('Project not found');
      if ((err as { code?: string }).code === 'SUPPLIER_NOT_FOUND') throw Errors.notFound('Supplier not found');
      throw err;
    }
  },
);

const SubmitBodySchema = z.object({
  supplierReference: z.string().max(200).optional().nullable(),
  expectedDeliveryDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const handleSubmitPurchaseOrder = createHandler(
  { auth: 'jwt', tag: 'PurchaseOrders:Submit', body: SubmitBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof SubmitBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const purchaseOrder = await markPurchaseOrderSubmitted(
      extractPurchaseOrderId(req),
      extractProjectId(req),
      payload.orgId!,
      payload.sub,
      {
        supplierReference: body.supplierReference,
        expectedDeliveryDate: body.expectedDeliveryDate ? new Date(body.expectedDeliveryDate) : null,
        notes: body.notes,
      },
    );
    if (!purchaseOrder) throw Errors.notFound('Purchase order not found');
    return ok({ purchaseOrder });
  },
);

const ReceiveBodySchema = z.object({
  receivedItems: z.array(z.object({
    lineItemId: z.string().uuid(),
    receivedQuantity: z.number().min(0),
  })).optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export const handleReceivePurchaseOrder = createHandler(
  { auth: 'jwt', tag: 'PurchaseOrders:Receive', body: ReceiveBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof ReceiveBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const purchaseOrder = await markPurchaseOrderReceived(
      extractPurchaseOrderId(req),
      extractProjectId(req),
      payload.orgId!,
      payload.sub,
      body.receivedItems,
      body.notes,
    );
    if (!purchaseOrder) throw Errors.notFound('Purchase order not found');
    return ok({ purchaseOrder });
  },
);
