/**
 * Document Generator — server-side only.
 *
 * Converts a TipTap JSON template to HTML and replaces {{placeholder}} variables
 * with offer data. Called at offer-send time to create an immutable HTML snapshot
 * stored in Offer.generatedDocument.
 *
 * TipTap JSON node types handled:
 *   doc, paragraph, heading (levels 1-3), bulletList, orderedList, listItem,
 *   text (with bold / italic marks), hardBreak, horizontalRule
 */

import type { Offer, OfferLineItem } from '../domain/offer.entity';

// ─── SEK formatter ─────────────────────────────────────────────────────────────

function fmtSEK(n: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency', currency: 'SEK', maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// ─── TipTap JSON → HTML ─────────────────────────────────────────────────────────

interface TipTapNode {
  type:    string;
  attrs?:  Record<string, unknown>;
  content?: TipTapNode[];
  text?:   string;
  marks?:  Array<{ type: string; attrs?: Record<string, unknown> }>;
}

function nodeToHtml(node: TipTapNode): string {
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map(nodeToHtml).join('');

    case 'paragraph': {
      const inner = (node.content ?? []).map(nodeToHtml).join('');
      return `<p style="margin:0 0 0.75em 0;">${inner || '&nbsp;'}</p>`;
    }

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1;
      const tag   = `h${Math.min(level, 6)}`;
      const sizes: Record<number, string> = { 1: '1.8em', 2: '1.4em', 3: '1.2em' };
      const size  = sizes[level] ?? '1em';
      const inner = (node.content ?? []).map(nodeToHtml).join('');
      return `<${tag} style="margin:0.5em 0;font-size:${size};font-weight:700;">${inner}</${tag}>`;
    }

    case 'bulletList':
      return `<ul style="margin:0 0 0.75em 1.5em;padding:0;">${(node.content ?? []).map(nodeToHtml).join('')}</ul>`;

    case 'orderedList':
      return `<ol style="margin:0 0 0.75em 1.5em;padding:0;">${(node.content ?? []).map(nodeToHtml).join('')}</ol>`;

    case 'listItem':
      return `<li style="margin-bottom:0.25em;">${(node.content ?? []).map(nodeToHtml).join('')}</li>`;

    case 'hardBreak':
      return '<br/>';

    case 'horizontalRule':
      return '<hr style="border:none;border-top:1px solid #e2e8f0;margin:1em 0;"/>';

    case 'text': {
      let text = escapeHtml(node.text ?? '');
      for (const mark of (node.marks ?? [])) {
        if (mark.type === 'bold')   text = `<strong>${text}</strong>`;
        if (mark.type === 'italic') text = `<em>${text}</em>`;
        if (mark.type === 'code')   text = `<code style="background:#f1f5f9;padding:0.1em 0.3em;border-radius:3px;">${text}</code>`;
      }
      return text;
    }

    default:
      // Unknown node type — render children if any
      return (node.content ?? []).map(nodeToHtml).join('');
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Line items table ──────────────────────────────────────────────────────────

function buildLineItemsTable(items: OfferLineItem[]): string {
  const headerStyle = 'padding:8px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;background:#f8fafc;border-bottom:2px solid #e2e8f0;';
  const cellStyle   = 'padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;vertical-align:top;';
  const numStyle    = `${cellStyle}text-align:right;`;

  const vatLabel = (r: number) => `${Math.round(r * 100)}%`;
  const discountLabel = (d?: number) => d ? `${d}%` : '–';

  const rows = items.map((item) => {
    const disc      = 1 - ((item.discount ?? 0) / 100);
    const lineExVat = item.quantity * item.unitPrice * disc;
    return `
      <tr>
        <td style="${cellStyle}">${escapeHtml(item.description)}</td>
        <td style="${numStyle}">${item.quantity}</td>
        <td style="${numStyle}">${fmtSEK(item.unitPrice)}</td>
        <td style="${numStyle}">${vatLabel(item.vatRate)}</td>
        <td style="${numStyle}">${discountLabel(item.discount)}</td>
        <td style="${numStyle};font-weight:600;">${fmtSEK(lineExVat)}</td>
      </tr>`;
  }).join('');

  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:1em;">
      <thead>
        <tr>
          <th style="${headerStyle}">Beskrivning</th>
          <th style="${headerStyle}text-align:right;">Antal</th>
          <th style="${headerStyle}text-align:right;">Á-pris</th>
          <th style="${headerStyle}text-align:right;">Moms</th>
          <th style="${headerStyle}text-align:right;">Rabatt</th>
          <th style="${headerStyle}text-align:right;">Summa</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── Signature placeholder HTML ────────────────────────────────────────────────

const SIGNATURE_FIELD_HTML = `
  <div style="border:2px dashed #cbd5e1;border-radius:8px;padding:24px 20px;margin:24px 0;text-align:center;min-height:80px;background:#f8fafc;">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Signatur</p>
    <p style="color:#cbd5e1;font-size:11px;margin:0;">Underteckna med e-signatur via länken du mottog</p>
  </div>`;

// ─── Main generator ────────────────────────────────────────────────────────────

/**
 * Generates an HTML document by:
 * 1. Parsing the TipTap JSON template to HTML
 * 2. Replacing all {{placeholder}} variables with offer data
 *
 * The result is stored as Offer.generatedDocument (immutable after send).
 */
export function generateDocument(templateContent: string, offer: Offer): string {
  // Parse TipTap JSON
  let rootNode: TipTapNode;
  try {
    rootNode = JSON.parse(templateContent) as TipTapNode;
  } catch {
    // If content is not valid JSON, treat as plain text
    rootNode = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: templateContent }] }] };
  }

  let html = nodeToHtml(rootNode);

  // Compute VAT amount
  const vatAmount = offer.totalIncVat - offer.totalExVat;

  // Replace placeholders
  const replacements: Record<string, string> = {
    '{{offerTitle}}':       escapeHtml(offer.title),
    '{{recipientName}}':    escapeHtml(offer.recipientName),
    '{{recipientEmail}}':   escapeHtml(offer.recipientEmail),
    '{{recipientCompany}}': escapeHtml(offer.recipientCompany ?? ''),
    '{{totalExVat}}':       fmtSEK(offer.totalExVat),
    '{{totalIncVat}}':      fmtSEK(offer.totalIncVat),
    '{{vatAmount}}':        fmtSEK(vatAmount),
    '{{validUntil}}':       fmtDate(offer.validUntil),
    '{{notes}}':            escapeHtml(offer.notes ?? ''),
    '{{lineItems}}':        buildLineItemsTable(offer.lineItems),
    '{{signature}}':        SIGNATURE_FIELD_HTML,
  };

  for (const [key, value] of Object.entries(replacements)) {
    // Replace all occurrences (placeholder may appear multiple times)
    html = html.split(key).join(value);
  }

  // Wrap in a styled document shell
  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(offer.title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; background: #fff; margin: 0; padding: 0; }
    .doc-wrapper { max-width: 700px; margin: 40px auto; padding: 40px 48px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
    @media (max-width: 640px) { .doc-wrapper { margin: 0; padding: 24px 20px; border: none; border-radius: 0; } }
    @media print { .doc-wrapper { margin: 0; padding: 0; border: none; } }
  </style>
</head>
<body>
  <div class="doc-wrapper">
    ${html}
  </div>
</body>
</html>`;
}
