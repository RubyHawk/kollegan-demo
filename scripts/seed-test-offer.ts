/**
 * Direct Prisma seed: creates org, user, 3-page template, and offer.
 * Run: npx tsx scripts/seed-test-offer.ts
 */

import { prisma } from '../src/platform/database/prisma';
import { generateDocument } from '../src/modules/supporting/offers/application/document-generator';
import type { Offer } from '../src/modules/supporting/offers/domain/offer.entity';
import { writeFileSync } from 'fs';

// ── SVG images as data URIs ───────────────────────────────────────────────────

const COVER_BG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="816" height="300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1e3a5f"/><stop offset="100%" style="stop-color:#2563eb"/></linearGradient></defs><rect width="816" height="300" fill="url(#g)"/><text x="408" y="130" font-family="sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle">Kollegan AB</text><text x="408" y="185" font-family="sans-serif" font-size="18" fill="rgba(255,255,255,0.85)" text-anchor="middle">Professionella tjänster och lösningar</text><text x="408" y="250" font-family="sans-serif" font-size="13" fill="rgba(255,255,255,0.6)" text-anchor="middle">kollegan.se  ·  kontakt@kollegan.se</text></svg>`)}`;

const DIVIDER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="4"><rect width="720" height="4" fill="#2563eb" rx="2"/></svg>`)}`;

const TEAM_PHOTO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="200"><rect width="500" height="200" fill="#f8fafc" rx="10" stroke="#e2e8f0" stroke-width="1"/><circle cx="167" cy="90" r="40" fill="#bfdbfe"/><circle cx="250" cy="90" r="40" fill="#93c5fd"/><circle cx="333" cy="90" r="40" fill="#60a5fa"/><text x="250" y="160" font-family="sans-serif" font-size="13" fill="#64748b" text-anchor="middle" font-weight="600">3 dedikerade konsulter</text><text x="250" y="180" font-family="sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">redo att leverera resultat</text></svg>`)}`;

const FOOTER_BANNER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="816" height="72"><rect width="816" height="72" fill="#0f172a"/><text x="40" y="44" font-family="sans-serif" font-size="13" fill="rgba(255,255,255,0.9)" font-weight="600">Kollegan AB  ·  Org.nr 556XXX-XXXX  ·  kontakt@kollegan.se  ·  www.kollegan.se</text></svg>`)}`;

// ── 3-page template content ───────────────────────────────────────────────────

const templateContent = {
  _v: 3,
  defaultHeader: { type: 'doc', content: [] },
  defaultFooter: { type: 'doc', content: [] },
  pages: [
    // PAGE 1 — Cover
    {
      header: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
      footer: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
      body: {
        type: 'doc', content: [
          // Full-page cover banner as background (absolute, z-index: -1)
          { type: 'image', attrs: { src: COVER_BG, alt: 'Omslag', position: 'free', posX: 0, posY: 0, width: 816, height: 300, zIndex: -1, wrapText: 'none' } },
          // Spacer rows to push text below the 300px banner
          ...Array(11).fill(null).map(() => ({ type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] })),
          // Offer title below banner
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'variable', attrs: { key: 'offerTitle', label: 'Offerttitel' } }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Offert \u2022 ' }, { type: 'variable', attrs: { key: 'offerNumber', label: 'Nr' } }, { type: 'text', text: ' \u2022 Giltig till ' }, { type: 'variable', attrs: { key: 'validUntil', label: 'Datum' } }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Till: ', marks: [{ type: 'bold' }] }, { type: 'variable', attrs: { key: 'recipientName', label: 'Mottagare' } }, { type: 'text', text: ', ' }, { type: 'variable', attrs: { key: 'recipientCompany', label: 'Företag' } }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          // Gradient divider
          { type: 'image', attrs: { src: DIVIDER, alt: '', position: 'inline', align: 'left', width: 720 } },
          { type: 'paragraph', content: [{ type: 'text', text: 'Vi är glada att presentera denna offert för er. Nedan hittar ni en detaljerad beskrivning av de tjänster vi erbjuder samt villkor för samarbetet.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
        ],
      },
    },

    // PAGE 2 — Services & pricing
    {
      header: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
      footer: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
      body: {
        type: 'doc', content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Tjänster och priser' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Nedan presenteras de tjänster vi föreslår:' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          // Line items table
          { type: 'variable', attrs: { key: 'lineItems', label: 'Rader' } },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          // Team photo — centered inline image (does NOT overflow any page)
          { type: 'image', attrs: { src: TEAM_PHOTO, alt: 'Vårt team', position: 'inline', align: 'center', width: 500 } },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Anteckningar' }] },
          { type: 'variable', attrs: { key: 'notes', label: 'Anteckningar' } },
        ],
      },
    },

    // PAGE 3 — Signature
    {
      header: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
      footer: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
      body: {
        type: 'doc', content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Godkännande och signering' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Genom att underteckna bekräftar ni godkännandet av offerten. Giltig till ' }, { type: 'variable', attrs: { key: 'validUntil', label: 'Datum' } }, { type: 'text', text: '.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'signatureBlock', attrs: { fieldType: 'name', label: 'Fullständigt namn' } },
          { type: 'signatureBlock', attrs: { fieldType: 'signature', label: 'Signatur' } },
          { type: 'signatureBlock', attrs: { fieldType: 'date', label: 'Datum' } },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] },
          // Footer banner — positioned near bottom of A4 page (posY 940 + 72 = 1012 < 1056)
          { type: 'image', attrs: { src: FOOTER_BANNER, alt: 'Sidfot', position: 'free', posX: 0, posY: 940, width: 816, height: 72, zIndex: 0, wrapText: 'none' } },
        ],
      },
    },
  ],
};

