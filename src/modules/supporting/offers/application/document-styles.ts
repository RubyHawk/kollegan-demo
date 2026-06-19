/**
 * Document HTML style injection helpers.
 *
 * Kept separate from document generation so renderer orchestration stays readable.
 */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function upsertStyleTag(html: string, marker: string, styleTag: string): string {
  const existingPattern = new RegExp(`<style[^>]*${escapeRegExp(marker)}[^>]*>[\\s\\S]*?<\\/style>`, 'i');
  if (existingPattern.test(html)) {
    return html.replace(existingPattern, styleTag);
  }
  if (html.includes('</head>')) return html.replace('</head>', `${styleTag}\n</head>`);
  return `${styleTag}\n${html}`;
}

export function injectDocumentPatchStyles(html: string): string {
  const patchStyles = `
<style data-offer-document-patch>
  body {
    font-family: "Aptos", "Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
    color: #1f335b !important;
  }
  .page-content--document {
    min-height: 960px !important;
    padding: 52px 52px 44px !important;
    background: #ffffff !important;
  }
  .offer-shell {
    gap: 28px !important;
    color: #1f335b !important;
  }
  .offer-shell__header {
    display: grid !important;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.9fr) !important;
    gap: 36px !important;
    align-items: center !important;
    padding-bottom: 30px !important;
    border-bottom: 2px solid #dbe5f1 !important;
  }
  .offer-shell__sender {
    gap: 18px !important;
    align-items: flex-start !important;
  }
  .offer-shell__logo {
    width: 92px !important;
    height: 92px !important;
    border-radius: 24px !important;
    object-fit: cover !important;
    box-shadow: 0 10px 28px rgba(142, 169, 205, 0.22) !important;
  }
  .offer-shell__sender-copy {
    display: grid !important;
    gap: 6px !important;
    color: #111827 !important;
    font-size: 15px !important;
    line-height: 1.38 !important;
  }
  .offer-shell__sender-copy p {
    margin: 0 !important;
  }
  .offer-shell__sender-name {
    margin-bottom: 8px !important;
    font-size: 18px !important;
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
    background: transparent !important;
    box-shadow: none !important;
  }
  .offer-shell__status {
    display: none !important;
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
    gap: 8px !important;
    padding: 0 18px !important;
    border-left: 1px solid #dbe5f1 !important;
  }
  .offer-shell__meta dl div:first-child {
    border-left: none !important;
    padding-left: 0 !important;
  }
  .offer-shell__meta dl div:last-child {
    padding-right: 0 !important;
  }
  .offer-shell__meta dt {
    margin: 0 !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    letter-spacing: 0 !important;
    text-transform: none !important;
    color: #657b9c !important;
  }
  .offer-shell__meta dd {
    margin: 0 !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    color: #1f335b !important;
    white-space: nowrap !important;
  }
  .offer-shell__topline {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) minmax(220px, 280px) !important;
    gap: 28px !important;
    align-items: end !important;
    padding-bottom: 0 !important;
    border-bottom: 0 !important;
  }
  .offer-shell__eyebrow,
  .offer-shell__lead,
  .offer-shell__customer-label {
    display: none !important;
  }
  .offer-shell__topline h1 {
    margin: 0 !important;
    font-family: "Times New Roman", Times, serif !important;
    font-size: 76px !important;
    font-weight: 700 !important;
    line-height: 0.95 !important;
    letter-spacing: -0.03em !important;
    color: #1e3158 !important;
  }
  .offer-shell__customer-card {
    display: grid !important;
    gap: 10px !important;
    min-width: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    text-align: right !important;
    justify-self: end !important;
    align-self: center !important;
  }
  .offer-shell__customer-card p {
    margin: 0 !important;
  }
  .offer-shell__customer-primary {
    font-size: 18px !important;
    line-height: 1.2 !important;
    font-weight: 700 !important;
    color: #1f335b !important;
  }
  .offer-shell__customer-secondary {
    font-size: 13px !important;
    line-height: 1.4 !important;
    color: #334b70 !important;
  }
  .offer-table-header {
    display: none !important;
  }
  .offer-pricing-layout {
    display: block !important;
  }
  .offer-summary {
    width: min(380px, 100%) !important;
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
    width: min(380px, 100%) !important;
    margin-top: 26px !important;
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
    font-size: 14px !important;
    line-height: 1.35 !important;
    border-radius: 0 !important;
  }
  .offer-summary__row strong {
    color: #1f335b !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    font-variant-numeric: tabular-nums !important;
    white-space: nowrap !important;
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
  .offer-summary__row--subtotal {
    background: linear-gradient(180deg, #f8fbff 0%, #fdfefe 100%) !important;
  }
  .offer-summary__row--subtotal span,
  .offer-summary__row--subtotal strong {
    color: #10233b !important;
    font-weight: 800 !important;
  }
  .offer-summary__row--discount {
    background: #fff6f5 !important;
  }
  .offer-summary__row--discount span,
  .offer-summary__row--discount strong {
    color: #b42318 !important;
  }
  .offer-summary__row--vat span {
    color: #42576f !important;
  }
  .offer-summary__row--total {
    margin-top: 10px !important;
    padding: 16px 18px !important;
    background: #2d4a83 !important;
    color: #ffffff !important;
  }
  .offer-summary__row--total strong,
  .offer-summary__row--total span {
    color: #ffffff !important;
  }
  .offer-summary__total-copy {
    display: grid !important;
    gap: 4px !important;
  }
  .offer-summary__total-label {
    font-size: 22px !important;
    font-weight: 700 !important;
    line-height: 1 !important;
  }
  .offer-summary__total-subcopy {
    font-size: 11px !important;
    font-weight: 700 !important;
    line-height: 1.1 !important;
  }
  .offer-summary__row--total strong {
    font-size: 18px !important;
    font-weight: 700 !important;
    letter-spacing: -0.02em !important;
  }
  .offer-section--terms,
  .offer-section--notes {
    clear: both !important;
  }
  .offer-section--terms {
    gap: 16px !important;
    margin-top: 28px !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
  }
  .offer-section--terms h3,
  .offer-section--notes h3 {
    display: flex !important;
    align-items: center !important;
    gap: 16px !important;
    margin: 0 !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    letter-spacing: 0 !important;
    text-transform: none !important;
    color: #1f335b !important;
  }
  .offer-section--terms h3::after,
  .offer-section--notes h3::after {
    content: '' !important;
    flex: 1 1 auto !important;
    height: 1px !important;
    background: #dbe5f1 !important;
  }
  .offer-section--terms p,
  .offer-section--notes p,
  .offer-section--terms li,
  .offer-section--notes li {
    font-size: 14px !important;
    line-height: 1.72 !important;
    color: #334b70 !important;
  }
  .offer-section--terms ul,
  .offer-section--notes ul {
    display: grid !important;
    gap: 12px !important;
    margin: 0 !important;
    padding-left: 28px !important;
  }
  .offer-section--terms li::marker,
  .offer-section--notes li::marker {
    color: #a8b9d4 !important;
  }
  .offer-shell__footer {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 28px !important;
    padding-top: 28px !important;
    margin-top: 42px !important;
    border-top: 1px solid #dbe5f1 !important;
  }
  .offer-shell__footer div {
    display: grid !important;
    justify-items: center !important;
    gap: 10px !important;
    text-align: center !important;
    color: #334b70 !important;
    font-size: 14px !important;
    line-height: 1.35 !important;
  }
  .offer-shell__footer strong {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    margin: 0 !important;
    color: #1f335b !important;
    font-size: 13px !important;
    font-weight: 700 !important;
  }
  .offer-shell__footer-icon {
    width: 17px !important;
    height: 17px !important;
    stroke: currentColor !important;
    fill: none !important;
    stroke-width: 16 !important;
    stroke-linecap: round !important;
    stroke-linejoin: round !important;
    flex: 0 0 17px !important;
  }
  .offer-shell__footer a {
    color: #2563eb !important;
    text-decoration: none !important;
    font-weight: 500 !important;
  }
  @media (max-width: 640px) {
    .page-content--document {
      padding: 26px 18px 24px !important;
    }
    .offer-shell__header,
    .offer-shell__topline {
      grid-template-columns: minmax(0, 1fr) !important;
      gap: 20px !important;
    }
    .offer-shell__meta dl {
      grid-template-columns: 1fr !important;
      gap: 14px !important;
    }
    .offer-shell__meta dl div {
      padding: 0 !important;
      border-left: 0 !important;
      border-top: 1px solid #dbe5f1 !important;
      padding-top: 14px !important;
    }
    .offer-shell__meta dl div:first-child {
      border-top: 0 !important;
      padding-top: 0 !important;
    }
    .offer-shell__topline h1 {
      font-size: 54px !important;
    }
    .offer-shell__customer-card {
      justify-self: start !important;
      text-align: left !important;
    }
    .offer-summary,
    .offer-summary--below {
      width: 100% !important;
      margin-top: 18px !important;
    }
    .offer-shell__footer {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 12px !important;
      text-align: left !important;
    }
    .offer-shell__footer div {
      justify-items: start !important;
      text-align: left !important;
      font-size: 12px !important;
      gap: 6px !important;
    }
    .offer-shell__footer-item--company { grid-column: 1 / -1 !important; grid-template-columns: minmax(0, 1fr) !important; row-gap: 4px !important; align-items: start !important; }
    .offer-shell__footer-item--company strong { justify-content: flex-start !important; }
    .offer-shell__footer-item--company > a, .offer-shell__footer-item--company > span:last-child { overflow-wrap: anywhere !important; }
    .offer-shell__footer-item--responsible,
    .offer-shell__footer-item--contact {
      padding-top: 10px !important;
      border-top: 1px solid rgba(219, 229, 241, 0.9) !important;
    }
    .offer-shell__footer-icon {
      width: 14px !important;
      height: 14px !important;
      flex: 0 0 14px !important;
    }
  }
</style>`;

  return upsertStyleTag(html, 'data-offer-document-patch', patchStyles);
}

