'use client';

/**
 * /offers/public/[token]
 *
 * Public offer signing page. Uses project's design system:
 * - framer-motion for transitions & success animation
 * - Shared icons from @shared/ui/icons
 * - Tailwind classes + design tokens
 * - jsPDF + html2canvas for PDF download
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import type SignatureCanvas from 'react-signature-canvas';
import { summarizePersistedOfferPricing } from '@modules/supporting/offers/domain/pricing';
import type { PageState, PublicOffer, SigMode } from './_types/public-offer.types';
import {
  SIG_FONTS,
  fmtDate,
  fmtQuantityWithUnit,
  fmtSEK,
  textToSignatureImage,
  todaySv,
  type SignatureFontId,
} from './_lib/public-offer-formatters';
import {
  applySignatureFields,
  compactDateText,
  findFirstOfferPageIndex,
  findOfferAnchor,
  isPromoPageBlock,
  normalizeOfferText,
  stripLegacyLineItemTables,
} from './_lib/public-offer-document-dom';
import { PUBLIC_OFFER_DOCUMENT_STYLES } from './_lib/public-offer-document-styles';
import {
  PublicOfferApiError,
  declinePublicOffer,
  downloadPublicOfferPdfBlob,
  fetchPublicOffer,
  markPublicOfferViewed,
  signPublicOffer,
} from './_api/public-offer.api';
import { PublicOfferHeader } from './_components/public-offer-header';
import {
  PublicOfferDocumentFrame,
  PublicOfferDocumentLoadingNotice,
} from './_components/public-offer-document-frame';
import { PublicOfferDrawSignatureModal } from './_components/public-offer-draw-signature-modal';
import { PublicOfferFooter } from './_components/public-offer-footer';
import { PublicOfferSigningCard } from './_components/public-offer-signing-card';
import {
  PublicOfferLoadingScreen,
  PublicOfferSigningScreen,
  PublicOfferTerminalScreen,
} from './_components/public-offer-status-screens';

// ─── Animated checkmark (drawn with SVG path animation) ────────────────────────


// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PublicOfferPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [state, setState] = useState<PageState>('loading');
  const [offer, setOffer] = useState<PublicOffer | null>(null);
  const [errMsg, setErrMsg] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [signerName, setSignerName] = useState('');
  const [capturedSignature, setCapturedSignature] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [sigMode, setSigMode] = useState<SigMode>('type');
  const [sigFont, setSigFont] = useState<SignatureFontId>(SIG_FONTS[0].id);
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [drawModalOpen, setDrawModalOpen] = useState(false);
  const [drawModalError, setDrawModalError] = useState('');

  const [documentReady, setDocumentReady] = useState(false);
  const [promoPageCount, setPromoPageCount] = useState(0);

  const sigRef = useRef<SignatureCanvas>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const documentSectionRef = useRef<HTMLElement>(null);
  const signatureFields = useMemo(
    () => {
      if (offer?.status === 'accepted') {
        return {
          image: offer.signatureImage ?? capturedSignature ?? undefined,
          name: offer.signerName ?? (signerName.trim() || undefined),
          date: offer.acceptedAt
            ? fmtDate(offer.acceptedAt)
            : capturedAt
              ? fmtDate(capturedAt)
              : undefined,
        };
      }

      if (capturedSignature) {
        return {
          image: capturedSignature,
          name: signerName.trim() || undefined,
          date: capturedAt ? fmtDate(capturedAt) : todaySv(),
        };
      }

      return undefined;
    },
    [capturedAt, capturedSignature, offer, signerName],
  );
  const iframeDocumentHtml = useMemo(() => {
    if (!offer?.generatedDocument) return '';

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (!origin || /<base\b/i.test(offer.generatedDocument)) {
      return offer.generatedDocument;
    }

    return offer.generatedDocument.includes('</head>')
      ? offer.generatedDocument.replace('</head>', `<base href="${origin}/" />\n</head>`)
      : `<base href="${origin}/" />${offer.generatedDocument}`;
  }, [offer?.generatedDocument]);

  useEffect(() => {
    setDocumentReady(false);
    setPromoPageCount(0);
  }, [iframeDocumentHtml]);

  // The app shell uses a globally locked viewport, but the public signing page
  // needs normal document scrolling so the full offer can be reviewed.
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyHeight = document.body.style.height;
    const prevHtmlHeight = document.documentElement.style.height;

    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.height = prevBodyHeight;
      document.documentElement.style.height = prevHtmlHeight;
    };
  }, []);

  // ── Scroll progress ──────────────────────────────────────────────────────────

  // ── Iframe setup ─────────────────────────────────────────────────────────────
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    const disposers: Array<() => void> = [];

    // Inject base styles inside the iframe
    const responsiveStyle = doc.createElement('style');
    responsiveStyle.textContent = PUBLIC_OFFER_DOCUMENT_STYLES;
    if (doc.head) doc.head.appendChild(responsiveStyle);
    else if (doc.body) doc.body.insertBefore(responsiveStyle, doc.body.firstChild);

    const wrapper = doc.querySelector('.doc-wrapper') as HTMLElement | null;
    // Detect new-format docs (have .page-content; padding lives inside page-block)
    const hasPageContent = !!doc.querySelector('.page-content');
    if (wrapper) {
      wrapper.style.margin = '0 auto';
      wrapper.style.border = 'none';
      wrapper.style.borderRadius = '0';
      // Keep max-width at 816px — the A4 pixel width the document is designed for.
      wrapper.style.maxWidth = '816px';
      wrapper.style.boxShadow = 'none';
      // New-format docs carry their own padding in .page-content
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
      const label = normalizeOfferText(row.querySelector('span')?.textContent ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('sv-SE');
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

    const quantityValues = offer?.lineItems.map((item) => fmtQuantityWithUnit(item.quantity, item.unit)) ?? [];
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
        const label = normalizeOfferText(metric.querySelector('dt')?.textContent ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('sv-SE');
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

    // ── Viewport scaling ───────────────────────────────────────────────────────
    // The document is authored at 816 px. On narrower viewports we scale the
    // entire document down so it fits without horizontal scrolling.
    const DOC_WIDTH = 816;

    const applyViewportLayout = () => {
      if (!doc.documentElement) return 1;

      const containerW = iframe.getBoundingClientRect().width || window.innerWidth;
      const viewportW = window.innerWidth || containerW;
      const scale = Math.min(1, containerW / DOC_WIDTH);
      const isCompactDocument = viewportW < 700;
      const effectiveScale = isCompactDocument ? 1 : scale;

      doc.documentElement.classList.toggle('offer-mobile', isCompactDocument);

      if (effectiveScale < 1) {
        doc.documentElement.style.width = `${DOC_WIDTH}px`;
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

    // Re-measure once all images have loaded
    const images = doc.querySelectorAll('img');
    if (images.length > 0) {
      let loadedCount = 0;
      const onLoad = () => { if (++loadedCount === images.length) resize(); };
      images.forEach((img) => {
        if (img.complete) onLoad();
        else { img.addEventListener('load', onLoad); img.addEventListener('error', onLoad); }
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
  }, [offer?.lineItems, signatureFields]);

  // ── Draw canvas resize ───────────────────────────────────────────────────────
  useEffect(() => {
    if (sigMode !== 'draw' || !drawModalOpen) return;
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;
    const syncSize = () => {
      const canvas = wrapper.querySelector('canvas');
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(wrapper.getBoundingClientRect().width);
      const h = 220;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        const prev = sigRef.current && !sigRef.current.isEmpty()
          ? sigRef.current.getTrimmedCanvas().toDataURL('image/png')
          : drawnSignature;
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
        if (prev && sigRef.current) sigRef.current.fromDataURL(prev, { width: w, height: h });
      }
    };
    const raf = requestAnimationFrame(syncSize);
    const ro = new ResizeObserver(syncSize);
    ro.observe(wrapper);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [drawModalOpen, drawnSignature, sigMode, state]);

  // ── Fetch offer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const o = await fetchPublicOffer(token);
        setOffer(o);
        setSignerName(o.recipientName ?? '');
        if (o.status === 'accepted') setState('accepted');
        else if (o.status === 'declined') setState('declined');
        else if (o.publicTokenExpiresAt && new Date(o.publicTokenExpiresAt) < new Date()) setState('expired');
        else setState('ready');
      } catch (e) {
        if (e instanceof PublicOfferApiError && (e.status === 404 || e.status === 410)) {
          setState('expired');
          return;
        }
        setErrMsg((e as Error).message);
        setState('error');
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token || !offer) return;
    if (offer.status !== 'sent' || offer.viewedAt) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void markPublicOfferViewed(token, controller.signal).catch(() => {
        // Best effort only; the document should still remain usable if this fails.
      });
    }, 1200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [offer, token]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const typedSignatureText = signerName.trim();

  const getSignatureImage = useCallback((): string | null => {
    if (sigMode === 'draw') {
      return drawnSignature;
    }
    if (!typedSignatureText) return null;
    const f = SIG_FONTS.find((x) => x.id === sigFont) ?? SIG_FONTS[0];
    return textToSignatureImage(typedSignatureText, f.family);
  }, [drawnSignature, sigFont, sigMode, typedSignatureText]);

  const openDrawModal = useCallback(() => {
    setSigMode('draw');
    setDrawModalError('');
    setDrawModalOpen(true);
  }, []);

  const closeDrawModal = useCallback(() => {
    setDrawModalError('');
    setDrawModalOpen(false);
  }, []);

  const clearSavedDrawSignature = useCallback(() => {
    setDrawnSignature(null);
    setDrawModalError('');
  }, []);

  const clearDrawCanvas = useCallback(() => {
    sigRef.current?.clear();
    setDrawModalError('');
  }, []);

  const saveDrawSignature = useCallback(() => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setDrawModalError('Rita din namnteckning innan du sparar.');
      return;
    }

    setDrawnSignature(sigRef.current.getTrimmedCanvas().toDataURL('image/png'));
    setDrawModalError('');
    setDrawModalOpen(false);
  }, []);

  const handleSign = useCallback(async () => {
    if (!signerName.trim()) { setErrMsg('Ange ditt fullständiga namn.'); return; }
    const signatureImage = getSignatureImage();
    if (!signatureImage) { setErrMsg(sigMode === 'draw' ? 'Rita din namnteckning i rutan.' : 'Skriv din namnteckning.'); return; }
    setBusy(true); setErrMsg('');
    setState('signing');
    try {
      await signPublicOffer(token, { signatureImage, signerName: signerName.trim() });
      const acceptedAt = new Date().toISOString();
      setOffer((current) => current ? ({
        ...current,
        status: 'accepted',
        acceptedAt,
        signerName: signerName.trim(),
        signatureImage,
      }) : current);
      await new Promise((r) => setTimeout(r, 600));
      setCapturedSignature(signatureImage);
      setCapturedAt(new Date().toISOString());
      setState('accepted');
    } catch (e) { setErrMsg((e as Error).message); setState('ready'); } finally { setBusy(false); }
  }, [token, signerName, getSignatureImage, sigMode]);

  const handleDecline = useCallback(async () => {
    setBusy(true); setErrMsg('');
    try {
      await declinePublicOffer(token, { comment: comment.trim() || undefined });
      setState('declined');
    } catch (e) { setErrMsg((e as Error).message); } finally { setBusy(false); }
  }, [token, comment]);

  const handleDownloadPdf = async () => {
    if (!offer?.generatedDocument) return;
    setDownloading(true);
    const previewWindow = window.open('', '_blank');
    try {
      const blob = await downloadPublicOfferPdfBlob(token);
      const objectUrl = URL.createObjectURL(blob);
      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.href = objectUrl;
      }
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${offer.title || 'offert'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      previewWindow?.close();
      setErrMsg('Kunde inte ladda ner PDF. Försök igen.');
    } finally {
      window.setTimeout(() => setDownloading(false), 250);
    }
  };

  // ─── Derived state ───────────────────────────────────────────────────────────
  const selectedFont = SIG_FONTS.find((f) => f.id === sigFont) ?? SIG_FONTS[0];

  // ─── Status pages ────────────────────────────────────────────────────────────

  if (state === 'loading') {
    return <PublicOfferLoadingScreen />;
  }

  // Terminal status screens
  if (state === 'expired' || state === 'error' || state === 'accepted' || state === 'declined') {
    return (
      <PublicOfferTerminalScreen
        state={state}
        hasGeneratedDocument={!!offer?.generatedDocument}
        downloading={downloading}
        onDownloadPdf={() => void handleDownloadPdf()}
      />
    );
  }

  // Signing in-progress overlay
  if (state === 'signing') {
    return <PublicOfferSigningScreen />;
  }

  if (!offer) return null;
  const isDecline = state === 'declining';
  const pricing = summarizePersistedOfferPricing(offer);
  const hasPromoHero = promoPageCount > 0;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#edf3fb_42%,_#e8eef8_100%)]"
    >
      <PublicOfferHeader
        title={offer.title}
        recipientName={offer.recipientName}
        recipientCompany={offer.recipientCompany}
        totalLabel={fmtSEK(pricing.totalAmount)}
        displayModeLabel={pricing.displayModeLabel}
        validUntilLabel={fmtDate(offer.validUntil)}
        hasGeneratedDocument={!!offer.generatedDocument}
        hasPromoHero={hasPromoHero}
        downloading={downloading}
        onDownloadPdf={() => void handleDownloadPdf()}
      />

      {/* ─── Content ─── */}
      <main
        ref={mainRef}
        className="bg-transparent pb-8 sm:pb-24"
      >
        <div className="mx-auto max-w-[1040px] overflow-x-hidden px-0 sm:px-6 sm:pt-2">

        {offer.generatedDocument && (
          <PublicOfferDocumentFrame
            sectionRef={documentSectionRef}
            iframeRef={iframeRef}
            srcDoc={iframeDocumentHtml}
            hasPromoPages={promoPageCount > 0}
            onLoad={handleIframeLoad}
          />
        )}

        {/* ─── Signing card ─── */}
        <div className="px-4 sm:px-0">
        {offer.generatedDocument && !documentReady && (
          <PublicOfferDocumentLoadingNotice />
        )}
        {(!offer.generatedDocument || documentReady) && (
          <PublicOfferSigningCard
            isDecline={isDecline}
            errMsg={errMsg}
            totalAmountLabel={fmtSEK(pricing.totalAmount)}
            displayModeLabel={pricing.displayModeLabel}
            signerName={signerName}
            onSignerNameChange={setSignerName}
            dateLabel={todaySv()}
            sigMode={sigMode}
            onUseTypedSignature={() => setSigMode('type')}
            onOpenDrawModal={openDrawModal}
            sigFonts={SIG_FONTS}
            activeFontId={sigFont}
            onFontChange={(id) => setSigFont(id as SignatureFontId)}
            typedSignatureText={typedSignatureText}
            selectedFontFamily={selectedFont.family}
            drawnSignature={drawnSignature}
            onClearSavedDrawSignature={clearSavedDrawSignature}
            onStartDecline={() => setState('declining')}
            onSign={() => void handleSign()}
            busy={busy}
            comment={comment}
            onCommentChange={setComment}
            onCancelDecline={() => { setState('ready'); setErrMsg(''); }}
            onDecline={() => void handleDecline()}
          />
        )}
        </div>

        <PublicOfferDrawSignatureModal
          open={drawModalOpen}
          error={drawModalError}
          canvasWrapperRef={canvasWrapperRef}
          signatureRef={sigRef}
          onClose={closeDrawModal}
          onClear={clearDrawCanvas}
          onSave={saveDrawSignature}
        />

        <PublicOfferFooter
          validUntilLabel={fmtDate(offer.validUntil)}
          recipientEmail={offer.recipientEmail}
        />
        </div>
      </main>

    </motion.div>
  );
}
