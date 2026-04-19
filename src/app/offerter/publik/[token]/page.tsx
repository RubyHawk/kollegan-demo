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
    responsiveStyle.textContent = `
      html, body {
        background: #ffffff !important;
        color: #14263f !important;
        font-family: Aptos, "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
      }
      *, *::before, *::after { box-sizing: border-box; }
      img { max-width: 100% !important; display: block; }
      img:not([style*="height:"]) { height: auto; }
      table { max-width: 100% !important; width: 100%; table-layout: fixed; }
      td, th { word-break: break-word; overflow-wrap: break-word; }
      pre, code { white-space: pre-wrap !important; word-break: break-word !important; overflow-x: hidden !important; }
      .doc-wrapper { padding-bottom: 0 !important; background: #ffffff !important; }
      .page-separator { display: none !important; }
      .page-block {
        margin: 0 !important;
        overflow: hidden !important;
        background: #ffffff !important;
      }
      .page-content--document {
        min-height: 920px !important;
        padding: 36px 40px 34px !important;
        background: #ffffff !important;
      }
      .page-block--document {
        border: none !important;
        border-radius: 0 !important;
        background: #ffffff !important;
        box-shadow: none !important;
      }
      .offer-shell {
        gap: 18px !important;
        color: #14263f !important;
        font-family: Aptos, "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
      }
      .offer-shell__header, .offer-shell__topline { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(208px, 244px) !important; gap: 16px !important; align-items: flex-start !important; }
      .offer-shell__header { padding-bottom: 18px !important; border-bottom: 1px solid #d9e3ee !important; }
      .offer-shell__sender { gap: 12px !important; align-items: flex-start !important; }
      .offer-shell__logo { width: 48px !important; height: 48px !important; }
      .offer-shell__sender-copy { display: grid !important; gap: 3px !important; font-size: 12.5px !important; line-height: 1.55 !important; color: #465a73 !important; }
      .offer-shell__sender-name { color: #10233b !important; font-weight: 700 !important; }
      .offer-shell__meta { min-width: 0 !important; display: grid !important; gap: 8px !important; justify-items: end !important; text-align: right !important; }
      .offer-shell__status { display: none !important; }
      .offer-shell__status--draft { background: #e2e8f0 !important; color: #334155 !important; }
      .offer-shell__status--sent, .offer-shell__status--viewed { background: #dbeafe !important; color: #1d4ed8 !important; }
      .offer-shell__status--accepted { background: #dcfce7 !important; color: #166534 !important; }
      .offer-shell__status--declined { background: #fee2e2 !important; color: #b91c1c !important; }
      .offer-shell__status--expired { background: #f3f4f6 !important; color: #6b7280 !important; }
      .offer-shell__meta dl { display: grid !important; gap: 6px !important; width: 100% !important; }
      .offer-shell__meta dl div { display: grid !important; grid-template-columns: minmax(0, 1fr) auto !important; justify-content: flex-end !important; gap: 10px !important; padding: 4px 0 !important; border-bottom: 1px solid #edf2f7 !important; }
      .offer-shell__meta dl div:first-child { padding-top: 0 !important; }
      .offer-shell__meta dl div:last-child { padding-bottom: 0 !important; border-bottom: none !important; }
      .offer-shell__meta dt { font-size: 10px !important; line-height: 1.35 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; color: #6b7e95 !important; }
      .offer-shell__meta dd { font-size: 12.5px !important; line-height: 1.35 !important; font-weight: 700 !important; color: #10233b !important; white-space: nowrap !important; }
      .offer-shell__meta dd small { display: block !important; margin-top: 2px !important; font-size: 11px !important; line-height: 1.35 !important; font-weight: 500 !important; color: #5f738a !important; }
      .offer-shell__meta .offer-shell__meta-row--recipient dd { white-space: normal !important; }
      .offer-shell__topline { padding-bottom: 18px !important; border-bottom: 1px solid #d9e3ee !important; }
      .offer-shell__topline h1 { font-size: 22px !important; line-height: 1.22 !important; color: #10233b !important; letter-spacing: -0.02em !important; }
      .offer-shell__customer { min-width: 0 !important; display: grid !important; gap: 4px !important; padding-left: 14px !important; border-left: 1px solid #dce6f0 !important; font-size: 13px !important; line-height: 1.6 !important; color: #465a73 !important; }
      .offer-section { gap: 10px !important; }
      .offer-section h2, .offer-section h3 { font-size: 12px !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; color: #6b7e95 !important; }
      .offer-table-header h2 { font-size: 24px !important; line-height: 1.18 !important; letter-spacing: -0.03em !important; text-transform: none !important; color: #10233b !important; }
      .offer-section p { font-size: 14px !important; line-height: 1.8 !important; color: #34485f !important; }
      .offer-section--terms,
      .offer-section--notes {
        margin-top: 14px !important;
        padding: 16px 18px !important;
        border: 1px solid #d9e3ee !important;
        border-radius: 14px !important;
        background: #ffffff !important;
      }
      .offer-summary { width: min(272px, 100%) !important; border: 1px solid #d9e3ee !important; border-radius: 14px !important; background: #ffffff !important; padding: 0 !important; gap: 0 !important; overflow: hidden !important; box-shadow: none !important; }
      .offer-summary--below { width: min(388px, 100%) !important; margin-top: 16px !important; margin-left: auto !important; }
      .offer-summary__row { font-size: 13px !important; padding: 12px 16px !important; border-bottom: 1px solid #e5ecf3 !important; color: #465a73 !important; align-items: baseline !important; line-height: 1.55 !important; }
      .offer-summary__row span { font-weight: 600 !important; color: #5b7088 !important; }
      .offer-summary__row strong { color: #10233b !important; font-weight: 700 !important; white-space: nowrap !important; }
      .offer-summary__row--subtotal { background: linear-gradient(180deg, #f8fbff 0%, #fdfefe 100%) !important; }
      .offer-summary__row--subtotal span,
      .offer-summary__row--subtotal strong { color: #10233b !important; font-weight: 800 !important; }
      .offer-summary__row--discount { background: #fff6f5 !important; }
      .offer-summary__row--discount span,
      .offer-summary__row--discount strong { color: #b42318 !important; }
      .offer-summary__row--vat span { color: #42576f !important; }
      .offer-summary__row--total {
        margin-top: 0 !important;
        padding: 15px 16px 14px !important;
        border-top: 1px solid #142742 !important;
        border-bottom: none !important;
        background: linear-gradient(135deg, #13233a 0%, #223b63 100%) !important;
        color: #eff6ff !important;
        font-size: 15px !important;
      }
      .offer-summary__row--total,
      .offer-summary__row--total strong,
      .offer-summary__row--total span {
        color: #ffffff !important;
      }
      .offer-summary__row--total span { font-size: 12px !important; font-weight: 700 !important; letter-spacing: 0.02em !important; text-transform: uppercase !important; }
      .offer-summary__row--total strong { font-size: 22px !important; letter-spacing: -0.03em !important; }
      .offer-shell__footer { grid-template-columns: minmax(0, 1.35fr) repeat(2, minmax(0, 1fr)) !important; gap: 14px !important; padding-top: 16px !important; margin-top: 18px !important; border-top: 1px solid #dce6f0 !important; }
      .offer-shell__footer div { font-size: 13px !important; line-height: 1.6 !important; color: #465a73 !important; }
      .offer-shell__footer strong { color: #10233b !important; }
      .offer-items { display: grid !important; gap: 14px !important; }
      .offer-items__table { display: block !important; border: 1px solid #d9e3ee !important; border-radius: 14px !important; background: #ffffff !important; overflow: hidden !important; box-shadow: none !important; }
      .offer-items__head, .offer-item-row { display: grid !important; grid-template-columns: var(--offer-columns) !important; align-items: start !important; }
      .offer-items__head { gap: 14px !important; padding: 12px 16px !important; background: linear-gradient(180deg, #f7faff 0%, #edf3fb 100%) !important; border-bottom: 1px solid #d9e4ef !important; color: #6b7e95 !important; font-size: 10.5px !important; font-weight: 700 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; }
      .offer-item-row { gap: 14px !important; padding: 16px !important; border-bottom: 1px solid #edf2f7 !important; }
      .offer-item-row:last-child { border-bottom: none !important; }
      .offer-item-row__product { display: grid !important; gap: 6px !important; min-width: 0 !important; }
      .offer-item-row__title { font-size: 16px !important; line-height: 1.36 !important; font-weight: 700 !important; color: #10233b !important; }
      .offer-item-row__detail { font-size: 13px !important; line-height: 1.78 !important; color: #5f738a !important; }
      .offer-item-row__value { text-align: right !important; font-size: 14px !important; line-height: 1.55 !important; color: #42576f !important; }
      .offer-item-row__value--strong { font-weight: 700 !important; color: #10233b !important; }
      .offer-items__cards { display: none !important; }
      .offer-item-card { border: 1px solid #d7e2ee !important; border-radius: 20px !important; background: #ffffff !important; overflow: hidden !important; box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06) !important; }
      .offer-item-card__top { display: grid !important; gap: 6px !important; padding: 16px 16px 14px !important; background: linear-gradient(180deg, #fcfdff 0%, #f5f9ff 100%) !important; border-bottom: 1px solid #edf2f7 !important; }
      .offer-item-card__eyebrow { font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; color: #7d90a6 !important; }
      .offer-item-card__title { font-size: 16px !important; line-height: 1.35 !important; font-weight: 700 !important; color: #10233b !important; }
      .offer-item-card__detail { font-size: 13px !important; line-height: 1.72 !important; color: #5f738a !important; }
      .offer-item-card__grid { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 0 !important; margin: 0 !important; }
      .offer-item-card__metric { display: grid !important; justify-items: center !important; align-content: center !important; gap: 7px !important; min-height: 78px !important; padding: 14px 12px 13px !important; text-align: center !important; background: #ffffff !important; }
      .offer-item-card__metric dt, .offer-item-card__metric dd { margin: 0 !important; }
      .offer-item-card__metric dt { font-size: 11px !important; font-weight: 700 !important; letter-spacing: 0.06em !important; text-transform: uppercase !important; color: #7d90a6 !important; }
      .offer-item-card__metric dd { text-align: center !important; font-size: 14px !important; font-weight: 700 !important; color: #10233b !important; }
      .offer-item-card__metric:not(.offer-item-card__metric--total):not(.offer-item-card__metric--full):nth-child(odd) { border-right: 1px solid #edf2f7 !important; }
      .offer-item-card__metric:nth-child(n + 3):not(.offer-item-card__metric--total) { border-top: 1px solid #edf2f7 !important; }
      .offer-item-card__metric--full { grid-column: 1 / -1 !important; border-top: 1px solid #edf2f7 !important; }
      .offer-item-card__metric--total {
        grid-column: 1 / -1 !important;
        gap: 8px !important;
        min-height: 0 !important;
        padding: 16px 14px 15px !important;
        border-top: 1px solid #142742 !important;
        background: linear-gradient(135deg, #13233a 0%, #223b63 100%) !important;
      }
      .offer-item-card__metric--total dt,
      .offer-item-card__metric--total dd {
        color: #ffffff !important;
      }
      .offer-item-card__metric--total dd { font-size: 18px !important; font-weight: 800 !important; letter-spacing: -0.02em !important; }
      html.offer-mobile {
        background:
          radial-gradient(circle at top, #fefefe 0%, #eef3fb 46%, #e7eef8 100%) !important;
      }
      html.offer-mobile body {
        background: transparent !important;
      }
      html.offer-mobile .doc-wrapper {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }
      html.offer-mobile .page-block {
        position: relative !important;
      }
      html.offer-mobile .public-offer-promo {
        margin: 0 !important;
        border: none !important;
        border-radius: 0 !important;
        overflow: hidden !important;
        background: #08162d !important;
        box-shadow: none !important;
      }
      html.offer-mobile .public-offer-promo .page-content,
      html.offer-mobile .public-offer-promo .page-content--edge-to-edge {
        position: relative !important;
        min-height: min(100dvh, 860px) !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      html.offer-mobile .public-offer-promo .page-content::after,
      html.offer-mobile .public-offer-promo .page-content--edge-to-edge::after {
        content: '' !important;
        position: absolute !important;
        inset: 0 !important;
        background:
          linear-gradient(180deg, rgba(7, 18, 37, 0.26) 0%, rgba(7, 18, 37, 0.06) 28%, rgba(7, 18, 37, 0.72) 84%, rgba(7, 18, 37, 0.92) 100%) !important;
        pointer-events: none !important;
      }
      html.offer-mobile .public-offer-promo .page-content > div[style*="position:absolute"],
      html.offer-mobile .public-offer-promo .page-content--edge-to-edge > div[style*="position:absolute"] {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        line-height: 0 !important;
      }
      html.offer-mobile .public-offer-promo .page-content > div[style*="position:absolute"] img,
      html.offer-mobile .public-offer-promo .page-content--edge-to-edge > div[style*="position:absolute"] img {
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        object-fit: cover !important;
        object-position: center !important;
        border-radius: 0 !important;
      }
      html.offer-mobile .public-offer-primary {
        position: relative !important;
        z-index: 2 !important;
        margin-top: -112px !important;
      }
      html.offer-mobile .public-offer-primary .page-content,
      html.offer-mobile .public-offer-primary .page-content--document {
        position: relative !important;
        padding: 32px 18px 30px !important;
        border-radius: 34px 34px 0 0 !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), #f6f9fd 100%) !important;
        border-top: 1px solid rgba(255, 255, 255, 0.92) !important;
        box-shadow: 0 -18px 48px rgba(8, 21, 45, 0.16) !important;
      }
      html.offer-mobile .public-offer-primary .page-content::before,
      html.offer-mobile .public-offer-primary .page-content--document::before {
        content: '' !important;
        position: absolute !important;
        top: -18px !important;
        left: 22px !important;
        right: 22px !important;
        height: 54px !important;
        border-radius: 999px !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0)) !important;
        opacity: 0.92 !important;
        pointer-events: none !important;
        filter: blur(6px) !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell {
        gap: 18px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__header,
      html.offer-mobile .public-offer-primary .offer-shell__topline {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 14px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__sender {
        gap: 12px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__logo {
        width: 54px !important;
        height: 54px !important;
        border-radius: 16px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__sender-copy {
        gap: 3px !important;
        font-size: 14px !important;
        line-height: 1.55 !important;
        color: #5e7293 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta {
        justify-items: start !important;
        text-align: left !important;
        gap: 10px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl {
        width: 100% !important;
        gap: 10px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl div {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        align-items: end !important;
        gap: 10px !important;
        padding-bottom: 10px !important;
        border-bottom: 1px solid rgba(145, 166, 201, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl div:last-child {
        border-bottom: none !important;
        padding-bottom: 0 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dt {
        font-size: 11px !important;
        line-height: 1.4 !important;
        letter-spacing: 0.14em !important;
        text-transform: uppercase !important;
        color: #8ca0c0 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dd {
        font-size: 15px !important;
        line-height: 1.35 !important;
        font-weight: 700 !important;
        color: #10203c !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__topline {
        padding-bottom: 16px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__topline h1 {
        font-size: 30px !important;
        line-height: 0.98 !important;
        letter-spacing: -0.04em !important;
        max-width: 11ch !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__customer {
        display: grid !important;
        gap: 4px !important;
        padding-left: 0 !important;
        border-left: none !important;
        padding-top: 14px !important;
        border-top: 1px solid rgba(145, 166, 201, 0.18) !important;
        font-size: 14px !important;
        line-height: 1.6 !important;
        color: #5e7293 !important;
      }
      html.offer-mobile .public-offer-primary .offer-section {
        gap: 10px !important;
      }
      html.offer-mobile .public-offer-primary .offer-section p {
        font-size: 14px !important;
        line-height: 1.78 !important;
        color: #546783 !important;
      }
      html.offer-mobile .public-offer-primary .offer-section h2,
      html.offer-mobile .public-offer-primary .offer-items > h2 {
        font-size: 30px !important;
        line-height: 1.02 !important;
        letter-spacing: -0.04em !important;
        color: #10203c !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary {
        position: relative !important;
        width: 100% !important;
        margin-top: 20px !important;
        margin-left: 0 !important;
        padding: 14px 0 4px !important;
        border: 1px solid rgba(174, 191, 219, 0.32) !important;
        border-radius: 28px !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.96)) !important;
        box-shadow: 0 22px 46px rgba(11, 24, 47, 0.1) !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary::before {
        content: 'Summering' !important;
        display: block !important;
        padding: 0 18px 10px !important;
        font-size: 11px !important;
        font-weight: 800 !important;
        letter-spacing: 0.14em !important;
        text-transform: uppercase !important;
        color: #7890b3 !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row {
        padding: 12px 18px !important;
        font-size: 15px !important;
        color: #5a6d8a !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row strong {
        font-size: 17px !important;
        color: #10203c !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row + .offer-summary__row {
        border-top: 1px solid rgba(174, 191, 219, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row--total {
        margin-top: 10px !important;
        padding: 16px 18px 18px !important;
        background: #12213d !important;
        color: #dce8fb !important;
        border-top: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row--total strong {
        font-size: 24px !important;
        letter-spacing: -0.04em !important;
        color: #ffffff !important;
      }
      html.offer-mobile .public-offer-primary .offer-items {
        gap: 18px !important;
      }
      html.offer-mobile .public-offer-primary .offer-items__cards {
        gap: 18px !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card {
        border: 1px solid rgba(174, 191, 219, 0.26) !important;
        border-radius: 30px !important;
        background: rgba(255, 255, 255, 0.97) !important;
        box-shadow: 0 18px 42px rgba(12, 24, 47, 0.08) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child {
        border-color: rgba(35, 70, 129, 0.08) !important;
        background: linear-gradient(145deg, #162749 0%, #2f4a7f 100%) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__top {
        gap: 8px !important;
        padding: 20px 20px 0 !important;
        background: transparent !important;
        border-bottom: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__eyebrow {
        font-size: 10px !important;
        font-weight: 800 !important;
        letter-spacing: 0.14em !important;
        color: #7c94ba !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__title {
        font-size: 28px !important;
        line-height: 1.02 !important;
        letter-spacing: -0.04em !important;
        color: #10203c !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__detail {
        display: block !important;
        font-size: 14px !important;
        line-height: 1.7 !important;
        color: #5e7293 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__eyebrow,
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__detail {
        color: rgba(220, 232, 251, 0.76) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__title {
        color: #ffffff !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__grid {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 10px !important;
        padding: 18px 20px 20px !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric {
        display: grid !important;
        align-content: start !important;
        gap: 8px !important;
        min-height: 92px !important;
        padding: 14px !important;
        border: 1px solid rgba(180, 196, 223, 0.28) !important;
        border-bottom: 1px solid rgba(180, 196, 223, 0.28) !important;
        border-radius: 22px !important;
        background: #f6f9fd !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric dt {
        font-size: 10px !important;
        font-weight: 800 !important;
        letter-spacing: 0.14em !important;
        color: #7d93b7 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric dd {
        text-align: left !important;
        font-size: 15px !important;
        line-height: 1.35 !important;
        font-weight: 800 !important;
        color: #10203c !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric {
        border-color: rgba(255, 255, 255, 0.12) !important;
        background: rgba(255, 255, 255, 0.08) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric dt {
        color: rgba(220, 232, 251, 0.7) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric dd {
        color: #ffffff !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric--total {
        grid-column: 1 / -1 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 16px !important;
        min-height: 0 !important;
        margin-top: 2px !important;
        padding: 18px 0 0 !important;
        border: none !important;
        border-radius: 0 !important;
        border-top: 1px solid rgba(180, 196, 223, 0.24) !important;
        background: transparent !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric--total dt {
        color: #586b88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric--total dd {
        text-align: left !important;
        font-size: 22px !important;
        letter-spacing: -0.04em !important;
        color: #10203c !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric--total {
        border-top-color: rgba(255, 255, 255, 0.12) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric--total dt {
        color: rgba(220, 232, 251, 0.78) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric--total dd {
        color: #ffffff !important;
      }
      @media (max-width: 640px) {
        .page-block { margin: 0 !important; min-height: 0 !important; height: auto !important; }
        .page-content,
        .page-content--edge-to-edge,
        .page-content--document { min-height: 0 !important; height: auto !important; }
        .page-block--document { margin: 0 !important; border-radius: 0 !important; }
        .page-content--document { padding: 20px 14px 18px !important; }
        .offer-shell__header, .offer-shell__topline { grid-template-columns: 1fr !important; gap: 12px !important; }
        .offer-shell__header { padding-bottom: 16px !important; }
        .offer-shell__sender { gap: 10px !important; }
        .offer-shell__logo { width: 44px !important; height: 44px !important; }
        .offer-shell__meta { justify-items: stretch !important; text-align: left !important; padding: 14px !important; }
        .offer-shell__meta dl div { grid-template-columns: minmax(0, 1fr) auto !important; gap: 8px !important; align-items: end !important; }
        .offer-shell__meta .offer-shell__meta-row--recipient { grid-template-columns: 1fr !important; gap: 4px !important; }
        .offer-shell__meta dt { font-size: 10.5px !important; line-height: 1.35 !important; }
        .offer-shell__meta dd { font-size: 13px !important; line-height: 1.35 !important; text-align: right !important; white-space: nowrap !important; }
        .offer-shell__meta dd small { font-size: 11px !important; }
        .offer-shell__meta .offer-shell__meta-row--recipient dd { text-align: left !important; white-space: normal !important; }
        .offer-shell__customer { padding-left: 10px !important; font-size: 13px !important; line-height: 1.55 !important; }
        .offer-shell__sender-copy { font-size: 12.5px !important; line-height: 1.55 !important; }
        .offer-section p { font-size: 14px !important; line-height: 1.76 !important; }
        .offer-table-header h2 { font-size: 22px !important; line-height: 1.2 !important; }
        .offer-item-card__top { gap: 4px !important; padding: 14px 14px 12px !important; }
        .offer-item-card__eyebrow { font-size: 9.5px !important; }
        .offer-item-card__title { font-size: 18px !important; line-height: 1.32 !important; }
        .offer-item-card__detail { display: block !important; font-size: 12.5px !important; line-height: 1.62 !important; }
        .offer-items__table { display: none !important; }
        .offer-items__cards { display: grid !important; gap: 14px !important; }
        .offer-item-card { border-color: #d9e3ee !important; box-shadow: none !important; background: #ffffff !important; }
        .offer-item-card__metric { padding: 12px 14px !important; background: #ffffff !important; }
        .offer-item-card__metric dt { font-size: 11px !important; }
        .offer-item-card__metric dd { font-size: 14px !important; }
        .offer-item-card__metric:nth-child(even) { background: #fbfdff !important; }
        .offer-item-card__metric--total { border-top: 1px solid rgba(255,255,255,0.16) !important; }
        .offer-item-card__metric--total dd { font-size: 20px !important; font-weight: 800 !important; color: #ffffff !important; }
        .offer-shell__footer { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 10px !important; text-align: center !important; }
        .offer-shell__footer div { font-size: 11.5px !important; gap: 6px !important; }
        .offer-shell__footer-icon { width: 14px !important; height: 14px !important; flex: 0 0 14px !important; }
        .offer-summary { width: 100% !important; border-radius: 14px !important; padding: 0 !important; margin-top: 18px !important; border-color: #d9e3ee !important; box-shadow: none !important; }
        .offer-summary--below { width: 100% !important; margin-top: 18px !important; }
        .offer-summary__row { font-size: 13.5px !important; padding: 12px 14px !important; line-height: 1.55 !important; border-bottom: 1px solid #e5ecf3 !important; }
        .offer-summary__row span { font-weight: 600 !important; }
        .offer-summary__row--total { font-size: 16px !important; padding: 14px !important; }
      .offer-summary__row--total span { font-size: 11.5px !important; }
      .offer-summary__row--total strong { font-size: 22px !important; color: #ffffff !important; }
      .offer-shell__footer div { font-size: 14px !important; line-height: 1.6 !important; }
      }
      html.offer-mobile {
        background:
          radial-gradient(circle at top, #fefefe 0%, #eef3fb 46%, #e7eef8 100%) !important;
      }
      html.offer-mobile body {
        background: transparent !important;
      }
      html.offer-mobile .doc-wrapper {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }
      html.offer-mobile .page-block {
        position: relative !important;
      }
      html.offer-mobile .public-offer-promo {
        margin: 0 !important;
        border: none !important;
        border-radius: 0 !important;
        overflow: hidden !important;
        background: #08162d !important;
        box-shadow: none !important;
      }
      html.offer-mobile .public-offer-promo .page-content,
      html.offer-mobile .public-offer-promo .page-content--edge-to-edge {
        position: relative !important;
        min-height: min(100dvh, 860px) !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      html.offer-mobile .public-offer-promo .page-content::after,
      html.offer-mobile .public-offer-promo .page-content--edge-to-edge::after {
        content: '' !important;
        position: absolute !important;
        inset: 0 !important;
        background:
          linear-gradient(180deg, rgba(7, 18, 37, 0.26) 0%, rgba(7, 18, 37, 0.06) 28%, rgba(7, 18, 37, 0.72) 84%, rgba(7, 18, 37, 0.92) 100%) !important;
        pointer-events: none !important;
      }
      html.offer-mobile .public-offer-promo .page-content > div[style*="position:absolute"],
      html.offer-mobile .public-offer-promo .page-content--edge-to-edge > div[style*="position:absolute"] {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        line-height: 0 !important;
      }
      html.offer-mobile .public-offer-promo .page-content > div[style*="position:absolute"] img,
      html.offer-mobile .public-offer-promo .page-content--edge-to-edge > div[style*="position:absolute"] img {
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        object-fit: cover !important;
        object-position: center !important;
        border-radius: 0 !important;
      }
      html.offer-mobile .public-offer-primary {
        position: relative !important;
        z-index: 2 !important;
      }
      html.offer-mobile .doc-wrapper.doc-wrapper--with-promo .public-offer-primary {
        margin-top: -72px !important;
      }
      html.offer-mobile .doc-wrapper:not(.doc-wrapper--with-promo) .public-offer-primary {
        margin-top: 0 !important;
      }
      html.offer-mobile .public-offer-primary .page-content,
      html.offer-mobile .public-offer-primary .page-content--document {
        position: relative !important;
        padding: 28px 18px 20px !important;
        border-radius: 0 !important;
        background: transparent !important;
        border-top: none !important;
        box-shadow: none !important;
      }
      html.offer-mobile .doc-wrapper.doc-wrapper--with-promo .public-offer-primary .page-content::before,
      html.offer-mobile .doc-wrapper.doc-wrapper--with-promo .public-offer-primary .page-content--document::before {
        content: none !important;
      }
      html.offer-mobile .doc-wrapper:not(.doc-wrapper--with-promo) .public-offer-primary .page-content::before,
      html.offer-mobile .doc-wrapper:not(.doc-wrapper--with-promo) .public-offer-primary .page-content--document::before {
        content: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell {
        gap: 24px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__header {
        grid-template-columns: minmax(0, 1.14fr) minmax(118px, 0.86fr) !important;
        gap: 14px !important;
        align-items: start !important;
        padding: 16px 16px 15px !important;
        border: 1px solid rgba(178, 194, 219, 0.34) !important;
        border-radius: 22px !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 248, 253, 0.94)) !important;
        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.05) !important;
        backdrop-filter: blur(10px) !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__sender {
        display: grid !important;
        grid-template-columns: 1fr !important;
        min-width: 0 !important;
        align-items: flex-start !important;
        align-content: start !important;
        gap: 8px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__logo {
        display: block !important;
        width: 46px !important;
        height: 46px !important;
        border-radius: 14px !important;
        object-fit: cover !important;
        box-shadow: 0 10px 22px rgba(125, 148, 178, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__sender-copy {
        gap: 3px !important;
        font-size: 13.5px !important;
        line-height: 1.36 !important;
        color: #5b6f88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__sender-name {
        font-size: 15.5px !important;
        line-height: 1.22 !important;
        color: #142846 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta {
        align-self: stretch !important;
        justify-items: stretch !important;
        text-align: left !important;
        gap: 0 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 0 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl div {
        display: grid !important;
        grid-template-columns: 1fr !important;
        align-items: start !important;
        gap: 3px !important;
        padding: 8px 0 9px !important;
        border-top: 1px solid rgba(145, 166, 201, 0.16) !important;
        border-bottom: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl div:first-child {
        padding-top: 0 !important;
        border-top: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl div:nth-child(3) {
        grid-column: auto !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl div:last-child {
        padding-bottom: 0 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dt {
        font-size: 10.5px !important;
        line-height: 1.28 !important;
        letter-spacing: 0.05em !important;
        text-transform: uppercase !important;
        color: #7e94b2 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dd {
        font-size: 14px !important;
        line-height: 1.2 !important;
        font-weight: 700 !important;
        color: #142846 !important;
        white-space: normal !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__topline {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 14px !important;
        padding: 2px 2px 6px !important;
        border-bottom: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__topline h1 {
        font-family: 'Times New Roman', Times, serif !important;
        font-size: 32px !important;
        line-height: 0.96 !important;
        letter-spacing: -0.04em !important;
        max-width: none !important;
        color: #19355d !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__customer,
      html.offer-mobile .public-offer-primary .offer-shell__customer-card {
        display: grid !important;
        gap: 5px !important;
        padding-left: 0 !important;
        border-left: none !important;
        padding-top: 0 !important;
        border-top: none !important;
        min-width: 0 !important;
        justify-self: start !important;
        text-align: left !important;
        font-size: 15px !important;
        line-height: 1.62 !important;
        color: #5b6f88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__customer-primary,
      html.offer-mobile .public-offer-primary .offer-shell__customer-name {
        font-size: 19px !important;
        line-height: 1.25 !important;
        font-weight: 700 !important;
        color: #142846 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__customer-secondary,
      html.offer-mobile .public-offer-primary .offer-shell__customer p:not(.offer-shell__customer-name) {
        font-size: 15px !important;
        line-height: 1.58 !important;
        color: #5b6f88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-section {
        gap: 12px !important;
      }
      html.offer-mobile .public-offer-primary .offer-section p {
        font-size: 15px !important;
        line-height: 1.78 !important;
        color: #546783 !important;
      }
      html.offer-mobile .public-offer-primary .offer-section--terms,
      html.offer-mobile .public-offer-primary .offer-section--notes {
        padding: 18px 18px 19px !important;
        border: 1px solid rgba(178, 194, 219, 0.3) !important;
        border-radius: 22px !important;
        background: rgba(255, 255, 255, 0.94) !important;
        box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05) !important;
      }
      html.offer-mobile .public-offer-primary .offer-section h2,
      html.offer-mobile .public-offer-primary .offer-items > h2 {
        font-family: 'Times New Roman', Times, serif !important;
        font-size: 31px !important;
        line-height: 1.02 !important;
        letter-spacing: -0.04em !important;
        color: #19355d !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary {
        position: relative !important;
        width: 100% !important;
        margin-top: 24px !important;
        margin-left: 0 !important;
        padding: 12px 0 0 !important;
        border: 1px solid rgba(174, 191, 219, 0.28) !important;
        border-radius: 24px !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 254, 0.95)) !important;
        box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06) !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary::before {
        content: 'Summering' !important;
        display: block !important;
        padding: 0 18px 10px !important;
        font-size: 11.5px !important;
        font-weight: 700 !important;
        letter-spacing: 0.08em !important;
        text-transform: uppercase !important;
        color: #7c91ae !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row {
        padding: 14px 18px !important;
        font-size: 15px !important;
        line-height: 1.55 !important;
        color: #5b6f88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row span {
        font-weight: 600 !important;
        color: #5f738d !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row strong {
        font-size: 17px !important;
        color: #142846 !important;
        font-variant-numeric: tabular-nums !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row + .offer-summary__row {
        border-top: 1px solid rgba(174, 191, 219, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row--total {
        margin-top: 10px !important;
        padding: 16px 18px 18px !important;
        background: linear-gradient(135deg, #13233a 0%, #223b63 100%) !important;
        color: #e8f0fc !important;
        border-top: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row--total span {
        font-size: 11.5px !important;
        letter-spacing: 0.08em !important;
        text-transform: uppercase !important;
        color: rgba(232, 240, 252, 0.78) !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row--total strong {
        font-size: 23px !important;
        letter-spacing: -0.04em !important;
        color: #ffffff !important;
      }
      html.offer-mobile .public-offer-primary .offer-items {
        gap: 20px !important;
      }
      html.offer-mobile .public-offer-primary .offer-items__table {
        display: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-items__cards {
        display: grid !important;
        gap: 18px !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card {
        border: 1px solid rgba(174, 191, 219, 0.26) !important;
        border-radius: 24px !important;
        background: rgba(255, 255, 255, 0.98) !important;
        box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child {
        border-color: rgba(174, 191, 219, 0.26) !important;
        background: rgba(255, 255, 255, 0.98) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__top {
        gap: 10px !important;
        padding: 20px 20px 18px !important;
        background: linear-gradient(180deg, #fcfdff 0%, #f4f8fd 100%) !important;
        border-bottom: 1px solid rgba(174, 191, 219, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__eyebrow {
        font-size: 11px !important;
        font-weight: 700 !important;
        letter-spacing: 0.08em !important;
        color: #7e94b2 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__title {
        font-family: 'Times New Roman', Times, serif !important;
        font-size: 24px !important;
        line-height: 1.06 !important;
        letter-spacing: -0.03em !important;
        color: #19355d !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__detail {
        display: block !important;
        font-size: 14.5px !important;
        line-height: 1.72 !important;
        color: #5b6f88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__eyebrow,
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__detail {
        color: #5b6f88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__title {
        color: #19355d !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 0 !important;
        margin: 0 20px 18px !important;
        padding: 6px 0 0 !important;
        border-top: 1px solid rgba(174, 191, 219, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 5px !important;
        min-height: 0 !important;
        padding: 14px 10px 16px !important;
        border: none !important;
        border-bottom: 1px solid rgba(180, 196, 223, 0.22) !important;
        border-radius: 0 !important;
        background: transparent !important;
        text-align: center !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric:not(.offer-item-card__metric--total):nth-child(odd) {
        border-right: 1px solid rgba(180, 196, 223, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric:not(.offer-item-card__metric--total):nth-child(n+3) {
        border-top: 1px solid rgba(180, 196, 223, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric dt {
        display: flex !important;
        width: 100% !important;
        justify-content: center !important;
        font-size: 10.5px !important;
        font-weight: 700 !important;
        letter-spacing: 0.08em !important;
        text-transform: uppercase !important;
        color: #7e94b2 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric dd {
        display: flex !important;
        width: 100% !important;
        justify-content: center !important;
        align-items: center !important;
        text-align: center !important;
        font-size: 14px !important;
        line-height: 1.25 !important;
        font-weight: 800 !important;
        color: #142846 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric {
        background: transparent !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric dt {
        color: #7e94b2 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric dd {
        color: #142846 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric.offer-item-card__metric--total {
        grid-column: 1 / -1 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 7px !important;
        min-height: 0 !important;
        margin-top: 12px !important;
        padding: 14px 18px 16px !important;
        border: 1px solid rgba(22, 41, 73, 0.12) !important;
        border-radius: 18px !important;
        background: linear-gradient(135deg, #13233a 0%, #223b63 100%) !important;
        background-color: #13233a !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
        text-align: center !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric.offer-item-card__metric--total dt {
        width: 100% !important;
        justify-content: center !important;
        font-size: 10px !important;
        letter-spacing: 0.1em !important;
        color: rgba(232, 240, 252, 0.82) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric.offer-item-card__metric--total dd {
        width: 100% !important;
        justify-content: center !important;
        text-align: center !important;
        font-size: 18px !important;
        letter-spacing: -0.04em !important;
        color: #ffffff !important;
        font-variant-numeric: tabular-nums !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric.offer-item-card__metric--total {
        border-color: rgba(22, 41, 73, 0.12) !important;
        background: linear-gradient(135deg, #13233a 0%, #223b63 100%) !important;
        background-color: #13233a !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric.offer-item-card__metric--total dt {
        color: rgba(232, 240, 252, 0.78) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric.offer-item-card__metric--total dd {
        color: #ffffff !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__footer {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 14px 18px !important;
        text-align: left !important;
        padding-top: 18px !important;
        margin-top: 18px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__footer div {
        justify-items: start !important;
        font-size: 13.5px !important;
        gap: 6px !important;
        line-height: 1.58 !important;
        color: #5b6f88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__footer strong {
        gap: 6px !important;
        font-size: 12px !important;
        flex-wrap: wrap !important;
        justify-content: flex-start !important;
        color: #142846 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__footer-icon {
        width: 14px !important;
        height: 14px !important;
        flex: 0 0 14px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__footer a {
        word-break: break-word !important;
        overflow-wrap: anywhere !important;
        font-size: 13px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__footer-item--company {
        grid-column: 1 / -1 !important;
        grid-template-columns: minmax(0, 1fr) !important;
        row-gap: 4px !important;
        align-items: start !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__footer-item--company strong {
        justify-content: flex-start !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__footer-item--company > a,
      html.offer-mobile .public-offer-primary .offer-shell__footer-item--company > span:last-child {
        overflow-wrap: anywhere !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__footer-item--responsible,
      html.offer-mobile .public-offer-primary .offer-shell__footer-item--contact {
        padding-top: 10px !important;
        border-top: 1px solid rgba(174, 191, 219, 0.18) !important;
      }
      @media (max-width: 360px) {
        html.offer-mobile .public-offer-primary .offer-shell__header {
          grid-template-columns: minmax(0, 1.08fr) minmax(108px, 0.92fr) !important;
          gap: 12px !important;
          padding: 14px 14px 13px !important;
        }
        html.offer-mobile .public-offer-primary .offer-shell__logo {
          width: 42px !important;
          height: 42px !important;
          border-radius: 12px !important;
        }
        html.offer-mobile .public-offer-primary .offer-shell__sender-copy {
          font-size: 13.5px !important;
          line-height: 1.38 !important;
        }
        html.offer-mobile .public-offer-primary .offer-shell__meta dd {
          font-size: 13.5px !important;
        }
        html.offer-mobile .public-offer-primary .offer-item-card__grid {
          grid-template-columns: 1fr !important;
          margin: 6px 18px 18px !important;
        }
        html.offer-mobile .public-offer-primary .offer-item-card__metric:not(.offer-item-card__metric--total):nth-child(odd) {
          border-right: none !important;
        }
        html.offer-mobile .public-offer-primary .offer-item-card__metric:not(.offer-item-card__metric--total):nth-child(n+3) {
          border-top: none !important;
        }
      }
      html:not(.offer-mobile) .offer-shell {
        gap: 28px !important;
      }
      html:not(.offer-mobile) .doc-wrapper {
        max-width: 1000px !important;
      }
      html:not(.offer-mobile) .page-content--document {
        padding: 42px 34px 38px !important;
      }
      html:not(.offer-mobile) .offer-shell__header {
        grid-template-columns: minmax(0, 1fr) auto !important;
        gap: 52px !important;
        align-items: center !important;
        padding-bottom: 24px !important;
        border-bottom: 1px solid #dbe5f1 !important;
      }
      html:not(.offer-mobile) .offer-shell__sender {
        gap: 18px !important;
      }
      html:not(.offer-mobile) .offer-shell__logo {
        width: 92px !important;
        height: 92px !important;
        border-radius: 24px !important;
      }
      html:not(.offer-mobile) .offer-shell__sender-copy {
        gap: 6px !important;
        font-size: 15px !important;
        line-height: 1.38 !important;
        color: #111827 !important;
      }
      html:not(.offer-mobile) .offer-shell__meta {
        justify-items: end !important;
        text-align: left !important;
        gap: 0 !important;
        align-self: center !important;
      }
      html:not(.offer-mobile) .offer-shell__status,
      html:not(.offer-mobile) .offer-shell__eyebrow,
      html:not(.offer-mobile) .offer-shell__lead,
      html:not(.offer-mobile) .offer-shell__customer-label {
        display: none !important;
      }
      html:not(.offer-mobile) .offer-shell__meta dl {
        width: auto !important;
        grid-template-columns: repeat(3, minmax(124px, max-content)) !important;
        justify-content: end !important;
        gap: 0 !important;
      }
      html:not(.offer-mobile) .offer-shell__meta dl div {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 6px !important;
        min-width: 0 !important;
        padding: 0 0 0 24px !important;
        border-left: 1px solid #dbe5f1 !important;
      }
      html:not(.offer-mobile) .offer-shell__meta dl div:first-child {
        border-left: none !important;
        padding-left: 0 !important;
      }
      html:not(.offer-mobile) .offer-shell__meta dl div:last-child {
        padding-right: 0 !important;
      }
      html:not(.offer-mobile) .offer-shell__meta dt {
        font-size: 11px !important;
        font-weight: 700 !important;
        letter-spacing: 0.12em !important;
        text-transform: uppercase !important;
        text-align: left !important;
        color: #657b9c !important;
      }
      html:not(.offer-mobile) .offer-shell__meta dd {
        font-size: 16px !important;
        font-weight: 700 !important;
        text-align: left !important;
        color: #1f335b !important;
        white-space: nowrap !important;
        line-height: 1.2 !important;
      }
      html:not(.offer-mobile) .offer-shell__topline {
        grid-template-columns: minmax(0, 1fr) minmax(220px, 280px) !important;
        gap: 28px !important;
        align-items: end !important;
        padding-bottom: 0 !important;
        border-bottom: 0 !important;
      }
      html:not(.offer-mobile) .offer-shell__topline h1 {
        font-family: 'Times New Roman', Times, serif !important;
        font-size: 72px !important;
        line-height: 0.97 !important;
        letter-spacing: -0.03em !important;
        color: #1e3158 !important;
      }
      html:not(.offer-mobile) .offer-shell__customer,
      html:not(.offer-mobile) .offer-shell__customer-card {
        display: grid !important;
        gap: 10px !important;
        padding: 0 !important;
        border: 0 !important;
        min-width: 0 !important;
        text-align: right !important;
        justify-self: end !important;
        color: #334b70 !important;
      }
      html:not(.offer-mobile) .offer-shell__customer-primary,
      html:not(.offer-mobile) .offer-shell__customer-name {
        font-size: 18px !important;
        font-weight: 700 !important;
        line-height: 1.2 !important;
        color: #1f335b !important;
      }
      html:not(.offer-mobile) .offer-shell__customer-secondary,
      html:not(.offer-mobile) .offer-shell__customer p:not(.offer-shell__customer-name) {
        font-size: 13px !important;
        line-height: 1.4 !important;
        color: #334b70 !important;
      }
      html:not(.offer-mobile) .offer-table-header {
        display: none !important;
      }
      html:not(.offer-mobile) .offer-items__table {
        border-color: #d4e2f1 !important;
        border-radius: 26px !important;
        box-shadow: 10px 10px 0 #e8eff8 !important;
      }
      html:not(.offer-mobile) .offer-items__head,
      html:not(.offer-mobile) .offer-item-row {
        gap: 0 !important;
      }
      html:not(.offer-mobile) .offer-items__head {
        padding: 17px 20px 14px !important;
        background: #ffffff !important;
        color: #1f335b !important;
        font-size: 15px !important;
        letter-spacing: 0 !important;
        text-transform: none !important;
      }
      html:not(.offer-mobile) .offer-items__head span {
        display: flex !important;
        min-height: 46px !important;
        align-items: center !important;
        justify-content: flex-end !important;
        padding: 0 10px !important;
        border-left: 1px solid #dbe5f1 !important;
      }
      html:not(.offer-mobile) .offer-items__head span:first-child {
        justify-content: flex-start !important;
        padding-left: 0 !important;
        border-left: none !important;
      }
      html:not(.offer-mobile) .offer-items__body {
        border-top: 1px solid #dbe5f1 !important;
      }
      html:not(.offer-mobile) .offer-item-row {
        padding: 20px 20px 21px !important;
        border-bottom: 0 !important;
      }
      html:not(.offer-mobile) .offer-item-row__product {
        gap: 10px !important;
        padding-right: 14px !important;
      }
      html:not(.offer-mobile) .offer-item-row__title {
        font-size: 16px !important;
        line-height: 1.28 !important;
        color: #1f335b !important;
      }
      html:not(.offer-mobile) .offer-item-row__detail {
        max-width: none !important;
        font-size: 13px !important;
        line-height: 1.58 !important;
        color: #4c6182 !important;
      }
      html:not(.offer-mobile) .offer-item-row__value {
        display: flex !important;
        align-items: flex-start !important;
        justify-content: flex-end !important;
        padding: 4px 8px 0 !important;
        font-size: 14px !important;
        line-height: 1.3 !important;
        font-weight: 700 !important;
        color: #1f335b !important;
        white-space: nowrap !important;
      }
      html:not(.offer-mobile) .offer-item-row__value--strong {
        font-size: 16px !important;
        font-weight: 800 !important;
      }
      html:not(.offer-mobile) .offer-summary,
      html:not(.offer-mobile) .offer-summary--below {
        width: min(408px, 100%) !important;
        max-width: none !important;
        margin-left: auto !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        overflow: visible !important;
      }
      html:not(.offer-mobile) .offer-summary--below {
        margin-top: 18px !important;
      }
      html:not(.offer-mobile) .offer-summary__row {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        align-items: center !important;
        gap: 16px !important;
        padding: 12px 18px !important;
        background: #f4f7fb !important;
        color: #1f335b !important;
        font-size: 14px !important;
        line-height: 1.35 !important;
      }
      html:not(.offer-mobile) .offer-summary__row strong {
        font-size: 14px !important;
        font-weight: 700 !important;
        color: #1f335b !important;
      }
      html:not(.offer-mobile) .offer-summary__row--discount {
        background: #fff1f1 !important;
        color: #be3d35 !important;
      }
      html:not(.offer-mobile) .offer-summary__row--discount strong {
        color: #be3d35 !important;
      }
      html:not(.offer-mobile) .offer-summary__row--total {
        margin-top: 8px !important;
        padding: 17px 20px !important;
        background: #2d4a83 !important;
        color: #ffffff !important;
      }
      html:not(.offer-mobile) .offer-summary__row--total strong,
      html:not(.offer-mobile) .offer-summary__row--total span {
        color: #ffffff !important;
      }
      html:not(.offer-mobile) .offer-summary__total-copy {
        display: grid !important;
        gap: 4px !important;
      }
      html:not(.offer-mobile) .offer-summary__total-label {
        font-size: 21px !important;
        font-weight: 700 !important;
        line-height: 1 !important;
      }
      html:not(.offer-mobile) .offer-summary__total-subcopy {
        font-size: 11px !important;
        font-weight: 700 !important;
        line-height: 1.1 !important;
      }
      html:not(.offer-mobile) .offer-summary__row--total strong {
        font-size: 20px !important;
        letter-spacing: -0.02em !important;
      }
      html:not(.offer-mobile) .offer-section--terms {
        margin-top: 28px !important;
      }
      html:not(.offer-mobile) .offer-shell__footer {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 30px !important;
        padding-top: 24px !important;
        margin-top: 36px !important;
        border-top: 1px solid #dbe5f1 !important;
      }
      html:not(.offer-mobile) .offer-shell__footer div {
        justify-items: center !important;
        text-align: center !important;
        gap: 8px !important;
        font-size: 14px !important;
        line-height: 1.42 !important;
      }
      html:not(.offer-mobile) .offer-shell__footer strong {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        color: #1f335b !important;
        font-size: 14px !important;
      }
      html:not(.offer-mobile) .offer-shell__footer-icon {
        width: 17px !important;
        height: 17px !important;
        stroke: currentColor !important;
        fill: none !important;
        stroke-width: 16 !important;
        stroke-linecap: round !important;
        stroke-linejoin: round !important;
        flex: 0 0 17px !important;
      }
      html:not(.offer-mobile) .offer-shell__footer a {
        color: #2563eb !important;
        text-decoration: none !important;
      }
    `;
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
