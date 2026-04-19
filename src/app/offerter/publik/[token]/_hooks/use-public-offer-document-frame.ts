import { useCallback } from 'react';
import type { PublicOfferLineItem, SignatureFields } from '../_types/public-offer.types';
import { fmtQuantityWithUnit } from '../_lib/public-offer-formatters';
import {
  applySignatureFields,
  compactDateText,
  findFirstOfferPageIndex,
  findOfferAnchor,
  isPromoPageBlock,
  normalizeOfferText,
  stripLegacyLineItemTables,
} from '../_lib/public-offer-document-dom';
import { PUBLIC_OFFER_DOCUMENT_STYLES } from '../_lib/public-offer-document-styles';

type PublicOfferDocumentFrameRef = {
  current: HTMLIFrameElement | null;
};

export function usePublicOfferDocumentFrame({
  iframeRef,
  lineItems,
  signatureFields,
  setDocumentReady,
  setPromoPageCount,
}: {
  iframeRef: PublicOfferDocumentFrameRef;
  lineItems: PublicOfferLineItem[] | undefined;
  signatureFields: SignatureFields | undefined;
  setDocumentReady: (ready: boolean) => void;
  setPromoPageCount: (count: number) => void;
}) {
  return useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    const disposers: Array<() => void> = [];

    const responsiveStyle = doc.createElement('style');
    responsiveStyle.textContent = PUBLIC_OFFER_DOCUMENT_STYLES;
    if (doc.head) doc.head.appendChild(responsiveStyle);
    else if (doc.body) doc.body.insertBefore(responsiveStyle, doc.body.firstChild);

    const wrapper = doc.querySelector('.doc-wrapper') as HTMLElement | null;
    const hasPageContent = !!doc.querySelector('.page-content');
    if (wrapper) {
      wrapper.style.margin = '0 auto';
      wrapper.style.border = 'none';
      wrapper.style.borderRadius = '0';
      wrapper.style.maxWidth = '816px';
      wrapper.style.boxShadow = 'none';
      wrapper.style.padding = hasPageContent ? '0' : '40px 48px';
    }
    doc.body.style.margin = '0';
    doc.body.style.padding = '0';
    doc.body.style.overflow = 'hidden';

    applySignatureFields(doc, signatureFields);

    const pageBlocks = Array.from(doc.querySelectorAll<HTMLElement>('.page-block'));
    const explicitDocumentPage = doc.querySelector<HTMLElement>('.page-block--document');
    const firstDocumentIndex = explicitDocumentPage
      ? pageBlocks.indexOf(explicitDocumentPage)
      : findFirstOfferPageIndex(pageBlocks);
    const firstDocumentPage = pageBlocks[firstDocumentIndex] ?? pageBlocks[0] ?? null;
    const firstOfferAnchor = findOfferAnchor(firstDocumentPage);
    setPromoPageCount(Math.max(0, firstDocumentIndex));
    pageBlocks.forEach((pageBlock, index) => {
      const promoBlock = index < firstDocumentIndex && isPromoPageBlock(pageBlock);
      pageBlock.classList.toggle('public-offer-promo', promoBlock);
      pageBlock.classList.toggle('public-offer-primary', index === firstDocumentIndex);
    });
    wrapper?.classList.toggle('doc-wrapper--with-promo', firstDocumentIndex > 0);
    firstOfferAnchor?.setAttribute('data-public-offer-anchor', 'true');
    if (!firstOfferAnchor && firstDocumentPage) {
      firstDocumentPage.setAttribute('data-public-offer-anchor', 'true');
    }

    doc.querySelectorAll<HTMLElement>('.offer-section--intro').forEach((section) => {
      const text = section.textContent?.replace(/\u00a0/g, ' ').trim() ?? '';
      const hasVisualContent = !!section.querySelector('img, table, hr, ul, ol, blockquote');
      if (!text && !hasVisualContent) section.remove();
    });

    const senderCopy = doc.querySelector<HTMLElement>('.offer-shell__sender-copy');
    senderCopy?.querySelectorAll('p').forEach((line) => {
      const text = line.textContent?.trim().toLocaleLowerCase('sv-SE') ?? '';
      if (text.startsWith('ansvarig:') || text.startsWith('kontakt:')) line.remove();
    });

    const customerBlock = doc.querySelector<HTMLElement>('.offer-shell__customer');
    if (customerBlock) {
      const seen = new Set<string>();
      customerBlock.querySelectorAll('p').forEach((line) => {
        const text = line.textContent?.trim() ?? '';
        const key = text.toLocaleLowerCase('sv-SE');
        if (!text || seen.has(key)) {
          line.remove();
          return;
        }
        seen.add(key);
      });
    }

    doc.querySelectorAll<HTMLElement>('.offer-shell__footer > div').forEach((item) => {
      const label = item.querySelector('strong')?.textContent?.trim().toLocaleLowerCase('sv-SE') ?? '';
      if (label === 'prisvisning') item.remove();
    });

    doc.querySelectorAll<HTMLElement>('.offer-summary__row').forEach((row) => {
      const label = normalizeOfferText(row.querySelector('span')?.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLocaleLowerCase('sv-SE');
      if (row.classList.contains('offer-summary__row--total')) return;
      if (label.startsWith('delsumma')) row.classList.add('offer-summary__row--subtotal');
      else if (label === 'rabatt') {
        row.classList.add('offer-summary__row--discount');
        const amount = row.querySelector('strong');
        if (amount && !/^[−-]/.test(amount.textContent?.trim() ?? '')) {
          amount.textContent = `− ${amount.textContent?.trim() ?? ''}`;
        }
      } else if (label.startsWith('moms')) row.classList.add('offer-summary__row--vat');
    });

    doc.querySelectorAll<HTMLElement>('.offer-summary').forEach((summary) => {
      const rows = Array.from(summary.querySelectorAll<HTMLElement>(':scope > .offer-summary__row'));
      const ordered = [
        ...rows.filter((row) => row.classList.contains('offer-summary__row--subtotal')),
        ...rows.filter((row) => row.classList.contains('offer-summary__row--discount')),
        ...rows.filter((row) => row.classList.contains('offer-summary__row--vat')),
        ...rows.filter((row) => row.classList.contains('offer-summary__row--total')),
      ];

      if (ordered.length === rows.length && ordered.some((row, index) => row !== rows[index])) {
        ordered.forEach((row) => summary.appendChild(row));
      }
    });

    doc.querySelectorAll<HTMLElement>('.offer-shell__status, .offer-shell__title').forEach((item) => item.remove());

    doc.querySelectorAll<HTMLElement>('.offer-shell__meta dd').forEach((item) => {
      const text = item.childNodes.length === 1 ? (item.textContent?.trim() ?? '') : '';
      if (!text) return;
      const compact = compactDateText(text);
      if (compact !== text) item.textContent = compact;
    });

    const quantityValues = lineItems?.map((item) => fmtQuantityWithUnit(item.quantity, item.unit)) ?? [];
    doc.querySelectorAll<HTMLElement>('.offer-item-row').forEach((row, index) => {
      const quantityValue = quantityValues[index];
      if (!quantityValue) return;
      const quantityCell = row.querySelector<HTMLElement>('.offer-item-row__value');
      if (quantityCell) quantityCell.textContent = quantityValue;
    });
    doc.querySelectorAll<HTMLElement>('.offer-item-card').forEach((card, index) => {
      const quantityValue = quantityValues[index];
      if (!quantityValue) return;
      const quantityMetric = Array.from(card.querySelectorAll<HTMLElement>('.offer-item-card__metric')).find((metric) => {
        const label = normalizeOfferText(metric.querySelector('dt')?.textContent ?? '')
          .replace(/\s+/g, ' ')
          .trim()
          .toLocaleLowerCase('sv-SE');
        return label === 'antal';
      });
      const valueNode = quantityMetric?.querySelector<HTMLElement>('dd');
      if (valueNode) valueNode.textContent = quantityValue;
    });

    stripLegacyLineItemTables(doc);

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const value = node.nodeValue ?? '';
      const normalized = normalizeOfferText(value);
      if (normalized !== value) node.nodeValue = normalized;
    }

    const docWidth = 816;

    const applyViewportLayout = () => {
      if (!doc.documentElement) return 1;

      const containerW = iframe.getBoundingClientRect().width || window.innerWidth;
      const viewportW = window.innerWidth || containerW;
      const scale = Math.min(1, containerW / docWidth);
      const isCompactDocument = viewportW < 700;
      const effectiveScale = isCompactDocument ? 1 : scale;

      doc.documentElement.classList.toggle('offer-mobile', isCompactDocument);

      if (effectiveScale < 1) {
        doc.documentElement.style.width = `${docWidth}px`;
        doc.documentElement.style.transformOrigin = 'top left';
        doc.documentElement.style.transform = `scale(${effectiveScale})`;
        doc.documentElement.style.overflowX = 'hidden';
      } else {
        doc.documentElement.style.width = '';
        doc.documentElement.style.transformOrigin = '';
        doc.documentElement.style.transform = '';
        doc.documentElement.style.overflowX = '';
      }

      return effectiveScale;
    };

    const resize = () => {
      if (!doc.documentElement) return;
      const effectiveScale = applyViewportLayout();
      iframe.style.height = 'auto';
      requestAnimationFrame(() => {
        if (!doc.documentElement) return;
        const naturalH = Math.max(
          doc.documentElement.scrollHeight,
          doc.body?.scrollHeight ?? 0,
          wrapper?.scrollHeight ?? 0,
        );
        const renderedH = Math.max(
          doc.documentElement.getBoundingClientRect().height,
          doc.body?.getBoundingClientRect().height ?? 0,
          wrapper?.getBoundingClientRect().height ?? 0,
        );
        const targetHeight = effectiveScale < 1
          ? Math.max(Math.ceil(naturalH * effectiveScale), Math.ceil(renderedH))
          : Math.max(naturalH, Math.ceil(renderedH));
        iframe.style.height = `${targetHeight}px`;
        setDocumentReady(true);
      });
    };
    resize();
    window.setTimeout(resize, 120);
    window.setTimeout(resize, 420);

    const images = doc.querySelectorAll('img');
    if (images.length > 0) {
      let loadedCount = 0;
      const onLoad = () => { if (++loadedCount === images.length) resize(); };
      images.forEach((img) => {
        if (img.complete) onLoad();
        else {
          img.addEventListener('load', onLoad);
          img.addEventListener('error', onLoad);
        }
      });
    } else {
      resize();
    }
    const mutationObserver = new MutationObserver(resize);
    mutationObserver.observe(doc.body, { childList: true, subtree: true, attributes: true });
    disposers.push(() => mutationObserver.disconnect());

    if ('ResizeObserver' in window && wrapper) {
      const resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(wrapper);
      disposers.push(() => resizeObserver.disconnect());
    }

    const handleViewportResize = () => resize();
    window.addEventListener('resize', handleViewportResize);
    disposers.push(() => window.removeEventListener('resize', handleViewportResize));

    return () => {
      disposers.forEach((dispose) => dispose());
    };
  }, [iframeRef, lineItems, setDocumentReady, setPromoPageCount, signatureFields]);
}
