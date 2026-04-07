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
import { motion, AnimatePresence } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import {
  FileTextIcon,
  UserIcon,
  CalendarIcon,
  EditIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ShieldIcon,
  TrashIcon,
} from '@shared/ui/icons';
import { BrandMark } from '@shared/ui/brand';
import { summarizeOfferPricing } from '@modules/supporting/offers/domain/pricing';

// ─── Types ─────────────────────────────────────────────────────────────────────

type OfferStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

interface PublicOffer {
  id: string;
  title: string;
  status: OfferStatus;
  priceDisplayMode: 'exclusive' | 'inclusive';
  recipientName: string;
  recipientEmail: string;
  recipientCompany?: string;
  totalExVat: number;
  totalIncVat: number;
  lineItems: Array<{ quantity: number; unitPrice: number; vatRate: number; discount?: number }>;
  validUntil: string;
  notes?: string;
  generatedDocument?: string;
  publicToken: string;
  publicTokenExpiresAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  signerName?: string;
  signatureImage?: string;
}

type PageState = 'loading' | 'ready' | 'declining' | 'signing' | 'accepted' | 'declined' | 'expired' | 'error';
type SigMode = 'draw' | 'type';

const SIG_FONTS = [
  { id: 'cursive1', family: "'Segoe Script', 'Bradley Hand', cursive", label: 'Handskrift' },
  { id: 'cursive2', family: "'Brush Script MT', 'Snell Roundhand', cursive", label: 'Elegant' },
  { id: 'serif',    family: "'Georgia', 'Times New Roman', serif",          label: 'Klassisk' },
  { id: 'mono',     family: "'Courier New', monospace",                     label: 'Maskin' },
] as const;

// ─── Utilities ─────────────────────────────────────────────────────────────────

function fmtSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(n);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'long', year: 'numeric' });
}
function todaySv() {
  return new Date().toLocaleDateString('sv-SE');
}
function getStatusLabel(status: OfferStatus) {
  const labels: Record<OfferStatus, string> = {
    draft: 'Offert',
    sent: 'Offert',
    viewed: 'Offert',
    accepted: 'Signerad',
    declined: 'Avvisad',
    expired: 'Utgången',
  };
  return labels[status] ?? 'Offert';
}

function normalizeBrokenSwedish(text: string): string {
  return text
    .replace(/Ã…/g, 'Å')
    .replace(/Ã„/g, 'Ä')
    .replace(/Ã–/g, 'Ö')
    .replace(/Ã¥/g, 'å')
    .replace(/Ã¤/g, 'ä')
    .replace(/Ã¶/g, 'ö')
    .replace(/Â /g, '\u00a0')
    .replace(/Â·/g, '·')
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€œ/g, '“')
    .replace(/â€\u009d/g, '”')
    .replace(/â€™/g, '’');
}
function textToSignatureImage(text: string, fontFamily: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600; canvas.height = 150;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 600, 150);
  ctx.font = `44px ${fontFamily}`;
  ctx.fillStyle = '#0f172a';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 24, 75);
  return canvas.toDataURL('image/png');
}

type SignatureFields = {
  image?: string;
  name?: string;
  date?: string;
};

function applySignatureFields(root: ParentNode, signature?: SignatureFields) {
  root.querySelectorAll('[data-sig-field]').forEach((el) => {
    const field = el.getAttribute('data-sig-field');
    const container = el as HTMLElement;

    if (!signature?.image && !signature?.name && !signature?.date) {
      container.style.display = 'none';
      return;
    }

    container.replaceChildren();
    container.style.border = 'none';
    container.style.borderRadius = '0';
    container.style.background = 'transparent';
    container.style.padding = '4px 0';
    container.style.minHeight = '0';
    container.style.display = 'block';

    if (field === 'signature') {
      if (!signature.image) {
        container.style.display = 'none';
        return;
      }
      const img = document.createElement('img');
      img.src = signature.image;
      img.alt = 'Signatur';
      img.style.maxWidth = '260px';
      img.style.maxHeight = '80px';
      img.style.display = 'block';
      container.appendChild(img);
      return;
    }

    if (field === 'name') {
      if (!signature.name) {
        container.style.display = 'none';
        return;
      }
      const name = document.createElement('span');
      name.textContent = signature.name;
      name.style.fontSize = '15px';
      name.style.color = '#1e293b';
      name.style.fontWeight = '500';
      container.appendChild(name);
      return;
    }

    if (field === 'date') {
      if (!signature.date) {
        container.style.display = 'none';
        return;
      }
      const date = document.createElement('span');
      date.textContent = signature.date;
      date.style.fontSize = '14px';
      date.style.color = '#475569';
      container.appendChild(date);
      return;
    }

    container.style.display = 'none';
  });
}

