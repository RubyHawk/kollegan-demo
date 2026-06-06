/**
 * Invoice PDF endpoint — streams the frozen archival PDF bytes.
 *
 * Colocated with the invoicing module; the route file is a thin re-export.
 * JWT-authenticated, org-scoped, and gated on `invoices.read`. Streams the
 * stored `generatedPdf` (rendered once at send time) as application/pdf, inline.
 * Returns 404 when the invoice is not issued or carries no stored bytes yet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import { getInvoice, getInvoicePdfBytes } from '../../application/invoice.service';

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

function extractId(req: NextRequest): string {
  // …/invoices/[id]/pdf — the id is the second-to-last segment.
  const segments = req.nextUrl.pathname.split('/').filter(Boolean);
  return segments.at(-2) ?? '';
}

export const handleGetInvoicePdf = createHandler(
  {
    auth: 'jwt',
    tag: 'Invoices:Pdf',
    permission: 'invoices.read',
    rateLimit: { max: 120, windowMs: 60_000 },
  },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const id = extractId(req);
    const invoice = await getInvoice(id, payload.orgId);
    // 404 when the invoice is missing or still a draft (never issued → no PDF).
    if (!invoice || invoice.status === 'draft') throw Errors.notFound('Invoice');

    const bytes = await getInvoicePdfBytes(id, payload.orgId);
    if (!bytes) throw Errors.notFound('Invoice PDF');

    const number = invoice.invoiceNumber != null ? String(invoice.invoiceNumber) : id;
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="faktura-${number}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  },
);
