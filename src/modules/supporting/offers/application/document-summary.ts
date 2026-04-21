import type { Offer } from '../domain/offer.entity';
import { summarizePersistedOfferPricing } from '../domain/pricing';
import { escapeHtml, fmtSEKPrecise } from './document-formatting';

export function renderPublicOfferSummaryHtml(offer: Offer): string {
  const summary = summarizePersistedOfferPricing(offer);
  const subtotalBeforeDiscount = summary.discountAmount > 0
    ? offer.totalExVat + summary.discountAmount
    : offer.totalExVat;
  const boxClass = 'offer-summary offer-summary--below';
  const totalSubcopy = summary.displayModeLabel;
  const discountRow = summary.discountAmount > 0 ? `
    <div class="offer-summary__row offer-summary__row--discount">
      <span>Rabatt</span>
      <strong>- ${fmtSEKPrecise(summary.discountAmount).replace(/^-+\s*/, '')}</strong>
    </div>` : '';
  const vatRow = summary.hasVat ? `
    <div class="offer-summary__row offer-summary__row--vat">
      <span>${summary.vatLabel}</span>
      <strong>${fmtSEKPrecise(summary.vatAmount)}</strong>
    </div>` : '';

  return `
    <aside class="${boxClass}">
      <div class="offer-summary__row offer-summary__row--subtotal">
        <span>${summary.subtotalLabel}</span>
        <strong>${fmtSEKPrecise(subtotalBeforeDiscount)}</strong>
      </div>
      ${discountRow}
      ${vatRow}
      <div class="offer-summary__row offer-summary__row--total">
        <span class="offer-summary__total-copy">
          <span class="offer-summary__total-label">Totalsumma</span>
          <span class="offer-summary__total-subcopy">${escapeHtml(totalSubcopy)}</span>
        </span>
        <strong>${fmtSEKPrecise(summary.totalAmount)}</strong>
      </div>
    </aside>`;
}
