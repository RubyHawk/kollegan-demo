/**
 * Offer / Quotation Builder Module
 *
 * Status: PLANNED — not yet implemented.
 *
 * To add this module:
 * 1. Create Prisma models: Offer, OfferLineItem
 * 2. Add API routes under /api/offers/
 * 3. Build OfferBuilder component (line-item editor with preview)
 * 4. Add PDF generation (react-pdf or puppeteer)
 * 5. Add email delivery via n8n or direct SMTP
 * 6. Register in DashboardSidebar NAV_ITEMS
 *
 * See docs/ARCHITECTURE.md for the full ERP module roadmap.
 */

export type { Offer, OfferLineItem, OfferStatus } from './domain/offer.entity';
