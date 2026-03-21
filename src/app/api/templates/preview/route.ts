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
  recipientName:    'Anna Lindström',
  recipientEmail:   'anna@lindstrom-hotell.se',
  recipientCompany: 'Lindström Hotell AB',
  notes:            'Exklusive resekostnader. Betalning 30 dagar netto.',
  validUntil:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  totalExVat:       85000,
  totalIncVat:      106250,
  createdAt:        new Date().toISOString(),
  publicToken:      'preview-token',
  lineItems: [
    {
      id:          'li-1',
      description: 'Konsulttjänst — projektledning',
      quantity:    10,
      unitPrice:   5000,
      vatRate:     0.25,
      discount:    0,
    },
    {
      id:          'li-2',
      description: 'Systemintegration',
      quantity:    1,
      unitPrice:   35000,
      vatRate:     0.25,
      discount:    0,
    },
  ],
};

export async function POST(req: Request) {
  try {
    const body = await req.json() as { content?: string };
    let html: string;

    if (body.content) {
      html = generateDocument(body.content, SAMPLE_OFFER);
    } else {
      html = generateFallbackDocument(SAMPLE_OFFER);
    }

    return NextResponse.json({ html });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : 'Preview error' },
      { status: 500 },
    );
  }
}
