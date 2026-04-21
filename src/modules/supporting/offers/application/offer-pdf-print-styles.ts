export const PUBLIC_OFFER_PDF_PRINT_STYLES = `
<style>
  @page { size: A4; margin: 0; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #14263f;
    font-family: Aptos, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  *, *::before, *::after {
    box-shadow: none !important;
    text-shadow: none !important;
    filter: none !important;
    backdrop-filter: none !important;
    animation: none !important;
    transition: none !important;
  }
  .doc-wrapper { margin: 0 !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; max-width: none !important; }
  .page-separator { display: none !important; }
  .page-block { page-break-after: always; break-after: page; }
  .page-block:last-child { page-break-after: auto; break-after: auto; }
  .page-block--document {
    min-height: auto !important;
    page-break-after: auto !important;
    break-after: auto !important;
  }
  .page-block--document::before {
    content: none !important;
    background: none !important;
    background-image: none !important;
    display: none !important;
  }
  .page-content--document {
    min-height: auto !important;
    padding: 30px 36px 26px !important;
    background: #ffffff !important;
  }
  .offer-shell {
    gap: 24px !important;
    color: #1f335b !important;
  }
  .offer-shell__header {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.9fr) !important;
    gap: 28px !important;
    align-items: center !important;
    padding-bottom: 22px !important;
    border-bottom: 1px solid #dbe5f1 !important;
  }
  .offer-shell__topline {
    grid-template-columns: minmax(0, 1fr) minmax(220px, 260px) !important;
    gap: 24px !important;
    align-items: end !important;
    padding-bottom: 0 !important;
    border-bottom: 0 !important;
  }
  .offer-shell__topline h1 {
    margin: 0 !important;
    font-family: "Times New Roman", Times, serif !important;
    font-size: 54px !important;
    font-weight: 700 !important;
    line-height: 0.95 !important;
    letter-spacing: -0.03em !important;
    color: #1e3158 !important;
  }
  .offer-shell__lead,
  .offer-shell__eyebrow,
  .offer-shell__customer-label,
  .offer-shell__status,
  .offer-shell__title {
    display: none !important;
  }
  .offer-shell__sender {
    gap: 16px !important;
    align-items: flex-start !important;
  }
  .offer-shell__logo {
    width: 72px !important;
    height: 72px !important;
    border-radius: 20px !important;
    object-fit: cover !important;
    box-shadow: 0 8px 22px rgba(142, 169, 205, 0.2) !important;
  }
  .offer-shell__sender-copy {
    display: grid !important;
    gap: 4px !important;
    font-size: 13px !important;
    line-height: 1.38 !important;
    color: #111827 !important;
  }
  .offer-shell__sender-name {
    margin-bottom: 6px !important;
    font-size: 16px !important;
    font-weight: 700 !important;
    color: #1f335b !important;
  }
  .offer-shell__meta {
    display: grid !important;
    justify-items: stretch !important;
    text-align: center !important;
    gap: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
  }
  .offer-shell__meta dl {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 0 !important;
    width: 100% !important;
    margin: 0 !important;
  }
  .offer-shell__meta dl div {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 6px !important;
    padding: 0 14px !important;
    border-left: 1px solid #dbe5f1 !important;
    border-bottom: none !important;
  }
  .offer-shell__meta dl div:first-child {
    border-left: none !important;
    padding-left: 0 !important;
  }
  .offer-shell__meta dl div:last-child {
    padding-right: 0 !important;
  }
  .offer-shell__meta dt {
    font-size: 10px !important;
    font-weight: 700 !important;
    line-height: 1.3 !important;
    letter-spacing: 0 !important;
    text-transform: none !important;
    text-align: center !important;
    color: #657b9c !important;
  }
  .offer-shell__meta dd {
    font-size: 14px !important;
    line-height: 1.2 !important;
    color: #1f335b !important;
    font-weight: 700 !important;
    white-space: nowrap !important;
    text-align: center !important;
  }
  .offer-shell__customer-card {
    display: grid !important;
    gap: 8px !important;
    min-width: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    text-align: right !important;
    justify-self: end !important;
    align-self: center !important;
  }
  .offer-shell__customer-card p {
    margin: 0 !important;
  }
  .offer-shell__customer-primary {
    font-size: 15px !important;
    line-height: 1.2 !important;
    font-weight: 700 !important;
    color: #1f335b !important;
  }
  .offer-shell__customer-secondary {
    font-size: 11px !important;
    line-height: 1.4 !important;
    color: #334b70 !important;
  }
  .offer-section {
    gap: 8px !important;
  }
  .offer-section h2,
  .offer-section h3 {
    font-size: 12px !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    color: #6b7e95 !important;
  }
  .offer-table-header h2 {
    font-size: 22px !important;
    line-height: 1.18 !important;
    letter-spacing: -0.03em !important;
    text-transform: none !important;
    color: #10233b !important;
  }
  .offer-section p {
    font-size: 12px !important;
    line-height: 1.55 !important;
    color: #34485f !important;
  }
  .offer-table-header {
    margin-bottom: 6px !important;
  }
  .offer-items {
    gap: 10px !important;
  }
  .page-content--document,
  .offer-shell,
  .offer-shell__header,
  .offer-shell__topline,
  .offer-shell__meta,
  .offer-shell__customer-card,
  .offer-items__table,
  .offer-items__head,
  .offer-item-card,
  .offer-item-card__top,
  .offer-item-card__metric,
  .offer-item-card__metric--total,
  .offer-summary,
  .offer-summary__row,
  .offer-summary__row--total,
  .offer-shell__status {
    background: #ffffff !important;
    background-image: none !important;
  }
  .offer-items__head {
    gap: 12px !important;
    padding: 10px 13px !important;
    font-size: 10px !important;
    background: linear-gradient(180deg, #f7faff 0%, #edf3fb 100%) !important;
    border-bottom: 1px solid #d9e4ef !important;
    color: #6b7e95 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
  }
  .offer-item-row {
    gap: 12px !important;
    padding: 11px 13px !important;
    border-bottom: 1px solid #edf2f7 !important;
  }
  .offer-item-row:last-child {
    border-bottom: none !important;
  }
  .offer-item-row__title {
    font-size: 13px !important;
    line-height: 1.35 !important;
    color: #10233b !important;
  }
  .offer-item-row__detail,
  .offer-item-card__detail {
    display: none !important;
  }
  .offer-item-row__detail,
  .offer-item-row__value {
    font-size: 11.5px !important;
    line-height: 1.42 !important;
    color: #465a73 !important;
  }
  .offer-shell__meta,
  .offer-shell__customer-card,
  .offer-items__table,
  .offer-item-card,
  .offer-summary,
  .offer-shell__status,
  .offer-shell__title {
    border-radius: 12px !important;
  }
  .offer-summary {
    width: min(332px, 100%) !important;
    max-width: none !important;
    margin-left: auto !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    gap: 6px !important;
    overflow: visible !important;
  }
  .offer-summary--below {
    width: min(332px, 100%) !important;
    margin-top: 18px !important;
    margin-left: auto !important;
    clear: both !important;
  }
  .offer-summary__row {
    position: relative !important;
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto !important;
    align-items: center !important;
    gap: 18px !important;
    padding: 11px 16px !important;
    background: #f4f7fb !important;
    color: #1f335b !important;
    font-size: 13px !important;
    line-height: 1.35 !important;
    border: 0 !important;
    border-radius: 0 !important;
  }
  .offer-summary__row span {
    font-weight: 600 !important;
    color: #445a7a !important;
  }
  .offer-summary__row strong {
    color: #1f335b !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    font-variant-numeric: tabular-nums !important;
    white-space: nowrap !important;
  }
  .offer-summary__row--subtotal {
    background: linear-gradient(180deg, #f8fbff 0%, #fdfefe 100%) !important;
  }
  .offer-summary__row--subtotal span,
  .offer-summary__row--subtotal strong {
    color: #10233b !important;
    font-weight: 800 !important;
  }
  .offer-summary__row--discount {
    background: #fff1f1 !important;
    color: #be3d35 !important;
  }
  .offer-summary__row--discount::before {
    content: '' !important;
    position: absolute !important;
    left: 0 !important;
    top: 8px !important;
    bottom: 8px !important;
    width: 4px !important;
    border-radius: 999px !important;
    background: #c83d35 !important;
  }
  .offer-summary__row--discount span,
  .offer-summary__row--discount strong {
    color: #b42318 !important;
  }
  .offer-summary__row--vat span {
    color: #42576f !important;
  }
  .offer-item-card__metric--total {
    color: #0f172a !important;
    font-weight: 700 !important;
  }
  .offer-summary__row--total {
    margin-top: 10px !important;
    padding: 15px 18px !important;
    background: #2d4a83 !important;
    color: #ffffff !important;
  }
  .offer-summary__row--total span {
    color: #ffffff !important;
  }
  .offer-summary__total-copy {
    display: grid !important;
    gap: 4px !important;
  }
  .offer-summary__total-label {
    font-size: 18px !important;
    font-weight: 700 !important;
    line-height: 1 !important;
  }
  .offer-summary__total-subcopy {
    font-size: 10px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    text-transform: uppercase !important;
  }
  .offer-summary__row--total strong,
  .offer-item-card__metric--total dd {
    color: #ffffff !important;
  }
  .offer-summary__row--total strong {
    font-size: 16px !important;
    font-weight: 700 !important;
    letter-spacing: -0.02em !important;
  }
  .offer-item-card__metric:nth-child(even) {
    background: #ffffff !important;
  }
  .offer-section--terms,
  .offer-section--notes {
    margin-top: 6px !important;
    padding: 12px 14px !important;
    border: 1px solid #dce6f0 !important;
    border-radius: 14px !important;
    background: #ffffff !important;
  }
  .offer-shell__footer {
    grid-template-columns: minmax(0, 1.35fr) repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
    padding-top: 12px !important;
    margin-top: 10px !important;
    border-top: 1px solid #dce6f0 !important;
  }
  .offer-shell__footer div {
    gap: 2px !important;
    font-size: 11px !important;
    line-height: 1.4 !important;
    color: #465a73 !important;
  }
  .offer-shell__logo,
  img {
    image-rendering: auto !important;
  }
</style>`;;
