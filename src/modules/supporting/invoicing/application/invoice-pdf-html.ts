/**
 * Invoice PDF document — HTML + Swedish copy builder.
 *
 * Self-contained inside invoicing (no offers import). Produces a full A4 invoice
 * document: seller (name / orgNumber / VAT number / address / logo), buyer,
 * invoice number, issue/due dates, payment reference, a line-item table with
 * per-line VAT, a VAT breakdown per rate, and ex/VAT/inc totals. The currency is
 * rendered with the Swedish locale (kr for SEK/NOK/DKK, € for EUR).
 */

import { escapeHtml } from '@platform/security/sanitize';
import { INVOICE_PDF_PRINT_STYLES } from './invoice-pdf-print-styles';
import {
  amountToPay,
  buildVatBreakdown,
  formatMoney,
  formatPercent,
  formatQuantity,
  rotRutDeductionLabel,
  type InvoicePdfModel,
  type InvoicePdfLine,
} from './invoice-pdf-format';

export type { InvoicePdfModel, InvoicePdfLine };

const SWEDISH_MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
] as const;

/** 'YYYY-MM-DD' or ISO → '6 juni 2026'. Falls back to the raw value if unparseable. */
function formatSwedishDate(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getUTCDate()} ${SWEDISH_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function sellerAddressLines(m: InvoicePdfModel): string {
  const lines: string[] = [];
  if (m.seller.addressLine1) lines.push(escapeHtml(m.seller.addressLine1));
  if (m.seller.addressLine2) lines.push(escapeHtml(m.seller.addressLine2));
  const cityLine = [m.seller.postalCode, m.seller.city].filter(Boolean).join(' ').trim();
  if (cityLine) lines.push(escapeHtml(cityLine));
  if (m.seller.country) lines.push(escapeHtml(m.seller.country));
  if (m.seller.orgNumber) lines.push(`Org.nr: ${escapeHtml(m.seller.orgNumber)}`);
  if (m.seller.vatNumber) lines.push(`Momsreg.nr: ${escapeHtml(m.seller.vatNumber)}`);
  return lines.map((l) => `<p class="inv-seller__line">${l}</p>`).join('');
}

function sellerBlock(m: InvoicePdfModel): string {
  const logo = m.seller.logoUrl
    ? `<img class="inv-logo" src="${escapeHtml(m.seller.logoUrl)}" alt="" />`
    : '';
  return `
    <div class="inv-seller">
      ${logo}
      <div>
        <h2 class="inv-seller__name">${escapeHtml(m.seller.name)}</h2>
        ${sellerAddressLines(m)}
      </div>
    </div>`;
}

function buyerBlock(m: InvoicePdfModel): string {
  const lines: string[] = [];
  if (m.buyer.company) lines.push(`<p class="inv-meta__value"><strong>${escapeHtml(m.buyer.company)}</strong></p>`);
  if (m.buyer.name) lines.push(`<p class="inv-meta__value">${escapeHtml(m.buyer.name)}</p>`);
  if (m.buyer.email) lines.push(`<p class="inv-meta__value">${escapeHtml(m.buyer.email)}</p>`);
  // When a ROT/RUT deduction applies, the buyer's personnummer and property/BRF
  // are required claim metadata and are surfaced on the invoice itself.
  if (m.rotRut) {
    if (m.rotRut.buyerPersonalNumber) {
      lines.push(`<p class="inv-meta__value" style="margin-top:6px;color:#6b7c97;font-size:10.5px;">Personnummer: ${escapeHtml(m.rotRut.buyerPersonalNumber)}</p>`);
    }
    if (m.rotRut.propertyDesignation) {
      lines.push(`<p class="inv-meta__value" style="color:#6b7c97;font-size:10.5px;">Fastighetsbeteckning: ${escapeHtml(m.rotRut.propertyDesignation)}</p>`);
    } else if (m.rotRut.housingSocietyOrgNumber) {
      lines.push(`<p class="inv-meta__value" style="color:#6b7c97;font-size:10.5px;">BRF org.nr: ${escapeHtml(m.rotRut.housingSocietyOrgNumber)}</p>`);
    }
  }
  if (lines.length === 0) lines.push('<p class="inv-meta__value">&mdash;</p>');
  return `
    <div class="inv-meta__box">
      <p class="inv-meta__label">Fakturamottagare</p>
      ${lines.join('')}
    </div>`;
}

function metaSummaryBlock(m: InvoicePdfModel): string {
  const heading = m.documentType === 'credit_note' ? 'Kreditfaktura' : 'Faktura';
  const reference = m.invoiceNumber != null ? `${heading.toLowerCase()} ${m.invoiceNumber}` : heading.toLowerCase();
  return `
    <div class="inv-meta__box">
      <p class="inv-meta__label">${heading}snummer</p>
      <p class="inv-meta__value"><strong>${m.invoiceNumber != null ? escapeHtml(String(m.invoiceNumber)) : '&mdash;'}</strong></p>
      <p class="inv-meta__value" style="margin-top:8px;color:#6b7c97;font-size:10.5px;">Avser ${escapeHtml(reference)}</p>
    </div>`;
}

function datesBlock(m: InvoicePdfModel): string {
  return `
    <div class="inv-dates">
      <div class="inv-dates__cell">
        <p class="inv-dates__label">Fakturadatum</p>
        <p class="inv-dates__value">${escapeHtml(formatSwedishDate(m.issueDate))}</p>
      </div>
      <div class="inv-dates__cell">
        <p class="inv-dates__label">Förfallodatum</p>
        <p class="inv-dates__value inv-dates__value--due">${escapeHtml(formatSwedishDate(m.dueDate))}</p>
      </div>
      <div class="inv-dates__cell">
        <p class="inv-dates__label">Valuta</p>
        <p class="inv-dates__value">${escapeHtml(m.currency)}</p>
      </div>
    </div>`;
}

function lineRow(line: InvoicePdfLine, currency: string): string {
  const qty = formatQuantity(line.quantity);
  const unit = line.unit ? ` ${escapeHtml(line.unit)}` : '';
  const discount = line.discount && line.discount > 0
    ? `<br/><span style="font-size:10px;color:#8392aa;">Rabatt ${formatPercent(line.discount / 100)}</span>`
    : '';
  return `
    <tr>
      <td class="inv-col-desc">${escapeHtml(line.description)}${discount}</td>
      <td>${qty}${unit}</td>
      <td>${formatMoney(line.unitPrice, currency)}</td>
      <td>${formatPercent(line.vatRate)}</td>
      <td>${formatMoney(line.lineExVat, currency)}</td>
      <td>${formatMoney(line.lineVat, currency)}</td>
    </tr>`;
}

function itemsTable(m: InvoicePdfModel): string {
  const rows = m.lines.map((l) => lineRow(l, m.currency)).join('');
  return `
    <table class="inv-items">
      <thead>
        <tr>
          <th class="inv-col-desc">Beskrivning</th>
          <th>Antal</th>
          <th>À-pris</th>
          <th>Moms %</th>
          <th>Belopp exkl. moms</th>
          <th>Moms</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td class="inv-col-desc" colspan="6">Inga rader</td></tr>'}
      </tbody>
    </table>`;
}

function vatBreakdownTable(m: InvoicePdfModel): string {
  const groups = buildVatBreakdown(m.lines);
  if (groups.length === 0) return '';
  const rows = groups.map((g) => `
    <tr>
      <td class="inv-vat-rate-col">${formatPercent(g.rate)}</td>
      <td>${formatMoney(g.base, m.currency)}</td>
      <td>${formatMoney(g.vat, m.currency)}</td>
    </tr>`).join('');
  return `
    <table class="inv-vat-breakdown">
      <caption>Momsspecifikation</caption>
      <thead>
        <tr>
          <th class="inv-vat-rate-col">Momssats</th>
          <th>Underlag</th>
          <th>Moms</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/**
 * The ROT/RUT rows in the totals summary: the inc-VAT subtotal, the eligible
 * labour basis, and the deduction shown as a NEGATIVE line ("ROT-avdrag" /
 * "RUT-avdrag −{amount}"). Empty when no deduction applies.
 */
function rotRutSummaryRows(m: InvoicePdfModel): string {
  if (!m.rotRut) return '';
  const label = rotRutDeductionLabel(m.rotRut.type);
  return `
        <div class="inv-summary__row"><span>Summa inkl. moms</span><strong>${formatMoney(m.totalIncVat, m.currency)}</strong></div>
        <div class="inv-summary__row"><span>Arbetskostnad inkl. moms (underlag)</span><strong>${formatMoney(m.rotRut.laborAmount, m.currency)}</strong></div>
        <div class="inv-summary__row"><span>${escapeHtml(label)}</span><strong>&minus;${formatMoney(m.rotRut.deductionAmount, m.currency)}</strong></div>`;
}

function totalsBlock(m: InvoicePdfModel): string {
  const toPay = amountToPay(m.totalIncVat, m.rotRut);
  return `
    <div class="inv-totals-wrap">
      <div class="inv-totals">
        ${vatBreakdownTable(m)}
        <div class="inv-summary">
          <div class="inv-summary__row"><span>Summa exkl. moms</span><strong>${formatMoney(m.totalExVat, m.currency)}</strong></div>
          <div class="inv-summary__row"><span>Moms</span><strong>${formatMoney(m.totalVat, m.currency)}</strong></div>
          ${rotRutSummaryRows(m)}
          <div class="inv-summary__row inv-summary__row--grand"><span>Att betala</span><strong>${formatMoney(toPay, m.currency)}</strong></div>
        </div>
      </div>
    </div>`;
}

function paymentBlock(m: InvoicePdfModel): string {
  const ref = m.paymentReference
    ? `<p class="inv-payment__row">Betalningsreferens: <strong>${escapeHtml(m.paymentReference)}</strong></p>`
    : '';
  const due = `<p class="inv-payment__row">Förfallodatum: <strong>${escapeHtml(formatSwedishDate(m.dueDate))}</strong></p>`;
  const amount = `<p class="inv-payment__row">Att betala: <strong>${formatMoney(amountToPay(m.totalIncVat, m.rotRut), m.currency)}</strong></p>`;
  return `
    <div class="inv-payment">
      <p class="inv-payment__label">Betalningsinformation</p>
      ${amount}
      ${due}
      ${ref}
    </div>`;
}

/** Builds the complete standalone invoice HTML document (head + body). */
export function buildInvoicePdfHtml(m: InvoicePdfModel): string {
  const isCredit = m.documentType === 'credit_note';
  const heading = isCredit ? 'Kreditfaktura' : 'Faktura';
  const titleClass = isCredit ? 'inv-title inv-title--credit' : 'inv-title';
  const numberLabel = m.invoiceNumber != null
    ? `Nr ${escapeHtml(String(m.invoiceNumber))}`
    : 'Utkast';
  const notes = m.notes
    ? `<div class="inv-notes">${escapeHtml(m.notes)}</div>`
    : '';

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${heading} ${m.invoiceNumber != null ? escapeHtml(String(m.invoiceNumber)) : ''}</title>
${INVOICE_PDF_PRINT_STYLES}
</head>
<body>
  <div class="inv-page">
    <div class="inv-header">
      ${sellerBlock(m)}
      <div class="inv-title-block">
        <h1 class="${titleClass}">${heading}</h1>
        <p class="inv-number">${numberLabel}</p>
      </div>
    </div>

    <div class="inv-meta">
      ${buyerBlock(m)}
      ${metaSummaryBlock(m)}
    </div>

    ${datesBlock(m)}
    ${itemsTable(m)}
    ${totalsBlock(m)}
    ${paymentBlock(m)}
    ${notes}

    <div class="inv-footer">
      ${escapeHtml(m.seller.name)}${m.seller.orgNumber ? ` &middot; Org.nr ${escapeHtml(m.seller.orgNumber)}` : ''}${m.seller.vatNumber ? ` &middot; ${escapeHtml(m.seller.vatNumber)}` : ''}
    </div>
  </div>
</body>
</html>`;
}
