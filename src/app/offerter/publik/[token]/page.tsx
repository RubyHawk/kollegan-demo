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
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import {
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
import { summarizePersistedOfferPricing } from '@modules/supporting/offers/domain/pricing';

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
  lineItems: Array<{ quantity: number; unit?: string; unitPrice: number; vatRate: number; discount?: number }>;
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

function PdfBadgePill({
  className = '',
  labelClassName = '',
}: {
  className?: string;
  labelClassName?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex min-w-[34px] items-center justify-center rounded-full bg-red-600 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] leading-none text-white ${className}`}
    >
      <span className={labelClassName}>PDF</span>
    </span>
  );
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function fmtSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(n);
}
function fmtQuantityWithUnit(quantity: number, unit?: string) {
  const formattedQuantity = new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: Number.isInteger(quantity) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(quantity) ? 0 : 2,
  }).format(quantity);
  const trimmedUnit = unit?.trim() ?? '';
  const normalizedUnit = trimmedUnit.toLocaleLowerCase('sv-SE');
  const displayUnit = (
    ['m2', 'm^2', 'm²', 'kvm'].includes(normalizedUnit) ? 'm²'
      : ['m3', 'm^3', 'm³'].includes(normalizedUnit) ? 'm³'
        : trimmedUnit || 'st'
  );
  return `${formattedQuantity} ${displayUnit}`;
}
const SWEDISH_MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'] as const;

function formatCompactSwedishDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getDate()} ${SWEDISH_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

function fmtDate(iso: string) {
  return formatCompactSwedishDate(iso);
}
function todaySv() {
  return formatCompactSwedishDate(new Date());
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

function normalizeOfferText(text: string): string {
  return normalizeBrokenSwedish(text)
    .replace(/Ã…/g, 'Å')
    .replace(/Ã„/g, 'Ä')
    .replace(/Ã–/g, 'Ö')
    .replace(/Ã¥/g, 'å')
    .replace(/Ã¤/g, 'ä')
    .replace(/Ã¶/g, 'ö')
    .replace(/Â /g, '\u00a0')
    .replace(/Â·/g, '·')
    .replace(/Â(?=[\u00a0 0-9%.,:;|kr])/g, '');
}

function compactDateText(value: string): string {
  const trimmed = normalizeOfferText(value).trim();
  const parts = trimmed.match(/^(\d{1,2})\s+([A-Za-zÅÄÖåäö.]+)\s+(\d{4})$/);
  if (!parts) return trimmed;

  const [, dayValue, monthValue, yearValue] = parts;
  const normalizedMonth = monthValue.toLocaleLowerCase('sv-SE').replace(/\.$/, '');
  const monthMap: Record<string, number> = {
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
    december: 11, dec: 11,
  };
  const monthIndex = monthMap[normalizedMonth];
  if (monthIndex == null) return trimmed;

  return `${Number(dayValue)} ${SWEDISH_MONTHS_SHORT[monthIndex]} ${yearValue}`;
}

function isPromoPageBlock(pageBlock: HTMLElement): boolean {
  const pageContent = pageBlock.querySelector<HTMLElement>('.page-content') ?? pageBlock;
  const text = pageContent.innerText.replace(/\s+/g, ' ').trim();
  const topLevelChildren = Array.from(pageContent.children) as HTMLElement[];
  const hasEdgeToEdgeAbsoluteImage = topLevelChildren.some((child) => child.style.position === 'absolute');
  const hasMeaningfulInlineContent = topLevelChildren.some((child) => {
    if (child.style.position === 'absolute') return false;
    const childText = child.innerText.replace(/\s+/g, ' ').trim();
    return childText.length >= 40 || /^(H[1-6]|UL|OL|TABLE)$/.test(child.tagName);
  });
  const hasStructuredOfferContent = !!pageContent.querySelector(
    '.offer-shell, .offer-items, .offer-summary, [data-var="lineItems"], table',
  );

  return hasEdgeToEdgeAbsoluteImage && !hasMeaningfulInlineContent && !hasStructuredOfferContent && text.length < 40;
}

function findFirstOfferPageIndex(pageBlocks: HTMLElement[]): number {
  const firstOfferPageIndex = pageBlocks.findIndex((pageBlock) => !isPromoPageBlock(pageBlock));
  return firstOfferPageIndex === -1 ? 0 : firstOfferPageIndex;
}

function findOfferAnchor(pageBlock: HTMLElement | null): HTMLElement | null {
  if (!pageBlock) return null;

  return pageBlock.querySelector<HTMLElement>(
    '.offer-shell__topline, .offer-shell, .offer-section, .offer-items, .offer-summary, h1, h2, table',
  );
}

function looksLikeLegacyLineItemTableText(text: string): boolean {
  const normalized = text
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('sv-SE');

  const hasHeader = normalized.includes('BESKRIVNING') || normalized.includes('PRODUKT ELLER TJÄNST');
  const hasColumns = normalized.includes('ANTAL')
    && (normalized.includes('À-PRIS') || normalized.includes('Å-PRIS') || normalized.includes('A-PRIS'))
    && normalized.includes('MOMS')
    && normalized.includes('BELOPP');

  return hasHeader && hasColumns;
}

function stripLegacyLineItemTables(root: ParentNode): void {
  const hasStructuredItems = !!root.querySelector('.offer-items, .offer-items__table, .offer-items__cards, .offer-item-card');
  if (!hasStructuredItems) return;

  root.querySelectorAll<HTMLTableSectionElement>('thead').forEach((section) => {
    if (looksLikeLegacyLineItemTableText(section.innerText)) {
      section.parentElement?.remove();
    }
  });

  root.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
    if (looksLikeLegacyLineItemTableText(table.innerText)) {
      table.remove();
    }
  });
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
      html:not(.offer-mobile) .offer-shell__header {
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.9fr) !important;
        gap: 36px !important;
        align-items: center !important;
        padding-bottom: 30px !important;
        border-bottom: 2px solid #dbe5f1 !important;
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
        justify-items: stretch !important;
        text-align: center !important;
        gap: 0 !important;
      }
      html:not(.offer-mobile) .offer-shell__status,
      html:not(.offer-mobile) .offer-shell__eyebrow,
      html:not(.offer-mobile) .offer-shell__lead,
      html:not(.offer-mobile) .offer-shell__customer-label {
        display: none !important;
      }
      html:not(.offer-mobile) .offer-shell__meta dl {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 0 !important;
      }
      html:not(.offer-mobile) .offer-shell__meta dl div {
        grid-template-columns: 1fr !important;
        gap: 8px !important;
        padding: 0 18px !important;
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
        font-size: 12px !important;
        font-weight: 700 !important;
        letter-spacing: 0 !important;
        text-transform: none !important;
        text-align: center !important;
        color: #657b9c !important;
      }
      html:not(.offer-mobile) .offer-shell__meta dd {
        font-size: 18px !important;
        font-weight: 700 !important;
        text-align: center !important;
        color: #1f335b !important;
        white-space: nowrap !important;
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
        font-size: 76px !important;
        line-height: 0.95 !important;
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
        border-radius: 28px !important;
        box-shadow: 8px 8px 0 #e8eff8 !important;
      }
      html:not(.offer-mobile) .offer-items__head,
      html:not(.offer-mobile) .offer-item-row {
        gap: 0 !important;
      }
      html:not(.offer-mobile) .offer-items__head {
        padding: 18px 22px 12px !important;
        background: #ffffff !important;
        color: #1f335b !important;
        font-size: 16px !important;
        letter-spacing: 0 !important;
        text-transform: none !important;
      }
      html:not(.offer-mobile) .offer-items__head span {
        display: flex !important;
        min-height: 46px !important;
        align-items: center !important;
        justify-content: flex-end !important;
        padding: 0 14px !important;
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
        padding: 24px 22px 26px !important;
        border-bottom: 0 !important;
      }
      html:not(.offer-mobile) .offer-item-row__product {
        gap: 12px !important;
        padding-right: 18px !important;
      }
      html:not(.offer-mobile) .offer-item-row__title {
        font-size: 18px !important;
        line-height: 1.22 !important;
        color: #1f335b !important;
      }
      html:not(.offer-mobile) .offer-item-row__detail {
        max-width: 30ch !important;
        font-size: 12px !important;
        line-height: 1.46 !important;
        color: #3d557b !important;
      }
      html:not(.offer-mobile) .offer-item-row__value {
        display: flex !important;
        align-items: flex-start !important;
        justify-content: flex-end !important;
        padding: 8px 14px 0 !important;
        font-size: 15px !important;
        line-height: 1.2 !important;
        font-weight: 700 !important;
        color: #1f335b !important;
        white-space: nowrap !important;
      }
      html:not(.offer-mobile) .offer-item-row__value--strong {
        font-size: 17px !important;
        font-weight: 800 !important;
      }
      html:not(.offer-mobile) .offer-summary,
      html:not(.offer-mobile) .offer-summary--below {
        width: min(380px, 100%) !important;
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
        margin-top: 26px !important;
      }
      html:not(.offer-mobile) .offer-summary__row {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        align-items: center !important;
        gap: 18px !important;
        padding: 11px 16px !important;
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
        margin-top: 10px !important;
        padding: 16px 18px !important;
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
        font-size: 22px !important;
        font-weight: 700 !important;
        line-height: 1 !important;
      }
      html:not(.offer-mobile) .offer-summary__total-subcopy {
        font-size: 11px !important;
        font-weight: 700 !important;
        line-height: 1.1 !important;
      }
      html:not(.offer-mobile) .offer-summary__row--total strong {
        font-size: 18px !important;
        letter-spacing: -0.02em !important;
      }
      html:not(.offer-mobile) .offer-section--terms {
        margin-top: 28px !important;
      }
      html:not(.offer-mobile) .offer-shell__footer {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 28px !important;
        padding-top: 28px !important;
        margin-top: 42px !important;
        border-top: 1px solid #dbe5f1 !important;
      }
      html:not(.offer-mobile) .offer-shell__footer div {
        justify-items: center !important;
        text-align: center !important;
        gap: 10px !important;
        font-size: 14px !important;
        line-height: 1.35 !important;
      }
      html:not(.offer-mobile) .offer-shell__footer strong {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        color: #1f335b !important;
        font-size: 13px !important;
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
        const res = await fetch(`/api/offers/public/${token}`);
        if (res.status === 404 || res.status === 410) { setState('expired'); return; }
        if (!res.ok) throw new Error(`Fel ${res.status}`);
        const json = await res.json() as { data: PublicOffer };
        const o = json.data;
        setOffer(o);
        setSignerName(o.recipientName ?? '');
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
    const url = `/api/offers/public/${token}/pdf`;
    const previewWindow = window.open('', '_blank');
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('download_failed');
      const blob = await response.blob();
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
                  {downloading ? 'Laddar ner...' : 'Ladda ner som PDF'}
                  <PdfBadgePill />
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
  const pricing = summarizePersistedOfferPricing(offer);
  const hasPromoHero = promoPageCount > 0;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#edf3fb_42%,_#e8eef8_100%)]"
    >
      {/* ─── Sticky header ─── */}
      <header className="sticky top-0 z-20 px-3 pt-3 sm:px-6 sm:pt-2">
        <div className={`mx-auto overflow-hidden rounded-[24px] border backdrop-blur-xl transition-colors sm:max-w-[900px] sm:border-slate-200/80 sm:bg-white/95 sm:shadow-[0_8px_22px_rgba(15,23,42,0.07)] ${hasPromoHero ? 'border-white/18 bg-white/12 shadow-[0_18px_42px_rgba(9,18,35,0.18)]' : 'border-slate-200/80 bg-white/92 shadow-[0_12px_30px_rgba(15,23,42,0.08)]'}`}>
          <div className="px-4 py-3 sm:px-3.5 sm:py-2">
            <div className="flex items-center gap-3 sm:min-h-0">
              <div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-slate-200 bg-gradient-to-br from-white to-slate-100 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:h-8 sm:w-8 sm:rounded-xl">
                  <BrandMark size={18} alt="" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Publik offert
                  </p>
                  <h1 className="truncate text-[15px] font-semibold leading-[1.1] text-slate-900 sm:text-[14px]">{offer.title}</h1>
                  <p className="truncate text-[12px] leading-tight text-slate-500 sm:mt-0.5 sm:text-[11px]">
                    {offer.recipientName}
                    {offer.recipientCompany ? ` · ${offer.recipientCompany}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:hidden">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Total
                    </p>
                    <span className="text-[11px] font-medium text-slate-500">{pricing.displayModeLabel}</span>
                  </div>
                  <p className="mt-1 text-[19px] font-semibold tabular-nums leading-none text-slate-950">
                    {fmtSEK(pricing.totalAmount)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Giltig till {fmtDate(offer.validUntil)}</p>
                </div>
                <button
                  onClick={() => void handleDownloadPdf()}
                  disabled={downloading || !offer.generatedDocument}
                  className="flex h-9 shrink-0 items-center gap-2 rounded-[16px] border border-slate-200/90 bg-white px-3 text-[13px] font-semibold text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition-all duration-200 hover:bg-slate-50 active:scale-[0.97] disabled:opacity-40"
                  title="Ladda ner PDF"
                  aria-label={downloading ? 'Genererar PDF' : 'Ladda ner PDF'}
                >
                  {downloading ? (
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : (
                    <>
                      <span>Ladda ner</span>
                      <PdfBadgePill />
                    </>
                  )}
                  {downloading ? <span>Genererar...</span> : null}
                </button>
              </div>

              <div className="hidden shrink-0 items-center gap-2 sm:flex sm:gap-2.5">
                <div className="hidden sm:flex min-w-[214px] items-center justify-between gap-3 rounded-[16px] border border-slate-200/80 bg-slate-50/90 px-3 py-1.5">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Total
                    </p>
                    <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-slate-950">
                      {fmtSEK(pricing.totalAmount)}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-500">{pricing.displayModeLabel} · Giltig till {fmtDate(offer.validUntil)}</span>
                </div>
                <button
                  onClick={() => void handleDownloadPdf()}
                  disabled={downloading || !offer.generatedDocument}
                  className="flex h-9 items-center gap-2 rounded-[16px] border border-slate-200/90 bg-white px-3 text-[13px] font-semibold text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition-all duration-200 hover:bg-slate-50 active:scale-[0.97] disabled:opacity-40 sm:text-xs"
                  title="Ladda ner PDF"
                >
                  {downloading ? (
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : (
                    <>
                      <span>Ladda ner</span>
                      <PdfBadgePill className="min-w-[32px] px-2 py-[4px] text-[8px]" />
                    </>
                  )}
                  {downloading ? <span>Genererar...</span> : null}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main
        ref={mainRef}
        className="bg-transparent pb-8 sm:pb-24"
      >
        <div className="mx-auto max-w-[900px] overflow-x-hidden px-0 sm:px-6 sm:pt-2">

        {/* Document iframe */}
        {offer.generatedDocument && (
          <motion.section
            ref={documentSectionRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04 }}
            className={promoPageCount > 0
              ? 'mb-6 overflow-visible bg-transparent shadow-none sm:rounded-[26px]'
              : 'mb-6 overflow-visible bg-transparent shadow-none sm:mx-0 sm:overflow-hidden sm:rounded-[28px] sm:border sm:border-white/75 sm:bg-white/92 sm:shadow-[0_20px_42px_rgba(15,23,42,0.08)]'}
          >
            <iframe
              ref={iframeRef}
              srcDoc={iframeDocumentHtml}
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
          <div className="mb-4 flex items-center justify-center rounded-[20px] border border-slate-200/70 bg-white/95 px-4 py-3 text-sm text-slate-500 shadow-[0_12px_28px_rgba(15,23,42,0.06)] backdrop-blur">
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
              className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur"
            >
              {/* Header */}
              <div className="border-b border-slate-200/60 px-4 py-4 sm:px-6 sm:py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-slate-900 to-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                      <ShieldIcon size={14} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-bold text-slate-900 sm:text-sm">Godkännande och underskrift</h2>
                      <p className="mt-1 text-[12px] leading-relaxed text-slate-500">Underteckna för att bekräfta offerten. Namn, datum och signatur sparas tillsammans med offerten.</p>
                    </div>
                  </div>
                  <div className="self-start rounded-[16px] border border-slate-200 bg-slate-50/90 px-3 py-2 text-left sm:text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Total</p>
                    <p className="mt-1 text-sm font-bold tabular-nums text-slate-800">{fmtSEK(pricing.totalAmount)}</p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">{pricing.displayModeLabel}</p>
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
                  <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setSigMode('type')}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        sigMode === 'type'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Skriv
                    </button>
                    <button
                      type="button"
                      onClick={openDrawModal}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        sigMode === 'draw'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Rita
                    </button>
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
                      <p className="mb-2 text-[11px] text-slate-500">
                        Signaturen uppdateras automatiskt från fältet <span className="font-semibold text-slate-700">Fullständigt namn</span>.
                      </p>
                      <div className="flex min-h-[86px] items-center rounded-xl border border-slate-200 bg-white px-4 py-4">
                        {typedSignatureText ? (
                          <span
                            className="block w-full text-[32px] leading-none text-slate-900"
                            style={{ fontFamily: selectedFont.family }}
                          >
                            {typedSignatureText}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-300">Ditt namn visas här när du fyllt i det ovan.</span>
                        )}
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
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex min-h-[96px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4">
                          {drawnSignature ? (
                            <Image
                              src={drawnSignature}
                              alt="Ritad signatur"
                              width={260}
                              height={72}
                              unoptimized
                              className="max-h-[72px] w-auto object-contain"
                            />
                          ) : (
                            <div className="text-center">
                              <p className="text-sm font-medium text-slate-700">Ingen ritad signatur sparad ännu</p>
                              <p className="mt-1 text-xs text-slate-500">Tryck på knappen nedan för att öppna ritytan.</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={openDrawModal}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                          >
                            {drawnSignature ? 'Rita om i modal' : 'Öppna rityta'}
                          </button>
                          <button
                            type="button"
                            onClick={clearSavedDrawSignature}
                            disabled={!drawnSignature}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <TrashIcon size={11} />
                            Rensa
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action bar */}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-200/70 bg-slate-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <button
                  type="button"
                  onClick={() => setState('declining')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 sm:w-auto sm:py-2"
                >
                  Avvisa
                </button>
                <button
                  type="button"
                  onClick={() => void handleSign()}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 sm:w-auto sm:min-w-[210px] sm:py-2.5"
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
              className="overflow-hidden rounded-[30px] border border-red-200/70 bg-gradient-to-b from-red-50/75 to-white shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
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

        <AnimatePresence>
          {drawModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end bg-slate-950/55 p-3 sm:items-center sm:justify-center sm:p-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-full rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.28)] sm:max-w-2xl"
              >
                <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Rita din signatur</h3>
                      <p className="mt-1 text-sm text-slate-500">Skriv under med finger eller mus och spara signaturen när den ser rätt ut.</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeDrawModal}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                    >
                      Stäng
                    </button>
                  </div>
                </div>

                <div className="px-4 py-4 sm:px-6">
                  {drawModalError && (
                    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                      {drawModalError}
                    </div>
                  )}
                  <div
                    ref={canvasWrapperRef}
                    className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    style={{ touchAction: 'none' }}
                  >
                    <SignatureCanvas
                      ref={sigRef}
                      penColor="#0f172a"
                      canvasProps={{ style: { display: 'block', width: '100%', height: '220px', touchAction: 'none' } }}
                    />
                    <div className="pointer-events-none absolute bottom-10 left-6 right-6 border-b border-dashed border-slate-200" />
                    <span className="pointer-events-none absolute right-4 top-3 text-[11px] tracking-wide text-slate-300">
                      Rita här
                    </span>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <button
                    type="button"
                    onClick={clearDrawCanvas}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <TrashIcon size={13} />
                    Rensa
                  </button>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={closeDrawModal}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      Avbryt
                    </button>
                    <button
                      type="button"
                      onClick={saveDrawSignature}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      Spara signatur
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
