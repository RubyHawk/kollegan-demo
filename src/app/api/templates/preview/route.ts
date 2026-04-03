import { NextResponse } from 'next/server';
import { generateDocument, generateFallbackDocument } from '@modules/supporting/offers/application/document-generator';
import type { Offer } from '@modules/supporting/offers/domain/offer.entity';

// ── Sample offer used for template preview ────────────────────────────────────
// Swedish B2B demo data — realistic but fictitious.

const SAMPLE_OFFER: Offer = {
  id:               'preview-000',
  title:            'Hotellprojekt Q2 2026',
  status:           'draft',
  offerNumber:      42,
  priceDisplayMode: 'exclusive',
  recipientName:    'Anna Lindström',
  recipientEmail:   'anna@lindstrom-hotell.se',
  recipientCompany: 'Lindström Hotell AB',
  notes:            'Exklusive resekostnader. Betalning 30 dagar netto.',
  validUntil:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  totalExVat:       85000,
  totalIncVat:      106250,
  createdAt:        new Date().toISOString(),
  publicToken:      'preview-token',
  reminderCount:    0,
  validityDays:     30,
  createdBy:        'preview',
  signatureMethod:  'canvas',
  lineItems: [
    { id: 'li-1', description: 'Konsulttjänst — projektledning', quantity: 10, unitPrice: 5000, vatRate: 0.25, discount: 0 },
    { id: 'li-2', description: 'Systemintegration',              quantity: 1,  unitPrice: 35000, vatRate: 0.25, discount: 0 },
  ],
};

interface PartialOfferInput {
  title?:            string;
  priceDisplayMode?: 'exclusive' | 'inclusive';
  recipientName?:    string;
  recipientEmail?:   string;
  recipientCompany?: string;
  notes?:            string;
  lineItems?: Array<{
    description: string;
    quantity:    number;
    unitPrice:   number;
    vatRate:     number;
    discount:    number;
  }>;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { content?: string; offer?: PartialOfferInput };

    // Merge incoming partial offer data with sample defaults
    const partialItems = body.offer?.lineItems;
    const lineItems = partialItems && partialItems.length > 0
      ? partialItems.map((li, i) => ({ id: `li-${i}`, ...li }))
      : SAMPLE_OFFER.lineItems;

    // Compute totals from line items
    let exVat = 0, vatAmt = 0;
    for (const li of lineItems) {
      const disc = 1 - ((li.discount ?? 0) / 100);
      const line = li.quantity * li.unitPrice * disc;
      exVat  += line;
      vatAmt += line * li.vatRate;
    }

    const offer: Offer = {
      ...SAMPLE_OFFER,
      ...(body.offer?.title            ? { title:            body.offer.title            } : {}),
      ...(body.offer?.priceDisplayMode ? { priceDisplayMode: body.offer.priceDisplayMode } : {}),
      ...(body.offer?.recipientName    ? { recipientName:    body.offer.recipientName    } : {}),
      ...(body.offer?.recipientEmail   ? { recipientEmail:   body.offer.recipientEmail   } : {}),
      ...(body.offer?.recipientCompany != null ? { recipientCompany: body.offer.recipientCompany } : {}),
      ...(body.offer?.notes != null    ? { notes:            body.offer.notes            } : {}),
      lineItems,
      totalExVat:  Math.round(exVat  * 100) / 100,
      totalIncVat: Math.round((exVat + vatAmt) * 100) / 100,
    };

    let html: string;
    if (body.content) {
      html = generateDocument(body.content, offer);
    } else {
      html = generateFallbackDocument(offer);
    }

    return NextResponse.json({ html });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : 'Preview error' },
      { status: 500 },
    );
  }
}