// ─── Animated checkmark (drawn with SVG path animation) ────────────────────────

function SuccessCheckmark() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
      className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <motion.circle
          cx="20" cy="20" r="18"
          stroke="#16a34a"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        <motion.path
          d="M12 20l5 5 11-11"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        />
      </svg>
    </motion.div>
  );
}

function DeclineMark() {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.08 }}
      className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 shadow-[0_0_0_10px_rgba(254,226,226,0.55)]"
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <motion.circle
          cx="20" cy="20" r="18"
          stroke="#dc2626"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.12 }}
        />
        <motion.path
          d="M14 14l12 12M26 14L14 26"
          stroke="#dc2626"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, delay: 0.42 }}
        />
      </svg>
    </motion.div>
  );
}

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
  const [sigFont, setSigFont] = useState<typeof SIG_FONTS[number]['id']>(SIG_FONTS[0].id);
  const [typedSig, setTypedSig] = useState('');

  const [scrollProgress, setScrollProgress] = useState(0);
  const [documentReady, setDocumentReady] = useState(false);
  const [offerSectionOffset, setOfferSectionOffset] = useState(0);
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

  useEffect(() => {
    if (sigMode !== 'type') {
      setSigMode('type');
    }
  }, [sigMode]);

  useEffect(() => {
    setDocumentReady(false);
    setOfferSectionOffset(0);
    setPromoPageCount(0);
  }, [offer?.generatedDocument]);

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
  useEffect(() => {
    const scrollRoot = mainRef.current;
    if (!scrollRoot) return;

    const handleScroll = () => {
      const total = scrollRoot.scrollHeight - scrollRoot.clientHeight;
      if (total <= 0) {
        setScrollProgress(100);
        return;
      }
      setScrollProgress(Math.min(100, Math.max(0, Math.round((scrollRoot.scrollTop / total) * 100))));
    };

    handleScroll();
    scrollRoot.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollRoot.removeEventListener('scroll', handleScroll);
  }, []);

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
      *, *::before, *::after { box-sizing: border-box; }
      img { max-width: 100% !important; display: block; }
      img:not([style*="height:"]) { height: auto; }
      table { max-width: 100% !important; width: 100%; table-layout: fixed; }
      td, th { word-break: break-word; overflow-wrap: break-word; }
      pre, code { white-space: pre-wrap !important; word-break: break-word !important; overflow-x: hidden !important; }
      .offer-shell { gap: 16px !important; }
      .offer-shell__header, .offer-shell__topline { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(196px, 232px) !important; gap: 14px !important; align-items: flex-start !important; }
      .offer-shell__sender { gap: 10px !important; align-items: flex-start !important; }
      .offer-shell__logo { width: 46px !important; height: 46px !important; }
      .offer-shell__sender-copy { display: grid !important; gap: 2px !important; font-size: 12px !important; line-height: 1.45 !important; color: #475569 !important; }
      .offer-shell__meta { min-width: 0 !important; display: grid !important; gap: 8px !important; justify-items: end !important; text-align: right !important; }
      .offer-shell__status { margin: 0 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; padding: 5px 11px !important; border-radius: 999px !important; font-size: 11px !important; font-weight: 700 !important; }
      .offer-shell__status--draft { background: #e2e8f0 !important; color: #334155 !important; }
      .offer-shell__status--sent, .offer-shell__status--viewed { background: #dbeafe !important; color: #1d4ed8 !important; }
      .offer-shell__status--accepted { background: #dcfce7 !important; color: #166534 !important; }
      .offer-shell__status--declined { background: #fee2e2 !important; color: #b91c1c !important; }
      .offer-shell__status--expired { background: #f3f4f6 !important; color: #6b7280 !important; }
      .offer-shell__meta dl { display: grid !important; gap: 6px !important; width: 100% !important; }
      .offer-shell__meta dl div { display: grid !important; grid-template-columns: minmax(0, 1fr) auto !important; justify-content: flex-end !important; gap: 10px !important; }
      .offer-shell__topline { padding-bottom: 14px !important; }
      .offer-shell__topline h1 { font-size: 18px !important; line-height: 1.2 !important; }
      .offer-shell__customer { min-width: 0 !important; display: grid !important; gap: 3px !important; padding-left: 12px !important; border-left: 1px solid #e2e8f0 !important; font-size: 13px !important; line-height: 1.5 !important; color: #475569 !important; }
      .offer-section { gap: 8px !important; }
      .offer-section p { font-size: 13px !important; line-height: 1.72 !important; }
      .offer-summary { width: min(240px, 100%) !important; border: 1px solid #dbe4ee !important; border-radius: 14px !important; background: #ffffff !important; padding: 8px 0 !important; gap: 0 !important; overflow: hidden !important; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important; }
      .offer-summary--below { width: min(360px, 100%) !important; margin-left: auto !important; }
      .offer-summary__row { font-size: 13px !important; padding: 7px 14px !important; border-bottom: none !important; color: #475569 !important; align-items: baseline !important; line-height: 1.5 !important; }
      .offer-summary__row strong { color: #0f172a !important; }
      .offer-summary__row--total { margin-top: 6px !important; padding: 11px 14px 10px !important; border-top: 1px solid #e8eef5 !important; border-bottom: none !important; background: #f8fafc !important; color: #0f172a !important; font-size: 14px !important; }
      .offer-summary__row--total strong { color: #0f172a !important; font-size: 18px !important; }
      .offer-shell__footer { grid-template-columns: minmax(0, 1.35fr) repeat(2, minmax(0, 1fr)) !important; gap: 12px !important; padding-top: 14px !important; }
      .offer-shell__footer div { font-size: 13px !important; line-height: 1.55 !important; }
      .offer-items { display: grid !important; gap: 12px !important; }
      .offer-items__table { display: block !important; border: 1px solid #dbe4ee !important; border-radius: 18px !important; background: #ffffff !important; overflow: hidden !important; }
      .offer-items__head, .offer-item-row { display: grid !important; grid-template-columns: var(--offer-columns) !important; align-items: start !important; }
      .offer-items__head { gap: 14px !important; padding: 11px 16px !important; background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%) !important; border-bottom: 1px solid #dbe4ee !important; color: #64748b !important; font-size: 11px !important; font-weight: 700 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; }
      .offer-item-row { gap: 14px !important; padding: 16px !important; border-bottom: 1px solid #eef2f7 !important; }
      .offer-item-row:last-child { border-bottom: none !important; }
      .offer-item-row__product { display: grid !important; gap: 5px !important; min-width: 0 !important; }
      .offer-item-row__title { font-size: 15px !important; line-height: 1.35 !important; font-weight: 700 !important; color: #0f172a !important; }
      .offer-item-row__detail { font-size: 13px !important; line-height: 1.68 !important; color: #64748b !important; }
      .offer-item-row__value { text-align: right !important; font-size: 14px !important; line-height: 1.5 !important; color: #334155 !important; }
      .offer-item-row__value--strong { font-weight: 700 !important; color: #0f172a !important; }
      .offer-items__cards { display: none !important; }
      .offer-item-card { border: 1px solid #dbe4ee !important; border-radius: 18px !important; background: #ffffff !important; overflow: hidden !important; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04) !important; }
      .offer-item-card__top { display: grid !important; gap: 6px !important; padding: 15px 16px 14px !important; background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%) !important; border-bottom: 1px solid #eef2f7 !important; }
      .offer-item-card__eyebrow { font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; color: #94a3b8 !important; }
      .offer-item-card__title { font-size: 16px !important; line-height: 1.3 !important; font-weight: 700 !important; color: #0f172a !important; }
      .offer-item-card__detail { font-size: 13px !important; line-height: 1.7 !important; color: #64748b !important; }
      .offer-item-card__grid { display: grid !important; gap: 0 !important; margin: 0 !important; }
      .offer-item-card__metric { display: flex !important; justify-content: space-between !important; gap: 16px !important; padding: 11px 16px !important; border-bottom: 1px solid #eef2f7 !important; }
      .offer-item-card__metric:last-child { border-bottom: none !important; }
      .offer-item-card__metric dt, .offer-item-card__metric dd { margin: 0 !important; }
      .offer-item-card__metric dt { font-size: 12px !important; font-weight: 700 !important; letter-spacing: 0.06em !important; text-transform: uppercase !important; color: #94a3b8 !important; }
      .offer-item-card__metric dd { text-align: right !important; font-size: 14px !important; font-weight: 600 !important; color: #0f172a !important; }
      .offer-item-card__metric--total { background: #f8fafc !important; }
      html.offer-mobile .offer-shell__header, html.offer-mobile .offer-shell__topline { grid-template-columns: minmax(0, 1fr) 168px !important; gap: 12px !important; }
      html.offer-mobile .offer-shell__meta { justify-items: end !important; text-align: right !important; }
      html.offer-mobile .offer-shell__meta dl div { grid-template-columns: 1fr !important; gap: 2px !important; justify-items: end !important; }
      html.offer-mobile .offer-shell__meta dt { font-size: 12.5px !important; line-height: 1.5 !important; }
      html.offer-mobile .offer-shell__meta dd { font-size: 14px !important; line-height: 1.5 !important; white-space: normal !important; }
      html.offer-mobile .offer-shell__customer { padding-left: 10px !important; font-size: 14px !important; line-height: 1.55 !important; }
      html.offer-mobile .offer-shell__sender-copy { font-size: 14px !important; line-height: 1.55 !important; }
      html.offer-mobile .offer-section p { font-size: 14px !important; line-height: 1.78 !important; }
      html.offer-mobile .offer-item-card__title { font-size: 17px !important; line-height: 1.35 !important; }
      html.offer-mobile .offer-item-card__detail { display: none !important; }
      html.offer-mobile .offer-items__table { display: none !important; }
      html.offer-mobile .offer-items__cards { display: grid !important; gap: 16px !important; }
      html.offer-mobile .offer-item-card { border-color: #cfdbe8 !important; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06) !important; background: #ffffff !important; }
      html.offer-mobile .offer-item-card__metric { background: #ffffff !important; }
      html.offer-mobile .offer-item-card__metric:nth-child(even) { background: #fbfdff !important; }
      html.offer-mobile .offer-item-card__metric--total { background: #eef5ff !important; border-top: 1px solid #d6e3f3 !important; }
      html.offer-mobile .offer-shell__footer { grid-template-columns: 1fr !important; gap: 10px !important; }
      html.offer-mobile .offer-summary { width: 100% !important; border-radius: 16px !important; padding: 8px 0 !important; margin-top: 18px !important; border-color: #cfdbe8 !important; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05) !important; }
      html.offer-mobile .offer-summary--below { width: 100% !important; margin-top: 18px !important; }
      html.offer-mobile .offer-summary__row { font-size: 14px !important; padding: 8px 12px !important; line-height: 1.55 !important; }
      html.offer-mobile .offer-summary__row--total { font-size: 16px !important; padding: 12px !important; background: #0f172a !important; color: #f8fafc !important; }
      html.offer-mobile .offer-summary__row--total strong { font-size: 19px !important; color: #ffffff !important; }
      html.offer-mobile .offer-shell__footer div { font-size: 14px !important; line-height: 1.6 !important; }
      @media (max-width: 640px) {
        .offer-shell__header, .offer-shell__topline { grid-template-columns: minmax(0, 1fr) 168px !important; gap: 12px !important; }
        .offer-shell__meta { justify-items: end !important; text-align: right !important; }
        .offer-shell__meta dl div { grid-template-columns: 1fr !important; gap: 2px !important; justify-items: end !important; }
        .offer-shell__meta dt { font-size: 12.5px !important; line-height: 1.5 !important; }
        .offer-shell__meta dd { font-size: 14px !important; line-height: 1.5 !important; white-space: normal !important; }
        .offer-shell__customer { padding-left: 10px !important; font-size: 14px !important; line-height: 1.55 !important; }
        .offer-shell__sender-copy { font-size: 14px !important; line-height: 1.55 !important; }
        .offer-section p { font-size: 14px !important; line-height: 1.78 !important; }
        .offer-item-card__title { font-size: 17px !important; line-height: 1.35 !important; }
        .offer-item-card__detail { display: none !important; }
        .offer-items__table { display: none !important; }
        .offer-items__cards { display: grid !important; gap: 16px !important; }
        .offer-item-card { border-color: #cfdbe8 !important; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06) !important; background: #ffffff !important; }
        .offer-item-card__metric { background: #ffffff !important; }
        .offer-item-card__metric:nth-child(even) { background: #fbfdff !important; }
        .offer-item-card__metric--total { background: #eef5ff !important; border-top: 1px solid #d6e3f3 !important; }
        .offer-shell__footer { grid-template-columns: 1fr !important; gap: 10px !important; }
        .offer-summary { width: 100% !important; border-radius: 16px !important; padding: 8px 0 !important; margin-top: 18px !important; border-color: #cfdbe8 !important; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05) !important; }
        .offer-summary--below { width: 100% !important; margin-top: 18px !important; }
        .offer-summary__row { font-size: 14px !important; padding: 8px 12px !important; line-height: 1.55 !important; }
        .offer-summary__row--total { font-size: 16px !important; padding: 12px !important; background: #0f172a !important; color: #f8fafc !important; }
        .offer-summary__row--total strong { font-size: 19px !important; color: #ffffff !important; }
        .offer-shell__footer div { font-size: 14px !important; line-height: 1.6 !important; }
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
    const firstDocumentPage = doc.querySelector<HTMLElement>('.page-block--document') ?? pageBlocks[0] ?? null;
    const firstDocumentIndex = firstDocumentPage ? pageBlocks.indexOf(firstDocumentPage) : 0;
    setPromoPageCount(Math.max(0, firstDocumentIndex));

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

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const value = node.nodeValue ?? '';
      const normalized = normalizeBrokenSwedish(value);
      if (normalized !== value) node.nodeValue = normalized;
    }

    const legacyMetaTitle = doc.querySelector<HTMLElement>('.offer-shell__title');
    if (legacyMetaTitle && offer) {
      legacyMetaTitle.textContent = getStatusLabel(offer.status);
      legacyMetaTitle.className = offer.status === 'accepted' || offer.status === 'declined' || offer.status === 'expired'
        ? `offer-shell__status offer-shell__status--${offer.status}`
        : 'offer-shell__title';
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
        const rawOfferOffset = firstDocumentPage?.offsetTop ?? 0;
        const scaledOfferOffset = effectiveScale < 1 ? rawOfferOffset * effectiveScale : rawOfferOffset;
        setOfferSectionOffset(Math.max(0, Math.round(scaledOfferOffset)));
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
  }, [offer, signatureFields]);

  // ── Draw canvas resize ───────────────────────────────────────────────────────
  useEffect(() => {
    if (sigMode !== 'draw') return;
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;
    const syncSize = () => {
      const canvas = wrapper.querySelector('canvas');
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(wrapper.getBoundingClientRect().width);
      const h = 120;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        const prev = sigRef.current && !sigRef.current.isEmpty() ? sigRef.current.getTrimmedCanvas().toDataURL('image/png') : null;
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
  }, [sigMode, state]);

  // ── Fetch offer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch(`/api/offers/public/${token}`);
        if (res.status === 404 || res.status === 410) { setState('expired'); return; }
        if (!res.ok) throw new Error(`Fel ${res.status}`);
        const json = await res.json() as { data: PublicOffer };
        const o = json.data;
        setOffer(o);
        setSignerName(o.recipientName ?? '');
        setTypedSig(o.recipientName ?? '');
        if (o.status === 'accepted') setState('accepted');
        else if (o.status === 'declined') setState('declined');
        else if (o.publicTokenExpiresAt && new Date(o.publicTokenExpiresAt) < new Date()) setState('expired');
        else setState('ready');
      } catch (e) { setErrMsg((e as Error).message); setState('error'); }
    })();
  }, [token]);

  useEffect(() => {
    if (!token || !offer) return;
    if (offer.status !== 'sent' || offer.viewedAt) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/offers/public/${token}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      }).catch(() => {
        // Best effort only; the document should still remain usable if this fails.
      });
    }, 1200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [offer, token]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const getSignatureImage = useCallback((): string | null => {
    if (sigMode === 'draw') {
      if (!sigRef.current || sigRef.current.isEmpty()) return null;
      return sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    }
    if (!typedSig.trim()) return null;
    const f = SIG_FONTS.find((x) => x.id === sigFont) ?? SIG_FONTS[0];
    return textToSignatureImage(typedSig.trim(), f.family);
  }, [sigMode, typedSig, sigFont]);

  const handleSign = useCallback(async () => {
    if (!signerName.trim()) { setErrMsg('Ange ditt fullständiga namn.'); return; }
    const signatureImage = getSignatureImage();
    if (!signatureImage) { setErrMsg(sigMode === 'draw' ? 'Rita din namnteckning i rutan.' : 'Skriv din namnteckning.'); return; }
    setBusy(true); setErrMsg('');
    setState('signing');
    try {
      const res = await fetch(`/api/offers/public/${token}/sign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureImage, signerName: signerName.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        // Show the API detail if it's a user-actionable message, otherwise generic
        const msg = j.detail && j.detail.length < 120 ? j.detail : 'Signeringen misslyckades. Försök igen.';
        throw new Error(msg);
      }
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
      const res = await fetch(`/api/offers/public/${token}/decline`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment.trim() || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        const msg = j.detail && j.detail.length < 120 ? j.detail : 'Avvisningen misslyckades. Försök igen.';
        throw new Error(msg);
      }
      setState('declined');
    } catch (e) { setErrMsg((e as Error).message); } finally { setBusy(false); }
  }, [token, comment]);

  const handleDownloadPdf = async () => {
    if (!offer?.generatedDocument) return;
    setDownloading(true);
    try {
      const url = `/api/offers/public/${token}/pdf`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setErrMsg('Kunde inte ladda ner PDF. Försök igen.');
    } finally {
      window.setTimeout(() => setDownloading(false), 250);
    }
  };

  const handleJumpToOffer = useCallback(() => {
    const scrollRoot = mainRef.current;
    const documentSection = documentSectionRef.current;
    if (!scrollRoot || !documentSection) return;
    const targetTop = Math.max(0, documentSection.offsetTop + offerSectionOffset - 12);
    scrollRoot.scrollTo({ top: targetTop, behavior: 'smooth' });
  }, [offerSectionOffset]);

  // ─── Derived state ───────────────────────────────────────────────────────────
  const selectedFont = SIG_FONTS.find((f) => f.id === sigFont) ?? SIG_FONTS[0];

  // ─── Status pages ────────────────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-slate-400"
        >
          Laddar offert...
        </motion.div>
      </div>
    );
  }

  // Terminal status screens
  if (state === 'expired' || state === 'error' || state === 'accepted' || state === 'declined') {
    const configs = {
      expired:  { icon: <ClockIcon size={40} className="text-slate-400" />, title: 'Länken har gått ut', sub: 'Kontakta ansvarig kontakt för att få en ny länk till offerten.' },
      error:    { icon: <XCircleIcon size={40} className="text-red-400" />, title: 'Offerten hittades inte', sub: 'Kontrollera länken och försök igen.' },
      accepted: { icon: null, title: 'Offert signerad', sub: 'Tack! Din underskrift är registrerad och ansvarig kontakt har nu fått besked.' },
      declined: { icon: null, title: 'Offert avvisad', sub: 'Din avvisning är registrerad och ansvarig kontakt har nu fått besked.' },
    };
    const cfg = configs[state];
    const isDeclinedState = state === 'declined';

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex min-h-[80vh] items-center justify-center px-6"
        >
          <div className={`w-full max-w-md rounded-2xl border p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.06)] ${isDeclinedState ? 'border-red-200/80 bg-gradient-to-b from-red-50/90 to-white' : 'border-slate-200/60 bg-white'}`}>
            {state === 'accepted' ? (
              <SuccessCheckmark />
            ) : state === 'declined' ? (
              <DeclineMark />
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${isDeclinedState ? 'bg-red-50' : 'bg-slate-50'}`}
              >
                {cfg.icon}
              </motion.div>
            )}
            <h1 className={`mb-2 text-xl font-bold ${isDeclinedState ? 'text-red-700' : 'text-slate-900'}`}>{cfg.title}</h1>
            <p className={`text-sm leading-relaxed ${isDeclinedState ? 'text-red-700/80' : 'text-slate-500'}`}>{cfg.sub}</p>

            {state === 'accepted' && offer?.generatedDocument && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <button
                  onClick={() => void handleDownloadPdf()}
                  disabled={downloading}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md active:scale-[0.97] disabled:opacity-50"
                >
                  <FileTextIcon size={15} />
                  {downloading ? 'Laddar ner...' : 'Ladda ner som PDF'}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Signing in-progress overlay
  if (state === 'signing') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[80vh] flex-col items-center justify-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-800"
        />
        <p className="text-sm text-slate-500">Signerar offert...</p>
      </motion.div>
    );
  }

  if (!offer) return null;
  const isDecline = state === 'declining';
  const pricing = summarizeOfferPricing(offer.lineItems, offer.priceDisplayMode);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      {/* ─── Sticky header ─── */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/96 backdrop-blur-md">
        <div className="flex h-13 items-center gap-3 px-4 sm:h-14 sm:px-6">

          {/* Left: title + recipient */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <BrandMark size={18} alt="" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold leading-tight text-slate-900">{offer.title}</h1>
              <p className="truncate text-[11px] leading-tight text-slate-400">
                {offer.recipientName}
                {offer.recipientCompany ? ` · ${offer.recipientCompany}` : ''}
              </p>
            </div>
          </div>

          {/* Right: price + PDF */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <span className="text-sm font-bold tabular-nums text-slate-900">{fmtSEK(pricing.totalAmount)}</span>
              <span className="h-3.5 w-px bg-slate-300" />
              <span className="text-[12px] text-slate-500">{pricing.displayModeLabel} · Giltig till {fmtDate(offer.validUntil)}</span>
            </div>
            {/* PDF download */}
            <button
              onClick={() => void handleDownloadPdf()}
              disabled={downloading || !offer.generatedDocument}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow active:scale-[0.97] disabled:opacity-40"
              title="Ladda ner som PDF"
            >
              {downloading ? (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                <FileTextIcon size={13} />
              )}
              <span className="hidden sm:inline">{downloading ? 'Genererar...' : 'PDF'}</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {offer.generatedDocument && (
          downloading ? (
            <div className="h-0.5 w-full overflow-hidden bg-slate-100">
              <div className="h-full w-1/3 bg-slate-800 animate-[slide-indeterminate_1.4s_ease-in-out_infinite]" />
              <style>{`@keyframes slide-indeterminate{0%{transform:translateX(-100%);width:40%}50%{transform:translateX(150%);width:60%}100%{transform:translateX(300%);width:40%}}`}</style>
            </div>
          ) : (
            <div className="h-0.5 w-full bg-slate-100">
              <div className="h-full bg-slate-800 transition-[width] duration-75" style={{ width: `${scrollProgress}%` }} />
            </div>
          )
        )}
      </header>

      {/* ─── Content ─── */}
      <main ref={mainRef} className="h-[calc(100dvh-57px)] overflow-y-auto bg-slate-50 pb-16">
        <div className="mx-auto max-w-[900px] overflow-x-hidden px-0 sm:px-6 sm:pt-8">

        {offer.generatedDocument && documentReady && promoPageCount > 0 && (
          <div className="px-4 pb-4 pt-4 sm:px-0 sm:pt-0">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Snabbare till offerten
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {promoPageCount} introduktionssida{promoPageCount === 1 ? '' : 'or'} visas först. Hoppa direkt till pris och detaljer.
                </p>
              </div>
              <button
                type="button"
                onClick={handleJumpToOffer}
                className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                Hoppa till offert
              </button>
            </motion.div>
          </div>
        )}

        {/* Document iframe */}
        {offer.generatedDocument && (
          <motion.section
            ref={documentSectionRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04 }}
            className="mb-5 overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.07)] sm:rounded-2xl sm:border sm:border-slate-200/60"
          >
            <iframe
              ref={iframeRef}
              srcDoc={offer.generatedDocument}
              sandbox="allow-same-origin"
              title="Offertdokument"
              onLoad={handleIframeLoad}
              className="block w-full border-none"
              style={{ minHeight: '200px', overflow: 'hidden' }}
              scrolling="no"
            />
          </motion.section>
        )}

        {/* ─── Signing card ─── */}
        <div className="px-4 sm:px-0">
        {offer.generatedDocument && !documentReady && (
          <div className="mb-4 flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm text-slate-500 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            Anpassar offerten för din skärm...
          </div>
        )}
        <AnimatePresence mode="wait">
          {(!offer.generatedDocument || documentReady) && (!isDecline ? (
            <motion.section
              key="sign"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.07)]"
            >
              {/* Header */}
              <div className="border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900">
                      <ShieldIcon size={14} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Godkännande och underskrift</h2>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">Underteckna för att bekräfta offerten. Namn, datum och signatur sparas tillsammans med offerten.</p>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-right sm:px-3 sm:py-1.5">
                    <p className="text-xs font-bold tabular-nums text-slate-800 sm:text-sm">{fmtSEK(pricing.totalAmount)}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{pricing.displayModeLabel}</p>
                  </div>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {errMsg && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mx-4 mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-600 sm:mx-6">
                      <XCircleIcon size={14} className="shrink-0" />
                      {errMsg}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fields */}
              <div className="px-4 pt-4 sm:px-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Name */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <UserIcon size={12} />
                      Fullständigt namn
                    </label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Ditt namn"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-[border-color,box-shadow] focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                  {/* Date */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <CalendarIcon size={12} />
                      Datum
                    </label>
                    <input
                      type="text"
                      value={todaySv()}
                      readOnly
                      className="w-full cursor-default rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <EditIcon size={13} />
                    Signatur
                  </label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    Skriv
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {sigMode === 'type' ? (
                    <motion.div
                      key="type"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Font selector */}
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {SIG_FONTS.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setSigFont(f.id)}
                            className={`rounded-md px-2.5 py-1.5 text-[11px] transition-all ${
                              sigFont === f.id
                                ? 'border-2 border-slate-900 bg-slate-50 font-semibold text-slate-900'
                                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                            style={{ fontFamily: f.family }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                      {/* Typed signature */}
                      <div className="flex min-h-[68px] items-center rounded-lg border border-slate-200 bg-white px-4">
                        <input
                          type="text"
                          value={typedSig}
                          onChange={(e) => setTypedSig(e.target.value)}
                          placeholder="Skriv ditt namn här..."
                          className="w-full border-none bg-transparent p-0 text-[32px] text-slate-900 outline-none placeholder:text-slate-300"
                          style={{ fontFamily: selectedFont.family }}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="draw"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        ref={canvasWrapperRef}
                        className="relative h-[120px] overflow-hidden rounded-lg border border-slate-200 bg-white"
                        style={{ touchAction: 'none' }}
                      >
                        <SignatureCanvas ref={sigRef} penColor="#0f172a" canvasProps={{ style: { display: 'block', touchAction: 'none' } }} />
                        {/* Baseline */}
                        <div className="pointer-events-none absolute bottom-7 left-5 right-5 border-b border-dashed border-slate-200" />
                        {/* Hint */}
                        <span className="pointer-events-none absolute right-3 top-2 text-[10px] tracking-wide text-slate-300">
                          Rita din signatur
                        </span>
                      </div>
                      <div className="mt-1.5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => sigRef.current?.clear()}
                          className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-50"
                        >
                          <TrashIcon size={11} />
                          Rensa
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={() => setState('declining')}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                >
                  Avvisa
                </button>
                <button
                  type="button"
                  onClick={() => void handleSign()}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                >
                  <CheckCircleIcon size={15} />
                  {busy ? 'Signerar...' : 'Signera offert'}
                </button>
              </div>
            </motion.section>
          ) : (
            /* ─── Decline mode ─── */
            <motion.section
              key="decline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-2xl border border-red-200/70 bg-gradient-to-b from-red-50/75 to-white shadow-[0_2px_12px_rgba(0,0,0,0.07)]"
            >
              <div className="border-b border-red-100 px-5 py-4 sm:px-7 sm:py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <XCircleIcon size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-red-700">Avvisa offert</h2>
                    <p className="mt-0.5 text-[13px] text-red-700/75">Vi skickar besked direkt till ansvarig kontakt när du bekräftar avvisningen.</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-5 sm:px-7">
                <AnimatePresence>
                  {errMsg && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mb-3 overflow-hidden rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-600"
                    >
                      {errMsg}
                    </motion.div>
                  )}
                </AnimatePresence>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Anledning (valfri)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Berätta gärna varför..."
                  className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-[border-color,box-shadow] focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-7">
                <button
                  type="button"
                  onClick={() => { setState('ready'); setErrMsg(''); }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  onClick={() => void handleDecline()}
                  disabled={busy}
                  className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:bg-red-700 disabled:opacity-50"
                >
                  {busy ? 'Avvisar...' : 'Bekräfta avvisning'}
                </button>
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
        </div>

        {/* Mobile validity strip */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 mt-4 px-4">
          <CalendarIcon size={11} className="text-slate-500" />
          <p className="text-[12px] text-slate-600">Giltig till {fmtDate(offer.validUntil)}</p>
        </div>

        {/* Footer */}
        <p className="mt-6 px-4 text-center text-[12px] text-slate-500">
          Soleria offertportal · {offer?.recipientEmail}
        </p>
        </div>
      </main>
    </motion.div>
  );
}
