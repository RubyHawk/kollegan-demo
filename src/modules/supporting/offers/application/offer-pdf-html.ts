import type { OfferPdfVariant } from './offer-pdf';
import { PUBLIC_OFFER_PDF_PRINT_STYLES } from './offer-pdf-print-styles';

const SWEDISH_MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'] as const;

function formatCompactSwedishDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getDate()} ${SWEDISH_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

function buildSignatureHydrationScript(offer: OfferPdfVariant): string {
  const acceptedDate = offer.acceptedAt
    ? formatCompactSwedishDate(offer.acceptedAt)
    : '';

  return `
<script>
  (function () {
    var sig = {
      image: ${JSON.stringify(offer.signatureImage ?? '')},
      name: ${JSON.stringify(offer.signerName ?? '')},
      date: ${JSON.stringify(acceptedDate)}
    };
    document.querySelectorAll('[data-sig-field]').forEach(function (el) {
      var field = el.getAttribute('data-sig-field');
      if (!field) return;

      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }

      el.style.border = 'none';
      el.style.borderRadius = '0';
      el.style.background = 'transparent';
      el.style.padding = '4px 0';
      el.style.minHeight = '0';
      el.style.display = 'block';

      if (field === 'signature') {
        if (!sig.image) {
          el.style.display = 'none';
          return;
        }
        var img = document.createElement('img');
        img.src = sig.image;
        img.alt = 'Signatur';
        img.style.maxWidth = '260px';
        img.style.maxHeight = '80px';
        img.style.display = 'block';
        el.appendChild(img);
        return;
      }

      if (field === 'name') {
        if (!sig.name) {
          el.style.display = 'none';
          return;
        }
        var nameSpan = document.createElement('span');
        nameSpan.textContent = sig.name;
        nameSpan.style.fontSize = '15px';
        nameSpan.style.color = '#1e293b';
        nameSpan.style.fontWeight = '500';
        el.appendChild(nameSpan);
        return;
      }

      if (field === 'date') {
        if (!sig.date) {
          el.style.display = 'none';
          return;
        }
        var dateSpan = document.createElement('span');
        dateSpan.textContent = sig.date;
        dateSpan.style.fontSize = '14px';
        dateSpan.style.color = '#475569';
        el.appendChild(dateSpan);
        return;
      }

      el.style.display = 'none';
    });
  })();
</script>`;
}

export function buildPublicPdfHtml(
  documentHtml: string,
  origin: string,
  offer: OfferPdfVariant,
): string {
  const baseTag = `<base href="${origin}/" />`;
  const signatureScript = buildSignatureHydrationScript(offer);
  const behaviorScript = `
<script>
  (function () {
    function normalizeBrokenSwedish(text) {
      return text
        .replace(/\u00c3\u0192\u00e2\u20ac\u00a6/g, '\u00c3\u2026')
        .replace(/\u00c3\u0192\u00e2\u20ac\u017e/g, '\u00c3\u201e')
        .replace(/\u00c3\u0192\u00e2\u20ac\u201c/g, '\u00c3\u2013')
        .replace(/\u00c3\u0192\u00c2\u00a5/g, '\u00c3\u00a5')
        .replace(/\u00c3\u0192\u00c2\u00a4/g, '\u00c3\u00a4')
        .replace(/\u00c3\u0192\u00c2\u00b6/g, '\u00c3\u00b6')
        .replace(/\u00c3\u201a\u00c2\u00a0/g, '\\u00a0')
        .replace(/\u00c3\u201a\u00c2\u00b7/g, '\u00c2\u00b7')
        .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u009d/g, '\u00e2\u20ac\u201d')
        .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u0153/g, '\u00e2\u20ac\u201c')
        .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u00c5\u201c/g, '\u00e2\u20ac\u0153')
        .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\\u009d/g, '\u00e2\u20ac\u009d')
        .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u201e\u00a2/g, '\u00e2\u20ac\u2122');
    }

    var statusLabel = ${JSON.stringify(
      offer.status === 'accepted'
        ? 'Signerad'
        : offer.status === 'declined'
          ? 'Avvisad'
          : offer.status === 'expired'
            ? 'Utgången'
            : 'Offert',
    )};
    var statusClass = ${JSON.stringify(
      offer.status === 'accepted' || offer.status === 'declined' || offer.status === 'expired'
        ? 'offer-shell__status offer-shell__status--' + offer.status
        : 'offer-shell__title',
    )};

    document.querySelectorAll('.offer-section--intro').forEach(function (section) {
      var text = (section.textContent || '').replace(/\\u00a0/g, ' ').trim();
      if (!text && !section.querySelector('img, hr, table, ul, ol')) section.remove();
    });

    var senderCopy = document.querySelector('.offer-shell__sender-copy');
    if (senderCopy) {
      senderCopy.querySelectorAll('p').forEach(function (line) {
        if (line.textContent) line.textContent = normalizeBrokenSwedish(line.textContent);
        var text = (line.textContent || '').trim().toLocaleLowerCase('sv-SE');
        if (text.startsWith('ansvarig:') || text.startsWith('kontakt:')) line.remove();
      });
    }

    var customerBlock = document.querySelector('.offer-shell__customer');
    if (customerBlock) {
      var seen = new Set();
      customerBlock.querySelectorAll('p').forEach(function (line) {
        if (line.textContent) line.textContent = normalizeBrokenSwedish(line.textContent);
        var text = (line.textContent || '').trim();
        var key = text.toLocaleLowerCase('sv-SE');
        if (!text || seen.has(key)) line.remove();
        else seen.add(key);
      });
    }

    document.querySelectorAll('.offer-shell__footer > div').forEach(function (item) {
      var labelNode = item.querySelector('strong');
      if (labelNode && labelNode.textContent) labelNode.textContent = normalizeBrokenSwedish(labelNode.textContent);
      item.querySelectorAll('span').forEach(function (span) {
        if (span.textContent) span.textContent = normalizeBrokenSwedish(span.textContent);
      });
      var label = ((labelNode && labelNode.textContent) || '').trim().toLocaleLowerCase('sv-SE');
      if (label === 'prisvisning') item.remove();
    });

    function normalizeOfferText(text) {
      return normalizeBrokenSwedish(text)
        .replace(/Å-pris/g, 'À-pris')
        .replace(/\bA-pris\b/g, 'À-pris')
        .replace(/\u00c3\u0192\u00e2\u20ac\u00a6/g, '\u00c3\u2026')
        .replace(/\u00c3\u0192\u00e2\u20ac\u017e/g, '\u00c3\u201e')
        .replace(/\u00c3\u0192\u00e2\u20ac\u201c/g, '\u00c3\u2013')
        .replace(/\u00c3\u0192\u00c2\u00a5/g, '\u00c3\u00a5')
        .replace(/\u00c3\u0192\u00c2\u00a4/g, '\u00c3\u00a4')
        .replace(/\u00c3\u0192\u00c2\u00b6/g, '\u00c3\u00b6')
        .replace(/\u00c3\u201a\u00c2\u00a0/g, '\\u00a0')
        .replace(/\u00c3\u201a\u00c2\u00b7/g, '\u00c2\u00b7')
        .replace(/\u00c3\u201a(?=[\\u00a0 0-9%.,:;|kr])/g, '');
    }

    function compactDateText(value) {
      var trimmed = normalizeOfferText(value).trim();
      var parts = trimmed.match(/^(\\d{1,2})\\s+([A-Za-zÅÄÖåäö.]+)\\s+(\\d{4})$/);
      if (!parts) return trimmed;

      var monthValue = parts[2].toLocaleLowerCase('sv-SE').replace(/\\.$/, '');
      var monthMap = {
        januari: 0, jan: 0,
        februari: 1, feb: 1,
        mars: 2, mar: 2,
        april: 3, apr: 3,
        maj: 4,
        juni: 5, jun: 5,
        juli: 6, jul: 6,
        augusti: 7, aug: 7,
        september: 8, sep: 8,
        oktober: 9, okt: 9,
        november: 10, nov: 10,
        december: 11, dec: 11
      };
      var monthIndex = monthMap[monthValue];
      if (monthIndex == null) return trimmed;

      var monthsShort = ${JSON.stringify(SWEDISH_MONTHS_SHORT)};
      return String(Number(parts[1])) + ' ' + monthsShort[monthIndex] + ' ' + parts[3];
    }

    document.querySelectorAll('.offer-shell__status, .offer-shell__title').forEach(function (item) {
      item.remove();
    });

    document.querySelectorAll('.offer-summary__row').forEach(function (row) {
      var label = normalizeOfferText((row.querySelector('span')?.textContent || '')).replace(/\\s+/g, ' ').trim().toLocaleLowerCase('sv-SE');
      if (row.classList.contains('offer-summary__row--total')) return;
      if (label.indexOf('delsumma') === 0) row.classList.add('offer-summary__row--subtotal');
      else if (label === 'rabatt') {
        row.classList.add('offer-summary__row--discount');
        var amount = row.querySelector('strong');
        if (amount && !/^[−-]/.test((amount.textContent || '').trim())) {
          amount.textContent = '− ' + (amount.textContent || '').trim();
        }
      } else if (label.indexOf('moms') === 0) row.classList.add('offer-summary__row--vat');
    });

    document.querySelectorAll('.offer-summary').forEach(function (summary) {
      var rows = Array.from(summary.querySelectorAll(':scope > .offer-summary__row'));
      var ordered = rows
        .filter(function (row) { return row.classList.contains('offer-summary__row--subtotal'); })
        .concat(rows.filter(function (row) { return row.classList.contains('offer-summary__row--discount'); }))
        .concat(rows.filter(function (row) { return row.classList.contains('offer-summary__row--vat'); }))
        .concat(rows.filter(function (row) { return row.classList.contains('offer-summary__row--total'); }));
      if (ordered.length === rows.length && ordered.some(function (row, index) { return row !== rows[index]; })) {
        ordered.forEach(function (row) { summary.appendChild(row); });
      }
    });

    document.querySelectorAll('.offer-shell__meta dd').forEach(function (item) {
      var text = item.childNodes.length === 1 ? (item.textContent || '').trim() : '';
      if (!text) return;
      var compact = compactDateText(text);
      if (compact !== text) item.textContent = compact;
    });

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      var node = walker.currentNode;
      node.nodeValue = normalizeOfferText(node.nodeValue || '');
    }
  })();
</script>`;

  const printStyles = PUBLIC_OFFER_PDF_PRINT_STYLES;

  return documentHtml
    .replace('</head>', `${baseTag}\n${printStyles}\n</head>`)
    .replace('</body>', `${signatureScript}\n${behaviorScript}\n</body>`);
}
