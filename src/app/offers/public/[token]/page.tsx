'use client';

/**
 * /offers/public/[token]
 *
 * Public offer signing page. Full-width layout, professional design.
 * Document renders at full width, signing section below with draw/type modes.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';

// ─── SVG Icons (no emojis) ─────────────────────────────────────────────────────

const Icon = {
  pen: (sz = 18, col = '#64748b') => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  user: (sz = 18, col = '#64748b') => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  calendar: (sz = 18, col = '#64748b') => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  check: (sz = 18, col = '#16a34a') => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  checkCircle: (sz = 20, col = '#16a34a') => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>,
  x: (sz = 18, col = '#64748b') => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  clock: (sz = 40, col = '#94a3b8') => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  alert: (sz = 40, col = '#ef4444') => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  shield: (sz = 40, col = '#16a34a') => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  ban: (sz = 40, col = '#94a3b8') => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  eraser: (sz = 14, col = '#64748b') => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16l9.5-9.5a2.83 2.83 0 014 0l3 3a2.83 2.83 0 010 4L11 22"/></svg>,
  file: (sz = 16, col = '#64748b') => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
};

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

type PageState = 'loading' | 'ready' | 'declining' | 'accepted' | 'declined' | 'expired' | 'error';
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PublicOfferPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [state, setState] = useState<PageState>('loading');
  const [offer, setOffer] = useState<PublicOffer | null>(null);
  const [errMsg, setErrMsg] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const [signerName, setSignerName] = useState('');
  const [sigMode, setSigMode] = useState<SigMode>('type');
  const [sigFont, setSigFont] = useState(SIG_FONTS[0].id);
  const [typedSig, setTypedSig] = useState('');

  const sigRef = useRef<SignatureCanvas>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Inject styles into iframe on load ────────────────────────────────────────
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // Strip the internal card styling — parent handles layout
    const wrapper = doc.querySelector('.doc-wrapper') as HTMLElement | null;
    if (wrapper) {
      wrapper.style.margin = '0';
      wrapper.style.padding = '32px 40px';
      wrapper.style.border = 'none';
      wrapper.style.borderRadius = '0';
      wrapper.style.maxWidth = 'none';
      wrapper.style.boxShadow = 'none';
    }
    doc.body.style.margin = '0';
    doc.body.style.padding = '0';
    doc.body.style.overflow = 'hidden';

    // Hide signature blocks inside the document — signing is handled outside
    doc.querySelectorAll('[data-sig-field]').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });

    // Auto-resize iframe to content
    const resize = () => {
      if (doc.body) iframe.style.height = `${doc.body.scrollHeight}px`;
    };
    resize();
    doc.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', resize);
    });
    const observer = new MutationObserver(resize);
    observer.observe(doc.body, { childList: true, subtree: true, attributes: true });
  }, []);

  // ── Resize draw canvas ───────────────────────────────────────────────────────
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
    const observer = new ResizeObserver(syncSize);
    observer.observe(wrapper);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); };
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

  const getSignatureImage = useCallback((): string | null => {
    if (sigMode === 'draw') {
      if (!sigRef.current || sigRef.current.isEmpty()) return null;
      return sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    }
    if (!typedSig.trim()) return null;
    const font = SIG_FONTS.find((f) => f.id === sigFont) ?? SIG_FONTS[0];
    return textToSignatureImage(typedSig.trim(), font.family);
  }, [sigMode, typedSig, sigFont]);

  const handleSign = useCallback(async () => {
    if (!signerName.trim()) { setErrMsg('Ange ditt fullstandiga namn.'); return; }
    const signatureImage = getSignatureImage();
    if (!signatureImage) { setErrMsg(sigMode === 'draw' ? 'Rita din namnteckning i rutan.' : 'Skriv din namnteckning.'); return; }
    setBusy(true); setErrMsg('');
    try {
      const res = await fetch(`/api/offers/public/${token}/sign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureImage, signerName: signerName.trim() }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})) as { detail?: string }; throw new Error(j.detail ?? `Fel ${res.status}`); }
      setState('accepted');
    } catch (e) { setErrMsg((e as Error).message); } finally { setBusy(false); }
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

  // ─── Shared styles ───────────────────────────────────────────────────────────

  const font = SIG_FONTS.find((f) => f.id === sigFont) ?? SIG_FONTS[0];
  const ff = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif';

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f1f5f9',
    fontFamily: ff,
    color: '#0f172a',
  };

  // ─── Terminal states ─────────────────────────────────────────────────────────

  const statusPage = (icon: React.ReactNode, title: string, sub: string) => (
    <div style={pageStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ marginBottom: '20px' }}>{icon}</div>
        <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>{title}</h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b', maxWidth: '360px', lineHeight: 1.6 }}>{sub}</p>
      </div>
    </div>
  );

  if (state === 'loading') return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Laddar offert...</p>
      </div>
    </div>
  );
  if (state === 'expired') return statusPage(Icon.clock(), 'Lanken har gatt ut', 'Kontakta avsandaren for att fa en ny lank till offerten.');
  if (state === 'error') return statusPage(Icon.alert(), 'Offerten hittades inte', errMsg || 'Kontrollera lanken och forsok igen.');
  if (state === 'accepted') return statusPage(Icon.shield(), 'Offert signerad', 'Tack! Avsandaren har meddelats om din signering.');
  if (state === 'declined') return statusPage(Icon.ban(), 'Offert avvisad', 'Avsandaren har meddelats.');

  if (!offer) return null;
  const isDecline = state === 'declining';

  return (
    <div style={pageStyle}>
      {/* ─── Top bar ─── */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            {Icon.file(18, '#94a3b8')}
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{offer.title}</h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                {offer.recipientName}{offer.recipientCompany ? ` / ${offer.recipientCompany}` : ''}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{fmtSEK(offer.totalIncVat)}</p>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', letterSpacing: '0.03em' }}>INKL. MOMS</p>
            </div>
            <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Giltig till</p>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>{fmtDate(offer.validUntil)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main content ─── */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* Document section */}
        {offer.generatedDocument && (
          <section style={{
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            marginBottom: '24px',
          }}>
            <iframe
              ref={iframeRef}
              srcDoc={offer.generatedDocument}
              title="Offertdokument"
              onLoad={handleIframeLoad}
              style={{ width: '100%', border: 'none', display: 'block', overflow: 'hidden' }}
              scrolling="no"
            />
          </section>
        )}

        {/* ─── Signing section ─── */}
        {!isDecline ? (
          <section style={{
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}>
            {/* Section header */}
            <div style={{ padding: '20px 32px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Godkannande och underskrift</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Genom att underteckna bekraftar du att offerten godkants och att villkoren accepteras.
              </p>
            </div>

            {errMsg && (
              <div style={{ margin: '16px 32px 0', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 14px', color: '#dc2626', fontSize: '13px' }}>
                {errMsg}
              </div>
            )}

            {/* Fields grid */}
            <div style={{ padding: '20px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  {Icon.user(14, '#64748b')}
                  Fullstandigt namn
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Ditt namn"
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: '14px',
                    border: '1px solid #d1d5db', borderRadius: '6px',
                    outline: 'none', fontFamily: ff, boxSizing: 'border-box',
                    transition: 'border-color .15s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#0f172a'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
                />
              </div>

              {/* Date */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  {Icon.calendar(14, '#64748b')}
                  Datum
                </label>
                <input
                  type="text"
                  value={todaySv()}
                  readOnly
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: '14px',
                    border: '1px solid #d1d5db', borderRadius: '6px',
                    outline: 'none', fontFamily: ff, boxSizing: 'border-box',
                    background: '#f8fafc', color: '#64748b', cursor: 'default',
                  }}
                />
              </div>
            </div>

            {/* Signature */}
            <div style={{ padding: '0 32px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                  {Icon.pen(14, '#64748b')}
                  Signatur
                </label>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px', gap: '2px' }}>
                  <button type="button" onClick={() => setSigMode('type')} style={{
                    padding: '5px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', border: 'none', transition: 'all .15s',
                    background: sigMode === 'type' ? '#fff' : 'transparent',
                    color: sigMode === 'type' ? '#0f172a' : '#64748b',
                    boxShadow: sigMode === 'type' ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
                  }}>Skriv</button>
                  <button type="button" onClick={() => setSigMode('draw')} style={{
                    padding: '5px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', border: 'none', transition: 'all .15s',
                    background: sigMode === 'draw' ? '#fff' : 'transparent',
                    color: sigMode === 'draw' ? '#0f172a' : '#64748b',
                    boxShadow: sigMode === 'draw' ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
                  }}>Rita</button>
                </div>
              </div>

              {sigMode === 'type' ? (
                <div>
                  {/* Font selector */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    {SIG_FONTS.map((f) => (
                      <button key={f.id} type="button" onClick={() => setSigFont(f.id)} style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '13px',
                        border: sigFont === f.id ? '2px solid #0f172a' : '1px solid #e2e8f0',
                        background: sigFont === f.id ? '#f8fafc' : '#fff',
                        fontFamily: f.family, cursor: 'pointer', color: '#0f172a',
                        transition: 'all .15s',
                      }}>{f.label}</button>
                    ))}
                  </div>
                  {/* Signature preview area */}
                  <div style={{
                    border: '1px solid #d1d5db', borderRadius: '8px',
                    background: '#fff', minHeight: '70px',
                    display: 'flex', alignItems: 'center', padding: '12px 20px',
                  }}>
                    <input
                      type="text"
                      value={typedSig}
                      onChange={(e) => setTypedSig(e.target.value)}
                      placeholder="Skriv ditt namn har..."
                      style={{
                        border: 'none', background: 'transparent', outline: 'none',
                        width: '100%', fontFamily: font.family, fontSize: '28px',
                        color: '#0f172a', padding: 0,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    ref={canvasWrapperRef}
                    style={{
                      border: '1px solid #d1d5db', borderRadius: '8px',
                      overflow: 'hidden', background: '#fff',
                      height: '120px', position: 'relative',
                    }}
                  >
                    <SignatureCanvas ref={sigRef} penColor="#0f172a" canvasProps={{ style: { display: 'block' } }} />
                    {/* Baseline */}
                    <div style={{ position: 'absolute', bottom: '28px', left: '20px', right: '20px', borderBottom: '1px dashed #e2e8f0', pointerEvents: 'none' }} />
                    {/* Placeholder text */}
                    <div style={{ position: 'absolute', top: '8px', right: '12px', fontSize: '10px', color: '#cbd5e1', pointerEvents: 'none', letterSpacing: '0.02em' }}>
                      Rita din signatur
                    </div>
                  </div>
                  <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => sigRef.current?.clear()} style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px', borderRadius: '4px', fontSize: '12px',
                      border: '1px solid #e2e8f0', background: '#fff', color: '#64748b',
                      cursor: 'pointer',
                    }}>
                      {Icon.eraser(12, '#94a3b8')}
                      Rensa
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{
              padding: '16px 32px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}>
              <button type="button" onClick={() => setState('declining')} style={{
                padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', background: '#fff', color: '#dc2626',
                border: '1px solid #fecaca', transition: 'all .15s',
              }}>
                Avvisa
              </button>
              <button type="button" onClick={() => void handleSign()} disabled={busy} style={{
                padding: '10px 28px', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
                cursor: busy ? 'wait' : 'pointer', background: '#0f172a', color: '#fff',
                border: 'none', opacity: busy ? 0.6 : 1, transition: 'opacity .15s',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {Icon.check(16, '#fff')}
                {busy ? 'Signerar...' : 'Signera offert'}
              </button>
            </div>
          </section>
        ) : (
          /* ─── Decline mode ─── */
          <section style={{
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 32px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>Avvisa offert</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Avsandaren kommer att meddelas om ditt beslut.</p>
            </div>
            <div style={{ padding: '20px 32px' }}>
              {errMsg && (
                <div style={{ marginBottom: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 14px', color: '#dc2626', fontSize: '13px' }}>
                  {errMsg}
                </div>
              )}
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Anledning (valfri)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Beratta garna varfor..."
                style={{
                  width: '100%', border: '1px solid #d1d5db', borderRadius: '6px',
                  padding: '10px 12px', fontSize: '14px', fontFamily: ff,
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{
              padding: '16px 32px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex', gap: '10px', justifyContent: 'flex-end',
            }}>
              <button type="button" onClick={() => { setState('ready'); setErrMsg(''); }} style={{
                padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', background: '#fff', color: '#64748b',
                border: '1px solid #e2e8f0',
              }}>Avbryt</button>
              <button type="button" onClick={() => void handleDecline()} disabled={busy} style={{
                padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                cursor: busy ? 'wait' : 'pointer', background: '#dc2626', color: '#fff',
                border: 'none', opacity: busy ? 0.6 : 1,
              }}>{busy ? 'Avvisar...' : 'Bekrafta avvisning'}</button>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer style={{ textAlign: 'center', padding: '24px 0 0', color: '#94a3b8', fontSize: '11px' }}>
          <p style={{ margin: 0 }}>Elektronisk signering &middot; {offer.recipientEmail}</p>
        </footer>
      </main>
    </div>
  );
}
