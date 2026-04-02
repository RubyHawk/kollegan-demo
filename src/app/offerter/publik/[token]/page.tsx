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

import { useState, useEffect, useRef, useCallback } from 'react';
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

// ─── Types ─────────────────────────────────────────────────────────────────────

type OfferStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

interface PublicOffer {
  id: string;
  title: string;
  status: OfferStatus;
  recipientName: string;
  recipientEmail: string;
  recipientCompany?: string;
  totalExVat: number;
  totalIncVat: number;
  validUntil: string;
  notes?: string;
  generatedDocument?: string;
  publicToken: string;
  publicTokenExpiresAt?: string;
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

// ─── PDF Download ──────────────────────────────────────────────────────────────

async function downloadPdf(documentHtml: string, filename: string) {
  const [html2canvas, { jsPDF }] = await Promise.all([
    import('html2canvas-pro').then((m) => m.default),
    import('jspdf'),
  ]);

  // Container must be exactly 816px — the A4 pixel width the document is designed for.
  // Any other width makes position:absolute fill-page images (width:816) overflow and get clipped.
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:816px;background:#fff;';
  container.innerHTML = documentHtml;

  // Strip decorative card styling from doc-wrapper.
  // New-format docs (with .page-content) carry their own padding inside each page-block;
  // adding extra padding to doc-wrapper would shrink page-block below 816px and clip images.
  const wrapper = container.querySelector('.doc-wrapper') as HTMLElement | null;
  const hasPageContent = !!container.querySelector('.page-content');
  if (wrapper) {
    wrapper.style.margin = '0';
    wrapper.style.border = 'none';
    wrapper.style.borderRadius = '0';
    wrapper.style.maxWidth = 'none';
    wrapper.style.boxShadow = 'none';
    // Only add wrapper padding for legacy docs that don't have .page-content padding
    wrapper.style.padding = hasPageContent ? '0' : '32px 40px';
  }
  // Hide signature fields in PDF
  container.querySelectorAll('[data-sig-field]').forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });

  document.body.appendChild(container);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth  = pdf.internal.pageSize.getWidth();
  const margin     = 0; // no margin — fill full A4 width for pixel-perfect output
  const imgWidth   = pageWidth - margin * 2;

  // Render each .page-block as its own PDF page so fill-page images never split mid-image.
  // Falls back to rendering the whole container when no page-blocks exist (legacy docs).
  const pageBlocks = Array.from(container.querySelectorAll<HTMLElement>('.page-block'));

  if (pageBlocks.length > 0) {
    for (let i = 0; i < pageBlocks.length; i++) {
      if (i > 0) pdf.addPage();
      const blockCanvas = await html2canvas(pageBlocks[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgH = (blockCanvas.height * imgWidth) / blockCanvas.width;
      pdf.addImage(blockCanvas.toDataURL('image/png'), 'PNG', margin, 0, imgWidth, imgH);
    }
  } else {
    // Legacy: single canvas capture + slice
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const pageHeight     = pdf.internal.pageSize.getHeight();
    const imgTotalHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgTotalHeight <= pageHeight) {
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, 0, imgWidth, imgTotalHeight);
    } else {
      const sliceHeight = Math.floor((pageHeight / imgTotalHeight) * canvas.height);
      let srcY = 0; let page = 0;
      while (srcY < canvas.height) {
        if (page > 0) pdf.addPage();
        const slice = document.createElement('canvas');
        slice.width  = canvas.width;
        slice.height = Math.min(sliceHeight, canvas.height - srcY);
        slice.getContext('2d')!.drawImage(canvas, 0, srcY, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
        const sliceH = (slice.height * imgWidth) / canvas.width;
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, 0, imgWidth, sliceH);
        srcY += sliceHeight; page++;
      }
    }
  }

  document.body.removeChild(container);
  pdf.save(filename);
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
  const [sigMode, setSigMode] = useState<SigMode>('type');
  const [sigFont, setSigFont] = useState<typeof SIG_FONTS[number]['id']>(SIG_FONTS[0].id);
  const [typedSig, setTypedSig] = useState('');

  const [scrollProgress, setScrollProgress] = useState(0);

  const sigRef = useRef<SignatureCanvas>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Scroll progress ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const rect = iframe.getBoundingClientRect();
      const iframeHeight = iframe.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrolled = -rect.top;
      const total = iframeHeight - viewportHeight;
      if (total <= 0) { setScrollProgress(100); return; }
      setScrollProgress(Math.min(100, Math.max(0, Math.round((scrolled / total) * 100))));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Iframe setup ─────────────────────────────────────────────────────────────
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // ── Inject responsive styles to prevent mobile overflow issues ──
    const responsiveStyle = doc.createElement('style');
    responsiveStyle.textContent = `
      *, *::before, *::after { box-sizing: border-box; }
      body { overflow-x: hidden !important; }
      /* Only set height:auto on images that don't have an explicit height style
         (fill-page images carry height:NNNpx inline and must keep it)           */
      img { max-width: 100% !important; display: block; }
      img:not([style*="height:"]) { height: auto; }
      table { max-width: 100% !important; width: 100%; table-layout: fixed; }
      td, th { word-break: break-word; overflow-wrap: break-word; }
      pre, code { white-space: pre-wrap !important; word-break: break-word !important; overflow-x: hidden !important; }
      /* Do NOT override .page-block overflow — it must stay hidden so each A4 page
         clips its own fill-page images at the 816×1056 boundary.                  */
    `;
    if (doc.head) {
      doc.head.appendChild(responsiveStyle);
    } else if (doc.body) {
      doc.body.insertBefore(responsiveStyle, doc.body.firstChild);
    }

    const wrapper = doc.querySelector('.doc-wrapper') as HTMLElement | null;
    // Detect new-format docs (have .page-content; padding lives there, not on .doc-wrapper)
    const hasPageContent = !!doc.querySelector('.page-content');
    if (wrapper) {
      const isMobile = window.innerWidth < 640;
      wrapper.style.margin = '0 auto';        // centre within iframe
      wrapper.style.border = 'none';
      wrapper.style.borderRadius = '0';
      // Keep max-width at 816px — this is the A4 pixel width the document is built for.
      // Setting it to 'none' widens .page-block beyond 816px so fill-page images
      // (position:absolute; left:0; width:816px) no longer cover the full "page".
      wrapper.style.maxWidth = '816px';
      wrapper.style.boxShadow = 'none';
      if (hasPageContent) {
        // New format: padding is on .page-content; leave doc-wrapper padding-free
        wrapper.style.padding = '0';
        // On mobile, override .page-content padding to compact value
        if (isMobile) {
          doc.querySelectorAll<HTMLElement>('.page-content').forEach((pc) => {
            pc.style.padding = '20px 16px';
          });
        }
      } else {
        // Old format: padding was on .doc-wrapper
        wrapper.style.padding = isMobile ? '20px 16px' : '40px 48px';
      }
    }
    doc.body.style.margin = '0';
    doc.body.style.padding = '0';
    doc.body.style.overflow = 'hidden';

    // Hide template signature blocks
    doc.querySelectorAll('[data-sig-field]').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });

    const resize = () => {
      if (!doc.body) return;
      // Reset height first to get accurate scrollHeight measurement
      iframe.style.height = 'auto';
      requestAnimationFrame(() => {
        if (doc.body) iframe.style.height = `${doc.body.scrollHeight}px`;
      });
    };
    resize();
    // Wait for all images to load before final resize
    const images = doc.querySelectorAll('img');
    if (images.length > 0) {
      let loadedCount = 0;
      images.forEach((img) => {
        if (img.complete) {
          loadedCount++;
          if (loadedCount === images.length) resize();
        } else {
          img.addEventListener('load', () => {
            loadedCount++;
            if (loadedCount === images.length) resize();
          });
          img.addEventListener('error', () => {
            loadedCount++;
            if (loadedCount === images.length) resize();
          });
        }
      });
    } else {
      resize();
    }
    new MutationObserver(resize).observe(doc.body, { childList: true, subtree: true, attributes: true });
  }, []);

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
    if (!signerName.trim()) { setErrMsg('Ange ditt fullstandiga namn.'); return; }
    const signatureImage = getSignatureImage();
    if (!signatureImage) { setErrMsg(sigMode === 'draw' ? 'Rita din namnteckning i rutan.' : 'Skriv din namnteckning.'); return; }
    setBusy(true); setErrMsg('');
    setState('signing');
    try {
      const res = await fetch(`/api/offers/public/${token}/sign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureImage, signerName: signerName.trim() }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})) as { detail?: string }; throw new Error(j.detail ?? `Fel ${res.status}`); }
      // Brief pause for the animation feel
      await new Promise((r) => setTimeout(r, 600));
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
      if (!res.ok) { const j = await res.json().catch(() => ({})) as { detail?: string }; throw new Error(j.detail ?? `Fel ${res.status}`); }
      setState('declined');
    } catch (e) { setErrMsg((e as Error).message); } finally { setBusy(false); }
  }, [token, comment]);

  const handleDownloadPdf = async () => {
    if (!offer?.generatedDocument) return;
    setDownloading(true);
    try {
      const safeName = offer.title.replace(/[^a-zA-Z0-9\u00C0-\u024F ]/g, '').trim().replace(/\s+/g, '-');
      await downloadPdf(offer.generatedDocument, `${safeName || 'offert'}.pdf`);
    } catch {
      setErrMsg('Kunde inte ladda ner PDF. Forsok igen.');
    } finally {
      setDownloading(false);
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
      expired:  { icon: <ClockIcon size={40} className="text-slate-400" />, title: 'Lanken har gatt ut', sub: 'Kontakta avsandaren for att fa en ny lank till offerten.' },
      error:    { icon: <XCircleIcon size={40} className="text-red-400" />, title: 'Offerten hittades inte', sub: errMsg || 'Kontrollera lanken och forsok igen.' },
      accepted: { icon: null, title: 'Offert signerad', sub: 'Tack! Avsandaren har meddelats om din signering.' },
      declined: { icon: <XCircleIcon size={40} className="text-slate-400" />, title: 'Offert avvisad', sub: 'Avsandaren har meddelats.' },
    };
    const cfg = configs[state];

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex min-h-[80vh] items-center justify-center px-6"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-10 text-center shadow-sm border border-slate-200/80">
            {state === 'accepted' ? (
              <SuccessCheckmark />
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50"
              >
                {cfg.icon}
              </motion.div>
            )}
            <h1 className="mb-2 text-xl font-bold text-slate-900">{cfg.title}</h1>
            <p className="text-sm leading-relaxed text-slate-500">{cfg.sub}</p>

            {state === 'accepted' && offer?.generatedDocument && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <button
                  onClick={() => void handleDownloadPdf()}
                  disabled={downloading}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      {/* ─── Sticky header ─── */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">

          <div className="flex items-center gap-3 min-w-0">
            <FileTextIcon size={16} className="shrink-0 text-slate-400" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-900">{offer.title}</h1>
              <p className="truncate text-[11px] text-slate-400">
                {offer.recipientName}{offer.recipientCompany ? ` / ${offer.recipientCompany}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <span className="text-sm font-bold tabular-nums text-slate-900">{fmtSEK(offer.totalIncVat)}</span>
              <span className="hidden sm:block h-3.5 w-px bg-slate-300" />
              <span className="hidden sm:block text-[11px] text-slate-400">Giltig till {fmtDate(offer.validUntil)}</span>
            </div>
            {/* PDF download */}
            <button
              onClick={() => void handleDownloadPdf()}
              disabled={downloading || !offer.generatedDocument}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-40"
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
        {/* Scroll progress bar / PDF indeterminate bar */}
        {offer.generatedDocument && (
          downloading ? (
            <div className="h-0.5 w-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-slate-900 w-1/3 animate-[slide-indeterminate_1.4s_ease-in-out_infinite]" />
              <style>{`
                @keyframes slide-indeterminate {
                  0%   { transform: translateX(-100%); width: 40%; }
                  50%  { transform: translateX(150%);  width: 60%; }
                  100% { transform: translateX(300%);  width: 40%; }
                }
              `}</style>
            </div>
          ) : (
            <div className="h-0.5 w-full bg-slate-100">
              <div
                className="h-full bg-slate-900 transition-[width] duration-75"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
          )
        )}
      </header>

      {/* ─── Content ─── */}
      <main className="pb-16 bg-slate-50 min-h-screen">
        <div className="mx-auto max-w-4xl px-0 sm:px-6 sm:pt-8 overflow-x-hidden">

        {/* Document */}
        {offer.generatedDocument && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-6 overflow-hidden bg-white border border-slate-200 sm:rounded-xl sm:shadow-sm"
          >
            <iframe
              ref={iframeRef}
              srcDoc={offer.generatedDocument}
              sandbox="allow-same-origin"
              title="Offertdokument"
              onLoad={handleIframeLoad}
              className="block w-full border-none"
              style={{ overflow: 'hidden', minHeight: '200px' }}
              scrolling="no"
            />
          </motion.section>
        )}

        {/* ─── Signing card ─── */}
        <div className="px-4 sm:px-0">
        <AnimatePresence mode="wait">
          {!isDecline ? (
            <motion.section
              key="sign"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              {/* Header */}
              <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900">
                      <ShieldIcon size={14} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Godkannande och underskrift</h2>
                      <p className="text-[12px] text-slate-400">Underteckna for att bekrafta offerten</p>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-right">
                    <p className="text-base font-bold tabular-nums text-emerald-700">{fmtSEK(offer.totalIncVat)}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-500">inkl. moms</p>
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
                    <div className="mx-6 mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-600 sm:mx-8">
                      <XCircleIcon size={14} className="shrink-0" />
                      {errMsg}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fields */}
              <div className="px-6 pt-5 sm:px-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Name */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <UserIcon size={13} />
                      Fullstandigt namn
                    </label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Ditt namn"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-[border-color,box-shadow] focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                  {/* Date */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <CalendarIcon size={13} />
                      Datum
                    </label>
                    <input
                      type="text"
                      value={todaySv()}
                      readOnly
                      className="w-full cursor-default rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="px-6 pt-5 pb-6 sm:px-8">
                <div className="mb-2 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <EditIcon size={13} />
                    Signatur
                  </label>
                  {/* Segmented control */}
                  <div className="flex rounded-md bg-slate-100 p-0.5">
                    {(['type', 'draw'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSigMode(m)}
                        className={`rounded-[5px] px-3.5 py-1 text-xs font-semibold transition-all ${
                          sigMode === m
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {m === 'type' ? 'Skriv' : 'Rita'}
                      </button>
                    ))}
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
                      <div className="mb-2.5 flex flex-wrap gap-1.5">
                        {SIG_FONTS.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setSigFont(f.id)}
                            className={`rounded-md px-3 py-1.5 text-xs transition-all ${
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
                      <div className="flex min-h-[72px] items-center rounded-lg border border-slate-200 bg-white px-5">
                        <input
                          type="text"
                          value={typedSig}
                          onChange={(e) => setTypedSig(e.target.value)}
                          placeholder="Skriv ditt namn har..."
                          className="w-full border-none bg-transparent p-0 text-3xl text-slate-900 outline-none placeholder:text-slate-300"
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
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:px-8">
                <button
                  type="button"
                  onClick={() => setState('declining')}
                  className="rounded-md border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
                >
                  Avvisa
                </button>
                <button
                  type="button"
                  onClick={() => void handleSign()}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-md bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                <h2 className="text-base font-bold text-red-600">Avvisa offert</h2>
                <p className="mt-1 text-[13px] text-slate-500">Avsandaren kommer att meddelas om ditt beslut.</p>
              </div>
              <div className="px-6 py-5 sm:px-8">
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
                  placeholder="Beratta garna varfor..."
                  className="w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-[border-color,box-shadow] focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:px-8">
                <button
                  type="button"
                  onClick={() => { setState('ready'); setErrMsg(''); }}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  onClick={() => void handleDecline()}
                  disabled={busy}
                  className="rounded-md bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? 'Avvisar...' : 'Bekrafta avvisning'}
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="mt-8 px-4 text-center text-[11px] text-slate-400">
          Elektronisk signering &middot; {offer?.recipientEmail}
        </p>
        </div>
      </main>
    </motion.div>
  );
}
