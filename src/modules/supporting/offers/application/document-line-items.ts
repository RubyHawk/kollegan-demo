import type { Offer, OfferLineItem } from '../domain/offer.entity';
import {
  formatVatRate,
  getDisplayLineTotal,
  getDisplayUnitPrice,
  normalizeVatRate,
  summarizeOfferPricing,
} from '../domain/pricing';
import {
  escapeHtml,
  fmtSEKPrecise,
  formatOfferLineItemQuantityHtml,
  getOfferLineItemDescription,
} from './document-formatting';

export function buildStructuredLineItems(items: OfferLineItem[], mode: Offer['priceDisplayMode']): string {
  const pricing = summarizeOfferPricing(items, mode);
  const showVatColumn = pricing.hasVat;
  const showDiscountColumn = items.some((item) => (item.discount ?? 0) > 0);
  const gridTemplate = [
    'minmax(0, 1fr)',
    '64px',
    '104px',
    ...(showDiscountColumn ? ['64px'] : []),
    ...(showVatColumn ? ['64px'] : []),
    '132px',
  ].join(' ');

  const headerCells = [
    '<span>Produkt eller tj\u00e4nst</span>',
    '<span>Antal</span>',
    '<span>&Agrave;-pris</span>',
    ...(showDiscountColumn ? ['<span>Rabatt</span>'] : []),
    ...(showVatColumn ? ['<span>Moms</span>'] : []),
    '<span>Belopp</span>',
  ].join('');

  const desktopRows = items.map((item) => {
    const displayUnitPrice = getDisplayUnitPrice(item, mode);
    const displayLineTotal = getDisplayLineTotal(item, mode);
    const description = getOfferLineItemDescription(item.description);
    return `
      <article class="offer-item-row" style="--offer-columns:${gridTemplate}">
        <div class="offer-item-row__product">
          <div class="offer-item-row__title">${escapeHtml(description.title)}</div>
          ${description.detail ? `<div class="offer-item-row__detail">${escapeHtml(description.detail)}</div>` : ''}
        </div>
        <div class="offer-item-row__value">${formatOfferLineItemQuantityHtml(item)}</div>
        <div class="offer-item-row__value">${fmtSEKPrecise(displayUnitPrice)}</div>
        ${showDiscountColumn ? `<div class="offer-item-row__value">${item.discount ? `${item.discount}%` : '—'}</div>` : ''}
        ${showVatColumn ? `<div class="offer-item-row__value">${formatVatRate(item.vatRate)}</div>` : ''}
        <div class="offer-item-row__value offer-item-row__value--strong">${fmtSEKPrecise(displayLineTotal)}</div>
      </article>`;
  }).join('');

  const mobileCards = items.map((item) => {
    const displayUnitPrice = getDisplayUnitPrice(item, mode);
    const displayLineTotal = getDisplayLineTotal(item, mode);
    const description = getOfferLineItemDescription(item.description);
    const mobileVatLabel = normalizeVatRate(item.vatRate) > 0
      ? `${Math.round(normalizeVatRate(item.vatRate) * 100)}%`
      : 'Momsfri';
    const mobileMetrics = [
      { label: 'Antal', value: formatOfferLineItemQuantityHtml(item) },
      { label: '&Agrave;-pris', value: fmtSEKPrecise(displayUnitPrice) },
      ...(showDiscountColumn ? [{ label: 'Rabatt', value: item.discount ? `${item.discount}%` : '—' }] : []),
      ...(showVatColumn ? [{ label: 'Moms', value: mobileVatLabel }] : []),
    ];
    const mobileMetricCount = mobileMetrics.length;
    const mobileRows = [
      ...mobileMetrics.map((metric, index) => {
        const metricClasses = [
          'offer-item-card__metric',
          mobileMetricCount % 2 === 1 && index === mobileMetricCount - 1 ? 'offer-item-card__metric--full' : '',
        ].filter(Boolean).join(' ');
        return `<div class="${metricClasses}"><dt>${metric.label}</dt><dd>${metric.value}</dd></div>`;
      }),
      `<div class="offer-item-card__metric offer-item-card__metric--total"><dt>Belopp</dt><dd>${fmtSEKPrecise(displayLineTotal)}</dd></div>`,
    ].join('');

    return `
      <article class="offer-item-card">
        <div class="offer-item-card__top">
          <div class="offer-item-card__eyebrow">Produkt eller tj\u00e4nst</div>
          <div class="offer-item-card__title">${escapeHtml(description.title)}</div>
          ${description.detail ? `<div class="offer-item-card__detail">${escapeHtml(description.detail)}</div>` : ''}
        </div>
        <dl class="offer-item-card__grid">
          ${mobileRows}
        </dl>
      </article>`;
  }).join('');

  return `
    <div class="offer-items">
      <div class="offer-items__table" style="display:block;">
        <div class="offer-items__head" style="--offer-columns:${gridTemplate}">
          ${headerCells}
        </div>
        <div class="offer-items__body">
          ${desktopRows}
        </div>
      </div>
      <div class="offer-items__cards" style="display:none;">
        ${mobileCards}
      </div>
    </div>`;
}
