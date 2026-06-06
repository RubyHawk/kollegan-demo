/**
 * Print CSS for the invoice PDF document.
 *
 * Self-contained inside the invoicing module — intentionally NOT importing the
 * offers print styles, because supporting modules may not depend on each other.
 * A4, print colour-exact, neutral document styling for money/legal data.
 */

export const INVOICE_PDF_PRINT_STYLES = `
<style>
  @page { size: A4; margin: 0; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #14263f;
    font-family: "Helvetica Neue", Arial, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  *, *::before, *::after {
    box-shadow: none !important;
    text-shadow: none !important;
    animation: none !important;
    transition: none !important;
    box-sizing: border-box;
  }
  .inv-page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 18mm 16mm 16mm;
    background: #ffffff;
    color: #1f2d44;
    font-size: 12px;
    line-height: 1.5;
  }
  .inv-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding-bottom: 18px;
    border-bottom: 2px solid #1f3a63;
  }
  .inv-seller { display: flex; gap: 16px; align-items: flex-start; min-width: 0; }
  .inv-logo {
    width: 64px;
    height: 64px;
    object-fit: contain;
    border-radius: 8px;
  }
  .inv-seller__name {
    margin: 0 0 4px;
    font-size: 17px;
    font-weight: 700;
    color: #14263f;
  }
  .inv-seller__line { margin: 0; font-size: 11.5px; line-height: 1.45; color: #3a4a63; }
  .inv-title-block { text-align: right; flex-shrink: 0; }
  .inv-title {
    margin: 0;
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #1f3a63;
    text-transform: uppercase;
  }
  .inv-title--credit { color: #b42318; }
  .inv-number { margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #1f2d44; }

  .inv-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-top: 20px;
  }
  .inv-meta__box {
    border: 1px solid #d7e0ec;
    border-radius: 8px;
    padding: 12px 14px;
    background: #f8fafc;
  }
  .inv-meta__label {
    margin: 0 0 6px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7c97;
  }
  .inv-meta__value { margin: 0; font-size: 12px; line-height: 1.45; color: #1f2d44; }
  .inv-meta__value strong { font-weight: 700; }

  .inv-dates {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    margin-top: 18px;
    border: 1px solid #d7e0ec;
    border-radius: 8px;
    overflow: hidden;
  }
  .inv-dates__cell { padding: 10px 14px; border-left: 1px solid #e4ebf3; }
  .inv-dates__cell:first-child { border-left: none; }
  .inv-dates__label {
    margin: 0 0 3px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #6b7c97;
  }
  .inv-dates__value { margin: 0; font-size: 13px; font-weight: 700; color: #1f2d44; }
  .inv-dates__value--due { color: #b42318; }

  .inv-items { width: 100%; border-collapse: collapse; margin-top: 22px; }
  .inv-items thead th {
    padding: 8px 10px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #ffffff;
    background: #1f3a63;
    text-align: right;
  }
  .inv-items thead th.inv-col-desc { text-align: left; }
  .inv-items tbody td {
    padding: 9px 10px;
    font-size: 11.5px;
    color: #2a3a54;
    border-bottom: 1px solid #e8eef5;
    text-align: right;
    vertical-align: top;
    font-variant-numeric: tabular-nums;
  }
  .inv-items tbody td.inv-col-desc { text-align: left; color: #14263f; font-weight: 500; }
  .inv-items tbody tr:nth-child(even) td { background: #f8fafc; }

  .inv-totals-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 22px;
  }
  .inv-totals { width: 300px; }
  .inv-vat-breakdown {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
  .inv-vat-breakdown caption {
    text-align: left;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #6b7c97;
    padding-bottom: 4px;
  }
  .inv-vat-breakdown th,
  .inv-vat-breakdown td {
    padding: 4px 8px;
    font-size: 10.5px;
    text-align: right;
    color: #44546f;
    font-variant-numeric: tabular-nums;
  }
  .inv-vat-breakdown th { font-weight: 600; color: #6b7c97; border-bottom: 1px solid #e4ebf3; }
  .inv-vat-breakdown th.inv-vat-rate-col,
  .inv-vat-breakdown td.inv-vat-rate-col { text-align: left; }

  .inv-summary { border-top: 1px solid #d7e0ec; }
  .inv-summary__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 7px 0;
    font-size: 12px;
    color: #3a4a63;
  }
  .inv-summary__row strong { font-variant-numeric: tabular-nums; color: #1f2d44; }
  .inv-summary__row--grand {
    margin-top: 6px;
    padding: 12px 14px;
    background: #1f3a63;
    color: #ffffff;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 700;
  }
  .inv-summary__row--grand strong { color: #ffffff; font-size: 17px; }

  .inv-payment {
    margin-top: 24px;
    padding: 14px 16px;
    border: 1px solid #d7e0ec;
    border-radius: 8px;
    background: #f8fafc;
  }
  .inv-payment__label {
    margin: 0 0 6px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7c97;
  }
  .inv-payment__row { margin: 0; font-size: 12px; line-height: 1.55; color: #1f2d44; }
  .inv-payment__row strong { font-weight: 700; }

  .inv-notes {
    margin-top: 18px;
    font-size: 11px;
    line-height: 1.55;
    color: #44546f;
    white-space: pre-wrap;
  }
  .inv-footer {
    margin-top: 28px;
    padding-top: 12px;
    border-top: 1px solid #e4ebf3;
    font-size: 10px;
    color: #6b7c97;
    text-align: center;
  }
</style>`;
