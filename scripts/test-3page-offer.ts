/**
 * Test script: creates a 3-page template with images and verifies
 * the generated HTML doesn't have page overlap issues.
 *
 * Run: npx tsx scripts/test-3page-offer.ts
 */

import { writeFileSync } from 'fs';
import { generateDocument } from '../src/modules/supporting/offers/application/document-generator';
import type { Offer, OfferLineItem } from '../src/modules/supporting/offers/domain/offer.entity';

// ── Sample images as SVG data URIs (no network needed) ───────────────────────

const COVER_BG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="816" height="320">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3a5f;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="816" height="320" fill="url(#g)"/>
  <text x="408" y="150" font-family="sans-serif" font-size="36" font-weight="bold"
        fill="white" text-anchor="middle">Kollegan AB</text>
  <text x="408" y="200" font-family="sans-serif" font-size="16"
        fill="rgba(255,255,255,0.8)" text-anchor="middle">Professionella tjänster &amp; lösningar</text>
</svg>`)}`;

const DIVIDER_IMG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="816" height="8">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1"/>
      <stop offset="50%" style="stop-color:#7c3aed;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="816" height="8" fill="url(#g)" rx="4"/>
</svg>`)}`;

const TEAM_PHOTO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260">
  <rect width="400" height="260" fill="#f1f5f9" rx="8"/>
  <rect x="20" y="20" width="360" height="220" fill="#e2e8f0" rx="6"/>
  <circle cx="130" cy="110" r="40" fill="#94a3b8"/>
  <circle cx="200" cy="110" r="40" fill="#64748b"/>
  <circle cx="270" cy="110" r="40" fill="#475569"/>
  <text x="200" y="175" font-family="sans-serif" font-size="13" fill="#64748b" text-anchor="middle">Vårt team</text>
  <text x="200" y="195" font-family="sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">3 dedikerade konsulter</text>
</svg>`)}`;

const SIGNATURE_BANNER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="816" height="80">
  <rect width="816" height="80" fill="#0f172a"/>
  <text x="40" y="48" font-family="sans-serif" font-size="14" fill="rgba(255,255,255,0.9)"
        font-weight="600">Kollegan AB &nbsp;·&nbsp; Org.nr 556XXX-XXXX &nbsp;·&nbsp; kontakt@kollegan.se</text>
</svg>`)}`;

// ── 3-page TipTap v3 template content ────────────────────────────────────────

const template = {
  _v: 3,

  defaultHeader: { type: 'doc', content: [] },
  defaultFooter: { type: 'doc', content: [] },

  pages: [
    // ── Page 1: Cover page ───────────────────────────────────────────────────
    {
      header: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
      footer: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
      body: {
        type: 'doc',
        content: [
          // Full-width cover banner (absolute background)
          {
            type: 'image',
            attrs: {
              src: COVER_BG,
              alt: 'Omslag',
              position: 'free',
              posX: 0, posY: 0,
              width: 816, height: 320,
              zIndex: -1,
              wrapText: 'none',
            },
          },
          // Spacer paragraph so text flows below the image
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          // Offer heading below banner
          {
            type: 'heading', attrs: { level: 1 },
            content: [{ type: 'variable', attrs: { key: 'offerTitle', label: 'Offerttitel' } }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Offert #' },
              { type: 'variable', attrs: { key: 'offerNumber', label: 'Offert-nr' } },
              { type: 'text', text: ' · Giltig till ' },
              { type: 'variable', attrs: { key: 'validUntil', label: 'Giltig till' } },
            ],
          },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Till: ', marks: [{ type: 'bold' }] },
              { type: 'variable', attrs: { key: 'recipientName', label: 'Mottagare' } },
              { type: 'text', text: ', ' },
              { type: 'variable', attrs: { key: 'recipientCompany', label: 'Företag' } },
            ],
          },
          // Gradient divider line
          {
            type: 'image',
            attrs: {
              src: DIVIDER_IMG,
              alt: 'Avdelare',
              position: 'inline',
              align: 'left',
              width: 720,
            },
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Vi är glada att presentera denna offert för er. Nedan hittar ni en detaljerad beskrivning av tjänsterna vi erbjuder, priser, samt villkor för samarbetet.' },
            ],
          },
        ],
      },
    },

    // ── Page 2: Services & pricing ──────────────────────────────────────────
    {
      header: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
      footer: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
      body: {
        type: 'doc',
        content: [
          {
            type: 'heading', attrs: { level: 2 },
            content: [{ type: 'text', text: 'Tjänster och priser' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Nedan presenteras de tjänster vi föreslår för att uppfylla era behov:' }],
          },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          // Line items variable
          { type: 'variable', attrs: { key: 'lineItems', label: 'Rader' } },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          // Team photo — inline, centered
          {
            type: 'image',
            attrs: {
              src: TEAM_PHOTO,
              alt: 'Vårt team',
              position: 'inline',
              align: 'center',
              width: 400,
            },
          },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          {
            type: 'heading', attrs: { level: 3 },
            content: [{ type: 'text', text: 'Anteckningar' }],
          },
          { type: 'variable', attrs: { key: 'notes', label: 'Anteckningar' } },
        ],
      },
    },

    // ── Page 3: Signature page ───────────────────────────────────────────────
    {
      header: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
      footer: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
      body: {
        type: 'doc',
        content: [
          {
            type: 'heading', attrs: { level: 2 },
            content: [{ type: 'text', text: 'Godkännande' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Genom att underteckna detta dokument bekräftar ni att ni godkänner offerten och villkoren i den. Offerten är giltig till och med ' },
              { type: 'variable', attrs: { key: 'validUntil', label: 'Giltig till' } },
              { type: 'text', text: '.' },
            ],
          },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          // Signature block
          { type: 'signatureBlock', attrs: { fieldType: 'name', label: 'Fullständigt namn' } },
          { type: 'signatureBlock', attrs: { fieldType: 'signature', label: 'Signatur' } },
          { type: 'signatureBlock', attrs: { fieldType: 'date', label: 'Datum' } },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          // Footer banner — positioned near the bottom of the A4 page (posY ~940)
          {
            type: 'image',
            attrs: {
              src: SIGNATURE_BANNER,
              alt: 'Sidfot',
              position: 'free',
              posX: 0, posY: 940,
              width: 816, height: 80,
              zIndex: 0,
              wrapText: 'none',
            },
          },
        ],
      },
    },
  ],
};

// ── Mock offer ────────────────────────────────────────────────────────────────

const lineItems: OfferLineItem[] = [
  {
    id: '1', offerId: 'test', description: 'Konsulttjänst — systemutveckling',
    quantity: 80, unitPrice: 1200, vatRate: 0.25, discount: 0, sortOrder: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2', offerId: 'test', description: 'Projektledning och koordinering',
    quantity: 20, unitPrice: 1400, vatRate: 0.25, discount: 10, sortOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3', offerId: 'test', description: 'Testning och kvalitetssäkring',
    quantity: 16, unitPrice: 900, vatRate: 0.25, discount: 0, sortOrder: 2,
    createdAt: new Date().toISOString(),
  },
];

const exVat = lineItems.reduce((acc, item) => {
  return acc + item.quantity * item.unitPrice * (1 - (item.discount ?? 0) / 100);
}, 0);

const mockOffer: Offer = {
  id: 'test-offer-001',
  organizationId: 'dev-org-01',
  createdBy: 'dev-user-01',
  title: 'Systemutveckling & konsulttjänster 2026',
  recipientName: 'Anna Lindström',
  recipientEmail: 'anna@techbolag.se',
  recipientCompany: 'TechBolag AB',
  notes: 'Priset är baserat på uppskattad tidsåtgång. Eventuella tillägg debiteras separat efter godkännande.',
  status: 'sent',
  offerNumber: 42,
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  validityDays: 30,
  totalExVat: exVat,
  totalIncVat: exVat * 1.25,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  publicToken: 'test-token-abc',
  publicTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  lineItems,
  reminderCount: 0,
  signatureMethod: 'draw',
};

// ── Generate and save ─────────────────────────────────────────────────────────

const html = generateDocument(JSON.stringify(template), mockOffer);
writeFileSync('/tmp/test-offer-output.html', html, 'utf-8');

console.log('✅ Generated HTML saved to /tmp/test-offer-output.html');
console.log(`   File size: ${(html.length / 1024).toFixed(1)} KB`);

// ── Verify structure ──────────────────────────────────────────────────────────

const pageBlockCount = (html.match(/class="page-block"/g) ?? []).length;
const pageSepCount   = (html.match(/class="page-separator"/g) ?? []).length;
const imgCount       = (html.match(/<img /g) ?? []).length;
const absImgCount    = (html.match(/position:absolute/g) ?? []).length;
const minHeightMatch = html.match(/min-height:\s*1056px/);

console.log('\n── Structure check ──');
console.log(`   page-block divs:       ${pageBlockCount} (expected 3)`);
console.log(`   page-separator hrs:    ${pageSepCount} (expected 2)`);
console.log(`   total <img> tags:       ${imgCount}`);
console.log(`   absolute images:        ${absImgCount}`);
console.log(`   min-height 1056px CSS:  ${minHeightMatch ? '✅ present' : '❌ MISSING'}`);

// Verify no absolute image has posY > 1056
const absMatches = [...html.matchAll(/position:absolute;left:(\d+)px;top:(\d+)px/g)];
let hasOverflow = false;
for (const m of absMatches) {
  const top = parseInt(m[2] ?? '0', 10);
  if (top > 1056) {
    console.log(`   ⚠️  Image at top:${top}px exceeds 1056px — will be clipped`);
    hasOverflow = true;
  }
}
if (!hasOverflow) {
  console.log('   absolute image positions: ✅ all within 1056px');
}

console.log('\nDone. Open /tmp/test-offer-output.html in a browser to verify visually.');
