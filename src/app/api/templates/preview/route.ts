import { NextResponse } from 'next/server';
import { generateDocument, generateFallbackDocument } from '@modules/supporting/offers/application/document-generator';
import type { Offer } from '@modules/supporting/offers/domain/offer.entity';
import { resolveOfferBranding } from '@modules/supporting/offers/application/company-branding';

const PREVIEW_SENTINELS = {
  title: '__PREVIEW_TITLE__',
  recipientName: '__PREVIEW_RECIPIENT_NAME__',
  recipientEmail: '__PREVIEW_RECIPIENT_EMAIL__',
  recipientCompany: '__PREVIEW_RECIPIENT_COMPANY__',
} as const;

const PREVIEW_GHOST_CSS = `<style data-preview-ghosts>
  .preview-ghost {
    display:inline-flex;align-items:center;min-height:1.05em;border-radius:999px;
    background:linear-gradient(90deg, rgba(148,163,184,0.14), rgba(148,163,184,0.22), rgba(148,163,184,0.14));
    background-size:220% 100%;color:rgba(71,85,105,0.72);font-weight:500;letter-spacing:0.01em;
    animation:preview-ghost-shimmer 2.1s ease-in-out infinite;
    box-decoration-break:clone;-webkit-box-decoration-break:clone;
  }
  .preview-ghost--text,.preview-ghost--email{padding:0.16em 0.58em;}
  .preview-ghost--title{display:inline-flex;min-width:11ch;padding:0.08em 0.48em;border-radius:14px;}
  @keyframes preview-ghost-shimmer {0%{background-position:200% 0;}100%{background-position:-20% 0;}}
</style>`;

const SAMPLE_OFFER: Offer = {
  id: 'offertnr0-preview',
  organizationId: 'preview-org',
  title: PREVIEW_SENTINELS.title,
  status: 'draft',
  offerNumber: undefined,
  priceDisplayMode: 'exclusive',
  recipientName: PREVIEW_SENTINELS.recipientName,
  recipientEmail: PREVIEW_SENTINELS.recipientEmail,
  recipientCompany: PREVIEW_SENTINELS.recipientCompany,
  notes: '',
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  totalExVat: 0,
  totalIncVat: 0,
  createdAt: new Date().toISOString(),
  publicToken: 'preview-token',
  reminderCount: 0,
  validityDays: 30,
  createdBy: 'preview',
  signatureMethod: 'canvas',
  lineItems: [],
};

interface PartialOfferInput {
  title?: string;
  priceDisplayMode?: 'exclusive' | 'inclusive';
  recipientName?: string;
  recipientEmail?: string;
  recipientCompany?: string;
  notes?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    discount: number;
  }>;
}

function decoratePreviewHtml(html: string): string {
  const withCss = html.includes('data-preview-ghosts')
    ? html
    : html.includes('</head>')
      ? html.replace('</head>', `${PREVIEW_GHOST_CSS}</head>`)
      : `${PREVIEW_GHOST_CSS}${html}`;

  return withCss
    .replaceAll(
      PREVIEW_SENTINELS.title,
      '<span class="preview-ghost preview-ghost--title">Offerttitel</span>',
    )
    .replaceAll(
      PREVIEW_SENTINELS.recipientName,
      '<span class="preview-ghost preview-ghost--text">Kundnamn</span>',
    )
    .replaceAll(
      PREVIEW_SENTINELS.recipientEmail,
      '<span class="preview-ghost preview-ghost--email">kund@epost.se</span>',
    )
    .replaceAll(
      PREVIEW_SENTINELS.recipientCompany,
      '<span class="preview-ghost preview-ghost--text">Kundföretag</span>',
    );
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      content?: string;
      branding?: {
        name?: string;
        website?: string;
        logoUrl?: string;
        senderEmail?: string;
        senderName?: string;
        emailHeaderConfig?: string;
      };
      offer?: PartialOfferInput;
    };

    const partialItems = body.offer?.lineItems;
    const lineItems = partialItems && partialItems.length > 0
      ? partialItems.map((li, i) => ({ id: `li-${i}`, ...li }))
      : [];

    let exVat = 0;
    let vatAmount = 0;

    for (const li of lineItems) {
      const discountMultiplier = 1 - ((li.discount ?? 0) / 100);
      const line = li.quantity * li.unitPrice * discountMultiplier;
      exVat += line;
      vatAmount += line * li.vatRate;
    }

    const offer: Offer = {
      ...SAMPLE_OFFER,
      ...(body.offer?.title ? { title: body.offer.title } : {}),
      ...(body.offer?.priceDisplayMode ? { priceDisplayMode: body.offer.priceDisplayMode } : {}),
      ...(body.offer?.recipientName ? { recipientName: body.offer.recipientName } : {}),
      ...(body.offer?.recipientEmail ? { recipientEmail: body.offer.recipientEmail } : {}),
      ...(body.offer?.recipientCompany != null ? { recipientCompany: body.offer.recipientCompany } : {}),
      ...(body.offer?.notes != null ? { notes: body.offer.notes } : {}),
      lineItems,
      totalExVat: Math.round(exVat * 100) / 100,
      totalIncVat: Math.round((exVat + vatAmount) * 100) / 100,
    };

    const company = body.branding ? {
      id: 'preview-company',
      organizationId: offer.organizationId,
      name: body.branding.name ?? 'Offert',
      website: body.branding.website,
      logoUrl: body.branding.logoUrl,
      senderEmail: body.branding.senderEmail,
      senderName: body.branding.senderName,
      emailHeaderConfig: body.branding.emailHeaderConfig,
      createdBy: 'preview',
      createdAt: offer.createdAt,
      updatedAt: offer.createdAt,
    } : null;
    const branding = resolveOfferBranding(company, null);

    const html = body.content
      ? generateDocument(body.content, offer, branding)
      : generateFallbackDocument(offer, branding);

    return NextResponse.json({ html: decoratePreviewHtml(html) });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : 'Preview error' },
      { status: 500 },
    );
  }
}
