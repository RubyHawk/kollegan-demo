export const FALLBACK_DOCUMENT_STYLES = `    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; background: #fff; margin: 0; padding: 0; }
    img { max-width: 100%; height: auto; }
    .doc-wrapper { max-width: 816px; margin: 40px auto; padding: 48px 56px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
    .offer-section { display: grid; gap: 12px; }
    .offer-section--intro-compact { max-width: 60ch; }
    .offer-section--intro-roomy { max-width: 74ch; }
    .offer-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .offer-table-header h2 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; }
    .offer-items { display: grid; gap: 18px; }
    .offer-items__table { display: block; border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; }
    .offer-items__head, .offer-item-row { display: grid; grid-template-columns: var(--offer-columns); align-items: start; }
    .offer-items__head { gap: 12px; padding: 12px 16px; background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%); border-bottom: 1px solid #dbe4ee; color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .offer-items__head span:first-child { text-align: left; }
    .offer-items__head span:not(:first-child) { text-align: right; }
    .offer-item-row { gap: 12px; padding: 16px; border-bottom: 1px solid #eef2f7; }
    .offer-item-row:last-child { border-bottom: none; }
    .offer-item-row__product { display: grid; gap: 7px; min-width: 0; }
    .offer-item-row__title { font-size: 15px; line-height: 1.45; font-weight: 700; color: #0f172a; }
    .offer-item-row__detail { max-width: none; font-size: 13px; line-height: 1.62; color: #556a89; }
    .offer-item-row__value { text-align: right; font-size: 13px; line-height: 1.45; color: #334155; white-space: nowrap; }
    .offer-item-row__value--strong { font-weight: 700; color: #0f172a; }
    .offer-items__cards { display: none; }
    .offer-item-card { border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
    .offer-item-card__top { display: grid; gap: 6px; padding: 15px 16px 14px; background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%); border-bottom: 1px solid #eef2f7; }
    .offer-item-card__eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
    .offer-item-card__title { font-size: 16px; line-height: 1.3; font-weight: 700; color: #0f172a; }
    .offer-item-card__detail { font-size: 13px; line-height: 1.7; color: #64748b; }
    .offer-item-card__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; margin: 0; }
    .offer-item-card__metric { display: grid; justify-items: center; align-content: center; gap: 7px; min-height: 78px; padding: 14px 12px 13px; text-align: center; background: #ffffff; }
    .offer-item-card__metric dt, .offer-item-card__metric dd { margin: 0; }
    .offer-item-card__metric dt { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; }
    .offer-item-card__metric dd { text-align: center; font-size: 14px; font-weight: 700; color: #0f172a; }
    .offer-item-card__metric:not(.offer-item-card__metric--total):not(.offer-item-card__metric--full):nth-child(odd) { border-right: 1px solid #eef2f7; }
    .offer-item-card__metric:nth-child(n + 3):not(.offer-item-card__metric--total) { border-top: 1px solid #eef2f7; }
    .offer-item-card__metric--full { grid-column: 1 / -1; border-top: 1px solid #eef2f7; }
    .offer-item-card__metric--total { grid-column: 1 / -1; gap: 8px; min-height: 0; padding: 16px 14px 15px; border-top: 1px solid #142742; background: linear-gradient(135deg, #13233a 0%, #223b63 100%); }
    .offer-item-card__metric--total dt, .offer-item-card__metric--total dd { color: #ffffff; }
    .offer-item-card__metric--total dd { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
    .offer-summary { margin-left: auto; width: min(260px, 100%); border: 1px solid #dbe4ee; border-radius: 16px; background: #ffffff; padding: 0; display: grid; gap: 0; overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03); }
    .offer-summary--below { width: min(332px, 100%); margin-top: 16px; margin-left: auto; clear: both; }
    .offer-summary__row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 12px 16px; font-size: 13px; line-height: 1.55; color: #475569; border-bottom: 1px solid #e5ecf3; }
    .offer-summary__row span { font-weight: 600; color: #5b7088; }
    .offer-summary__row strong { white-space: nowrap; color: #10233b; font-weight: 700; }
    .offer-summary__row--subtotal { background: linear-gradient(180deg, #f8fbff 0%, #fdfefe 100%); }
    .offer-summary__row--subtotal span, .offer-summary__row--subtotal strong { color: #10233b; font-weight: 800; }
    .offer-summary__row--discount { background: #fff6f5; }
    .offer-summary__row--discount span, .offer-summary__row--discount strong { color: #b42318; }
    .offer-summary__row--vat span { color: #42576f; }
    .offer-summary__row--total { margin-top: 0; padding: 15px 16px 14px; border-top: 1px solid #142742; border-bottom: none; background: linear-gradient(135deg, #13233a 0%, #223b63 100%); font-size: 15px; color: #f8fafc; }
    .offer-summary__row--total span, .offer-summary__row--total strong { color: #ffffff; }
    .offer-summary__row--total span { font-size: 12px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; }
    .offer-summary__row--total strong { font-size: 22px; letter-spacing: -0.03em; }
    @media (max-width: 640px) {
      .doc-wrapper { margin: 0; padding: 24px 16px; border: none; border-radius: 0; }
      .offer-items__table { display: none; }
      .offer-items__cards { display: grid; gap: 16px; }
      .offer-item-card { border-color: #cfdbe8; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
      .offer-item-card__title { font-size: 17px; line-height: 1.35; }
      .offer-item-card__detail { display: block; }
      .offer-item-card__metric { min-height: 82px; }
      .offer-item-card__metric--total { padding: 16px 12px 15px; }
      .offer-item-card__metric--total dd { font-size: 20px; color: #ffffff; }
      .offer-summary { width: 100%; border-radius: 16px; padding: 0; margin-top: 18px; border-color: #cfdbe8; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); }
      .offer-summary--below { width: 100%; margin-top: 18px; }
      .offer-summary__row { font-size: 14px; padding: 12px; line-height: 1.55; }
      .offer-summary__row--total { font-size: 16px; padding: 14px 12px; }
      .offer-summary__row--total span { font-size: 11px; }
      .offer-summary__row--total strong { font-size: 20px; color: #ffffff; }
      .offer-shell__footer { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 14px; }
      .offer-shell__footer div { justify-items: start; text-align: left; }
      .offer-shell__footer-item--company { grid-column: 1 / -1; grid-template-columns: minmax(0, 1fr); row-gap: 4px; align-items: start; }
      .offer-shell__footer-item--company strong { justify-content: flex-start; }
      .offer-shell__footer-item--company > a, .offer-shell__footer-item--company > span:last-child { overflow-wrap: anywhere; }
      .offer-shell__footer-item--responsible, .offer-shell__footer-item--contact { padding-top: 10px; border-top: 1px solid #e2e8f0; }
    }
    @media print { .doc-wrapper { margin: 0; padding: 0; border: none; } }`;