async function main() {
  console.log('Setting up test data...');

  // Upsert dev org
  const org = await prisma.organization.upsert({
    where:  { id: 'dev-org-01' },
    update: {},
    create: { id: 'dev-org-01', name: 'Kollegan Demo AB', slug: 'kollegan-demo', plan: 'demo', orgType: 'internal' },
  });
  console.log(`✅ Org: ${org.name} (${org.id})`);

  // Create template
  const template = await prisma.offerTemplate.create({
    data: {
      organizationId: org.id,
      name: '3-sidig offertmall med bilder',
      content: JSON.stringify(templateContent),
      createdBy: 'dev-user-01',
    },
  });
  console.log(`✅ Template: ${template.name} (${template.id})`);

  // Line items
  const lineItems = [
    { description: 'Konsulttjänst — systemutveckling', quantity: 80, unitPrice: 1200, vatRate: 0.25, discount: 0,  sortOrder: 0 },
    { description: 'Projektledning och koordinering',   quantity: 20, unitPrice: 1400, vatRate: 0.25, discount: 10, sortOrder: 1 },
    { description: 'Testning och QA',                   quantity: 16, unitPrice:  900, vatRate: 0.25, discount: 0,  sortOrder: 2 },
  ];
  const exVat = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - i.discount / 100), 0);
  const incVat = exVat * 1.25;

  // Create offer
  const offer = await prisma.offer.create({
    data: {
      organizationId: org.id,
      createdBy: 'dev-user-01',
      title: 'Systemutveckling & konsulttjänster Q2 2026',
      recipientName: 'Anna Lindström',
      recipientEmail: 'anna@techbolag.se',
      recipientCompany: 'TechBolag AB',
      notes: 'Priset är baserat på uppskattad tidsåtgång. Eventuella tillägg debiteras efter godkännande.',
      status: 'draft',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      validityDays: 30,
      totalExVat: exVat,
      totalIncVat: incVat,
      publicToken: `test-token-${Date.now()}`,
      publicTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      templateId: template.id,
      reminderCount: 0,
      signatureMethod: 'draw',
      lineItems: {
        create: lineItems.map(item => ({
          description: item.description,
          quantity:    item.quantity,
          unitPrice:   item.unitPrice,
          vatRate:     item.vatRate,
          discount:    item.discount,
          sortOrder:   item.sortOrder,
        })),
      },
    },
    include: { lineItems: true },
  });
  console.log(`✅ Offer: "${offer.title}" (${offer.id})`);
  console.log(`   Total excl. VAT: ${exVat.toLocaleString('sv-SE')} SEK`);
  console.log(`   Total incl. VAT: ${incVat.toLocaleString('sv-SE')} SEK`);

  // Generate HTML document
  const offerForGen = {
    id: offer.id,
    organizationId: offer.organizationId,
    createdBy: offer.createdBy,
    title: offer.title,
    recipientName: offer.recipientName,
    recipientEmail: offer.recipientEmail,
    recipientCompany: offer.recipientCompany ?? undefined,
    notes: offer.notes ?? undefined,
    status: offer.status,
    offerNumber: offer.offerNumber ?? undefined,
    validUntil: offer.validUntil.toISOString(),
    validityDays: offer.validityDays,
    totalExVat: offer.totalExVat,
    totalIncVat: offer.totalIncVat,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
    publicToken: offer.publicToken ?? '',
    publicTokenExpiresAt: offer.publicTokenExpiresAt?.toISOString(),
    lineItems: offer.lineItems.map(li => ({
      id: li.id, offerId: li.offerId,
      description: li.description, quantity: li.quantity,
      unitPrice: li.unitPrice, vatRate: li.vatRate,
      discount: li.discount ?? 0, sortOrder: li.sortOrder,
      createdAt: new Date().toISOString(),
    })),
    reminderCount: offer.reminderCount,
    signatureMethod: offer.signatureMethod,
  };

  const html = generateDocument(JSON.stringify(templateContent), offerForGen as Offer);

  const outPath = '/tmp/offer-3page-preview.html';
  writeFileSync(outPath, html, 'utf-8');
  console.log(`\n✅ HTML preview saved to: ${outPath}`);
  console.log(`   File size: ${(html.length / 1024).toFixed(1)} KB`);

  // Structural verification
  const pageBlocks   = (html.match(/class="page-block"/g) ?? []).length;
  const separators   = (html.match(/class="page-separator"/g) ?? []).length;
  const absImages    = (html.match(/position:absolute/g) ?? []).length;
  const allImages    = (html.match(/<img /g) ?? []).length;
  const hasMinHeight = /min-height:\s*1056px/.test(html);

  console.log('\n── HTML structure ──');
  console.log(`   page-block count:  ${pageBlocks} ${pageBlocks === 3 ? '✅' : '❌'}`);
  console.log(`   page-separator:    ${separators} ${separators === 2 ? '✅' : '❌'}`);
  console.log(`   images total:      ${allImages}`);
  console.log(`   absolute images:   ${absImages}`);
  console.log(`   min-height 1056px: ${hasMinHeight ? '✅' : '❌'}`);

  // Check absolute image positions are within A4 height
  let ok = true;
  for (const m of html.matchAll(/position:absolute;left:(\d+)px;top:(\d+)px;width:([^;]+)/g)) {
    const top = parseInt(m[2] ?? '0');
    console.log(`   abs img: left=${m[1]}  top=${top}  width=${m[3]}`);
    if (top > 1056) { console.log('   ⚠️  exceeds 1056px!'); ok = false; }
  }
  if (ok) console.log('   image overflow:    ✅ none');

  console.log('\n🎉 Done! Open /tmp/offer-3page-preview.html in a browser to verify.');
  console.log(`   Template ID: ${template.id}`);
  console.log(`   Offer ID:    ${offer.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
