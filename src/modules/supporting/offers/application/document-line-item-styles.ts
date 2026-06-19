import { upsertStyleTag } from './document-styles';

/** Style injection for structured offer line items. */
export function injectStructuredLineItemStyles(html: string): string {
  if (!html.includes('class="offer-items"')) return html;

  const lineItemStyles = `
<style data-offer-line-item-patch>
  .offer-items { display: grid; gap: 18px; }
  .offer-items__table {
    display: block;
    border: 1px solid #d4e2f1;
    border-radius: 28px;
    background: #ffffff;
    overflow: hidden;
    box-shadow: 8px 8px 0 #e8eff8;
  }
  .offer-items__head,
  .offer-item-row {
    display: grid;
    grid-template-columns: var(--offer-columns, minmax(0, 2.1fr) 92px 136px 86px 86px 152px);
    align-items: start;
  }
  .offer-items__head {
    gap: 0;
    padding: 18px 22px 12px;
    background: #ffffff;
    color: #1f335b;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: none;
  }
  .offer-items__head span {
    display: flex;
    min-height: 46px;
    align-items: center;
    justify-content: flex-end;
    padding: 0 14px;
    border-left: 1px solid #dbe5f1;
  }
  .offer-items__head span:first-child {
    justify-content: flex-start;
    padding-left: 0;
    border-left: none;
  }
  .offer-items__body {
    border-top: 1px solid #dbe5f1;
  }
  .offer-item-row {
    gap: 0;
    padding: 24px 22px 26px;
    border-bottom: 0;
  }
  .offer-item-row:last-child { border-bottom: none; }
  .offer-item-row__product {
    display: grid;
    gap: 12px;
    min-width: 0;
    padding-right: 18px;
  }
  .offer-item-row__title {
    font-size: 18px;
    line-height: 1.22;
    font-weight: 700;
    color: #1f335b;
  }
  .offer-item-row__detail {
    max-width: 30ch;
    font-size: 12px;
    line-height: 1.46;
    color: #3d557b;
  }
  .offer-item-row__value {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 8px 14px 0;
    text-align: right;
    font-size: 15px;
    line-height: 1.2;
    font-weight: 700;
    color: #1f335b;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .offer-item-row__value--strong {
    font-size: 17px;
    font-weight: 800;
  }
  .offer-items__cards { display: none; }
  .offer-item-card { border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
  .offer-item-card__top { display: grid; gap: 6px; padding: 15px 16px 14px; background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%); border-bottom: 1px solid #eef2f7; }
  .offer-item-card__eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
  .offer-item-card__title { font-size: 16px; line-height: 1.3; font-weight: 700; color: #0f172a; }
  .offer-item-card__detail { font-size: 13px; line-height: 1.7; color: #64748b; }
  .offer-item-card__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; margin: 0; }
  .offer-item-card__metric { display: grid; justify-items: center; align-content: center; gap: 7px; min-height: 78px; padding: 14px 12px 13px; text-align: center; background: #ffffff; }
  .offer-item-card__metric dt,
  .offer-item-card__metric dd { margin: 0; }
  .offer-item-card__metric dt { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; }
  .offer-item-card__metric dd { text-align: center; font-size: 14px; font-weight: 700; color: #0f172a; }
  .offer-item-card__metric:not(.offer-item-card__metric--total):not(.offer-item-card__metric--full):nth-child(odd) { border-right: 1px solid #eef2f7; }
  .offer-item-card__metric:nth-child(n + 3):not(.offer-item-card__metric--total) { border-top: 1px solid #eef2f7; }
  .offer-item-card__metric--full { grid-column: 1 / -1; border-top: 1px solid #eef2f7; }
  .offer-item-card__metric--total { grid-column: 1 / -1; gap: 8px; min-height: 0; padding: 16px 14px 15px; border-top: 1px solid #142742; background: linear-gradient(135deg, #13233a 0%, #223b63 100%); }
  .offer-item-card__metric--total dt,
  .offer-item-card__metric--total dd { color: #ffffff; }
  .offer-item-card__metric--total dd { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
  @media (max-width: 640px) {
    .offer-items__table { display: none; }
    .offer-items__cards { display: grid; gap: 16px; }
    .offer-item-card__detail { display: block; }
  }
</style>`;

  return upsertStyleTag(html, 'data-offer-line-item-patch', lineItemStyles);
}