export const GENERATED_DOCUMENT_SHELL_STYLES = `    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; background: #fff; margin: 0; padding: 0; }
    img { max-width: 100%; height: auto; }
    /* doc-wrapper: 816px container - no horizontal padding so page-block fills full width */
    .doc-wrapper { max-width: 816px; margin: 40px auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    /* page-content: carries the horizontal padding; position:static so absolute images */
    /* inside it still anchor to page-block (the nearest position:relative ancestor)    */
    .page-content { padding: 48px 56px 44px; }
    .page-content--edge-to-edge { padding: 0; }
    /* Keep regular content above absolute background/overlay images on mixed pages. */
    .page-content > *:not(div[style*="position:absolute"]) { position: relative; z-index: 30; }
    .page-block--document { background: #ffffff; }
    .page-block--document::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: var(--doc-bg, none);
      background-repeat: no-repeat;
      background-position: var(--doc-bg-position, center bottom);
      background-size: var(--doc-bg-size, 78% auto);
      opacity: var(--doc-bg-opacity, 0.08);
      pointer-events: none;
    }
    .page-content--document { position: relative; z-index: 1; min-height: 1056px; }
    .offer-shell { min-height: 100%; display: flex; flex-direction: column; gap: 24px; color: #0f172a; }
    .offer-shell__header, .offer-shell__topline { display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, 256px); gap: 26px; align-items: flex-start; }
    .offer-shell__sender { display: flex; gap: 16px; align-items: flex-start; min-width: 0; }
    .offer-shell__logo { width: 54px; height: 54px; object-fit: contain; }
    .offer-shell__sender-copy { display: grid; gap: 4px; font-size: 13px; line-height: 1.6; color: #475569; }
    .offer-shell__sender-copy p, .offer-shell__meta dt, .offer-shell__meta dd, .offer-shell__customer p { margin: 0; }
    .offer-shell__sender-name, .offer-shell__customer-name { font-weight: 700; }
    .offer-shell__meta { min-width: 0; display: grid; gap: 14px; justify-items: end; text-align: right; }
    .offer-shell__status { margin: 0; display: inline-flex; align-items: center; justify-content: center; padding: 5px 11px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .offer-shell__status--draft { background: #e2e8f0; color: #334155; }
    .offer-shell__status--sent, .offer-shell__status--viewed { background: #dbeafe; color: #1d4ed8; }
    .offer-shell__status--accepted { background: #dcfce7; color: #166534; }
    .offer-shell__status--declined { background: #fee2e2; color: #b91c1c; }
    .offer-shell__status--expired { background: #f3f4f6; color: #6b7280; }
    .offer-shell__meta dl { margin: 0; display: grid; gap: 10px; width: 100%; }
    .offer-shell__meta dl div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 14px; align-items: start; justify-content: flex-end; }
    .offer-shell__meta dt { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; line-height: 1.45; }
    .offer-shell__meta dd { font-size: 14px; font-weight: 600; color: #0f172a; white-space: nowrap; line-height: 1.45; }
    .offer-shell__topline { grid-template-columns: minmax(0, 1fr); align-items: flex-start; gap: 14px; padding-bottom: 20px; border-bottom: 1px solid #dbe4ee; }
    .offer-shell__topline--legacy { gap: 14px; }
    .offer-shell__topline h1 { margin: 0; font-size: 22px; line-height: 1.25; font-weight: 700; }
    .offer-shell__recipient-details { display: grid; gap: 4px; margin-top: 14px; font-size: 14px; line-height: 1.7; color: #475569; }
    .offer-shell__recipient-details p { margin: 0; }
    .offer-shell__recipient-details strong { color: #0f172a; }
    .offer-shell__recipient-details--legacy { margin-top: 10px; }
    .offer-shell__customer { display: grid; gap: 4px; padding-left: 16px; border-left: 1px solid #e2e8f0; font-size: 12px; line-height: 1.55; color: #475569; }
    .offer-section { display: grid; gap: 12px; }
    .offer-section--intro-compact { max-width: 60ch; }
    .offer-section--intro-roomy { max-width: 74ch; }
    .offer-section h2, .offer-section h3 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; }
    .offer-section p { margin: 0; font-size: 13px; line-height: 1.72; color: #334155; }
    .offer-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .offer-items { display: grid; gap: 18px; }
    .offer-items__table { display: block; border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; }
    .offer-items__head, .offer-item-row { display: grid; grid-template-columns: var(--offer-columns); align-items: start; }
    .offer-items__head { gap: 18px; padding: 14px 20px; background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%); border-bottom: 1px solid #dbe4ee; color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .offer-items__head span:first-child { text-align: left; }
    .offer-items__head span:not(:first-child) { text-align: right; }
    .offer-item-row { gap: 18px; padding: 20px; border-bottom: 1px solid #eef2f7; }
    .offer-item-row:last-child { border-bottom: none; }
    .offer-item-row__product { display: grid; gap: 7px; min-width: 0; }
    .offer-item-row__title { font-size: 16px; line-height: 1.4; font-weight: 700; color: #0f172a; }
    .offer-item-row__detail { font-size: 13px; line-height: 1.68; color: #64748b; }
    .offer-item-row__value { text-align: right; font-size: 14px; line-height: 1.5; color: #334155; }
    .offer-item-row__value--strong { font-weight: 700; color: #0f172a; }
    .offer-items__cards { display: none; }
    .offer-item-card { border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
    .offer-item-card__top { display: grid; gap: 6px; padding: 15px 16px 14px; background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%); border-bottom: 1px solid #eef2f7; }
    .offer-item-card__eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
    .offer-item-card__title { font-size: 16px; line-height: 1.3; font-weight: 700; color: #0f172a; }
    .offer-item-card__detail { font-size: 13px; line-height: 1.7; color: #64748b; }
    .offer-item-card__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; margin: 0; }
    .offer-item-card__metric { display: grid; justify-items: center; align-content: center; gap: 7px; min-height: 78px; padding: 14px 12px 13px; text-align: center; background: #ffffff; }
    .offer-item-card__metric dt, .offer-item-card__metric dd { margin: 0; }
    .offer-item-card__metric dt { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; }
    .offer-item-card__metric dd { text-align: center; font-size: 14px; font-weight: 700; color: #0f172a; }
    .offer-item-card__metric:not(.offer-item-card__metric--total):not(.offer-item-card__metric--full):nth-child(odd) { border-right: 1px solid #eef2f7; }
    .offer-item-card__metric:nth-child(n + 3):not(.offer-item-card__metric--total) { border-top: 1px solid #eef2f7; }
    .offer-item-card__metric--full { grid-column: 1 / -1; border-top: 1px solid #eef2f7; }
    .offer-item-card__metric--total { grid-column: 1 / -1; gap: 8px; min-height: 0; padding: 16px 14px 15px; border-top: 1px solid #142742; background: linear-gradient(135deg, #13233a 0%, #223b63 100%); }
    .offer-item-card__metric--total dt, .offer-item-card__metric--total dd { color: #ffffff; }
    .offer-item-card__metric--total dd { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
    .offer-summary { margin-left: auto; width: min(260px, 100%); border: 1px solid #dbe4ee; border-radius: 16px; background: #ffffff; padding: 0; display: grid; gap: 0; overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03); }
    .offer-summary--below { width: min(360px, 100%); margin-top: 14px; margin-left: auto; }
    .offer-summary__row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 12px 16px; font-size: 13px; line-height: 1.55; color: #475569; border-bottom: 1px solid #e5ecf3; }
    .offer-summary__row span { font-weight: 600; color: #5b7088; }
    .offer-summary__row strong { white-space: nowrap; color: #10233b; font-weight: 700; }
    .offer-summary__row--subtotal { background: linear-gradient(180deg, #f8fbff 0%, #fdfefe 100%); }
    .offer-summary__row--subtotal span, .offer-summary__row--subtotal strong { color: #10233b; font-weight: 800; }
    .offer-summary__row--discount { background: #fff6f5; }
    .offer-summary__row--discount span, .offer-summary__row--discount strong { color: #b42318; }
    .offer-summary__row--vat span { color: #42576f; }
    .offer-summary__row--total { margin-top: 0; padding: 15px 16px 14px; border-top: 1px solid #142742; border-bottom: none; background: linear-gradient(135deg, #13233a 0%, #223b63 100%); font-size: 15px; color: #f8fafc; }
    .offer-summary__row--total span, .offer-summary__row--total strong { color: #ffffff; }
    .offer-summary__row--total span { font-size: 12px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; }
    .offer-summary__row--total strong { font-size: 22px; letter-spacing: -0.03em; }
    .offer-section--terms { margin-top: 14px; clear: both; }
    .offer-section--notes { clear: both; }
    .offer-shell__footer { display: grid; grid-template-columns: minmax(0, 1.35fr) repeat(2, minmax(0, 1fr)); gap: 22px; padding-top: 20px; margin-top: 22px; border-top: 1px solid #dbe4ee; }
    .offer-shell__footer div { display: grid; gap: 7px; font-size: 14px; line-height: 1.55; color: #475569; }
    .doc-header { font-size: 12px; color: #64748b; margin-bottom: 0; }
    .doc-footer { font-size: 12px; color: #64748b; margin-top: 0; }
    .doc-divider { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
    .page-separator { border: none; border-top: 2px dashed #e2e8f0; margin: 0; }
    /* page-block is exactly 816px wide - matches the editor's data-a4-page dimensions */
    /* so fill-page images (posX:0, posY:0, width:816, height:1056) render without crop */
    .page-block { position: relative; min-height: 1056px; overflow: hidden; }
    @media (max-width: 640px) {
      .doc-wrapper { margin: 0; border: none; border-radius: 0; }
      .page-content { padding: 20px 16px; }
      .page-block { min-height: 0; overflow: visible; }
      .page-content--edge-to-edge > div[style*="position:absolute"] { position: relative !important; left: auto !important; top: auto !important; width: 100% !important; }
      .offer-shell { gap: 16px; }
      .offer-shell__header { display: grid; grid-template-columns: minmax(0, 1fr) 168px; gap: 12px; }
      .offer-shell__topline { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
      .offer-shell__footer { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 14px; }
      .offer-shell__meta { min-width: 0; justify-items: end; text-align: right; }
      .offer-shell__meta dl div { grid-template-columns: 1fr; gap: 2px; justify-items: end; }
      .offer-shell__meta dt { font-size: 12.5px; line-height: 1.5; }
      .offer-shell__meta dd { font-size: 14px; line-height: 1.5; white-space: normal; }
      .offer-shell__topline h1 { font-size: 17px; }
      .offer-shell__recipient-details { margin-top: 8px; font-size: 14px; line-height: 1.7; }
      .offer-shell__customer { min-width: 0; border-left: 1px solid #e2e8f0; border-top: none; padding-left: 10px; padding-top: 0; font-size: 14px; line-height: 1.55; }
      .offer-shell__sender-copy { font-size: 14px; line-height: 1.55; }
      .offer-section p { font-size: 14px; line-height: 1.78; }
      .offer-item-card__title { font-size: 17px; line-height: 1.35; }
      .offer-item-card__detail { display: block; }
      .offer-items__table { display: none; }
      .offer-items__cards { display: grid; gap: 16px; }
      .offer-item-card { border-color: #cfdbe8; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); background: #ffffff; }
      .offer-item-card__metric { min-height: 82px; }
      .offer-item-card__metric--total { padding: 16px 12px 15px; }
      .offer-item-card__metric--total dd { font-size: 20px; color: #ffffff; }
      .offer-summary { width: 100%; border-radius: 16px; padding: 0; margin-top: 18px; border-color: #cfdbe8; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); }
      .offer-summary--below { width: 100%; margin-top: 18px; }
      .offer-summary__row { font-size: 14px; padding: 12px; line-height: 1.55; }
      .offer-summary__row--total { font-size: 16px; padding: 14px 12px; }
      .offer-summary__row--total span { font-size: 11px; }
      .offer-summary__row--total strong { font-size: 20px; color: #ffffff; }
      .offer-shell__footer div { justify-items: start; text-align: left; font-size: 13px; line-height: 1.6; }
      .offer-shell__footer-item--company { grid-column: 1 / -1; grid-template-columns: minmax(0, 1fr); row-gap: 4px; align-items: start; }
      .offer-shell__footer-item--company strong { justify-content: flex-start; }
      .offer-shell__footer-item--company > a, .offer-shell__footer-item--company > span:last-child { overflow-wrap: anywhere; }
      .offer-shell__footer-item--responsible, .offer-shell__footer-item--contact { padding-top: 10px; border-top: 1px solid #e2e8f0; }
    }
    @media print {
      .doc-wrapper { margin: 0; border: none; }
      .page-content { padding: 0; }
      .page-separator { display: none; }
      .page-block { page-break-after: always; min-height: 0; }
      .page-block:last-child { page-break-after: auto; }
      .doc-header { position: running(header); }
      .doc-footer { position: running(footer); }
    }`;
