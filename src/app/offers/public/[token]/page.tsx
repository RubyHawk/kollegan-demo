'use client';

/**
 * /offers/public/[token]
 *
 * Public offer signing page.
 *
 * The document contains signature block placeholders (data-sig-field).
 * Clicking a placeholder opens a signing panel inline. Once all fields
 * are completed, the user can submit. The signing experience is clean
 * and professional — no duplicated sections.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';

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
type ActiveField = 'signature' | 'name' | 'date' | null;

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

  // Signing fields
  const [signerName, setSignerName] = useState('');
  const [sigMode, setSigMode] = useState<SigMode>('type');
  const [sigFont, setSigFont] = useState(SIG_FONTS[0].id);
  const [typedSig, setTypedSig] = useState('');
  const [signatureCompleted, setSignatureCompleted] = useState(false);
  const [nameCompleted, setNameCompleted] = useState(false);

  // Which field is currently open for editing
  const [activeField, setActiveField] = useState<ActiveField>(null);

  const sigRef = useRef<SignatureCanvas>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Update iframe placeholders when fields are completed ─────────────────────
  const updateIframePlaceholders = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const nameBlock = doc.querySelector('[data-sig-field="name"]') as HTMLElement | null;
    if (nameBlock) {
      if (nameCompleted && signerName.trim()) {
        nameBlock.style.borderColor = '#22c55e';
        nameBlock.style.background = '#f0fdf4';
        nameBlock.innerHTML = `
          <span style="font-size:16px;">✅</span>
          <div style="flex:1;">
            <p style="font-size:11px;color:#16a34a;margin:0 0 2px;font-weight:600;">Fullständigt namn</p>
            <p style="font-size:15px;color:#0f172a;margin:0;font-weight:600;">${signerName.trim().replace(/</g, '&lt;')}</p>
          </div>
          <span style="font-size:10px;color:#64748b;cursor:pointer;text-decoration:underline;" data-sig-edit="name">Ändra</span>`;
        nameBlock.querySelector('[data-sig-edit="name"]')?.addEventListener('click', (e) => {
          e.stopPropagation();
          setActiveField('name');
          setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
        });
      } else {
        nameBlock.style.borderColor = '#cbd5e1';
        nameBlock.style.background = '#f8fafc';
        nameBlock.style.cursor = 'pointer';
        nameBlock.innerHTML = `
          <span style="font-size:16px;">👤</span>
          <div style="flex:1;">
            <p style="font-weight:600;color:#334155;margin:0 0 2px;font-size:13px;">Fullständigt namn</p>
            <p style="font-size:11px;color:#94a3b8;margin:0;">Klicka för att fylla i</p>
          </div>
          <span style="font-size:10px;color:#fff;background:#0f172a;padding:4px 12px;border-radius:16px;font-weight:600;">Fyll i</span>`;
      }
      nameBlock.onclick = () => {
        setActiveField('name');
        setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      };
    }

    const dateBlock = doc.querySelector('[data-sig-field="date"]') as HTMLElement | null;
    if (dateBlock) {
      // Date is always auto-filled
      dateBlock.style.borderColor = '#22c55e';
      dateBlock.style.background = '#f0fdf4';
      dateBlock.style.cursor = 'default';
      dateBlock.innerHTML = `
        <span style="font-size:16px;">✅</span>
        <div style="flex:1;">
          <p style="font-size:11px;color:#16a34a;margin:0 0 2px;font-weight:600;">Signeringsdatum</p>
          <p style="font-size:15px;color:#0f172a;margin:0;font-weight:600;">${todaySv()}</p>
        </div>`;
    }

    const sigBlock = doc.querySelector('[data-sig-field="signature"]') as HTMLElement | null;
    if (sigBlock) {
      if (signatureCompleted) {
        sigBlock.style.borderColor = '#22c55e';
        sigBlock.style.background = '#f0fdf4';
        const font = SIG_FONTS.find((f) => f.id === sigFont) ?? SIG_FONTS[0];
        const preview = sigMode === 'type' && typedSig.trim()
          ? `<p style="font-family:${font.family};font-size:24px;color:#0f172a;margin:0;">${typedSig.trim().replace(/</g, '&lt;')}</p>`
          : `<p style="font-size:13px;color:#0f172a;margin:0;font-weight:600;">Signatur ritad ✓</p>`;
        sigBlock.innerHTML = `
          <span style="font-size:16px;">✅</span>
          <div style="flex:1;">
            <p style="font-size:11px;color:#16a34a;margin:0 0 2px;font-weight:600;">Signatur</p>
            ${preview}
          </div>
          <span style="font-size:10px;color:#64748b;cursor:pointer;text-decoration:underline;" data-sig-edit="sig">Ändra</span>`;
        sigBlock.querySelector('[data-sig-edit="sig"]')?.addEventListener('click', (e) => {
          e.stopPropagation();
          setSignatureCompleted(false);
          setActiveField('signature');
          setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
        });
      } else {
        sigBlock.style.borderColor = '#cbd5e1';
        sigBlock.style.background = '#f8fafc';
        sigBlock.style.cursor = 'pointer';
        sigBlock.innerHTML = `
          <span style="font-size:16px;">✍</span>
          <div style="flex:1;">
            <p style="font-weight:600;color:#334155;margin:0 0 2px;font-size:13px;">Signatur</p>
            <p style="font-size:11px;color:#94a3b8;margin:0;">Klicka för att signera</p>
          </div>
          <span style="font-size:10px;color:#fff;background:#0f172a;padding:4px 12px;border-radius:16px;font-weight:600;">Signera</span>`;
      }
      sigBlock.onclick = () => {
        if (!signatureCompleted) {
          setActiveField('signature');
          setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
        }
      };
    }

    // Resize iframe
    const iframe = iframeRef.current!;
    if (doc.body) iframe.style.height = `${doc.body.scrollHeight}px`;
  }, [signerName, nameCompleted, signatureCompleted, sigMode, typedSig, sigFont]);

  // ── Inject into iframe on load ───────────────────────────────────────────────
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // Strip internal card styling
    const wrapper = doc.querySelector('.doc-wrapper') as HTMLElement | null;
    if (wrapper) {
      wrapper.style.margin = '0';
      wrapper.style.padding = '20px 24px';
      wrapper.style.border = 'none';
      wrapper.style.borderRadius = '0';
      wrapper.style.maxWidth = 'none';
      wrapper.style.boxShadow = 'none';
    }
    doc.body.style.margin = '0';
    doc.body.style.padding = '0';

    updateIframePlaceholders();

    // Resize after images load
    const images = doc.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.complete) img.addEventListener('load', () => {
        if (doc.body) iframe.style.height = `${doc.body.scrollHeight}px`;
      });
    });
  }, [updateIframePlaceholders]);

  // Re-update placeholders when completion state changes
  useEffect(() => {
    updateIframePlaceholders();
  }, [updateIframePlaceholders]);

  // ── Resize draw canvas ───────────────────────────────────────────────────────
  useEffect(() => {
    if (sigMode !== 'draw' || activeField !== 'signature') return;
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;
    const syncSize = () => {
      const canvas = wrapper.querySelector('canvas');
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(wrapper.getBoundingClientRect().width);
      const h = 90;
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
  }, [sigMode, activeField]);

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

  // ── Confirm name field ───────────────────────────────────────────────────────
  const confirmName = () => {
    if (!signerName.trim()) { setErrMsg('Vänligen ange ditt namn.'); return; }
    setNameCompleted(true);
    setErrMsg('');
    setActiveField(null);
  };

  // ── Confirm signature field ──────────────────────────────────────────────────
  const confirmSignature = () => {
    if (sigMode === 'draw' && (!sigRef.current || sigRef.current.isEmpty())) {
      setErrMsg('Vänligen rita din namnteckning.'); return;
    }
    if (sigMode === 'type' && !typedSig.trim()) {
      setErrMsg('Vänligen skriv din namnteckning.'); return;
    }
    setSignatureCompleted(true);
    setErrMsg('');
    setActiveField(null);
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
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
    if (!nameCompleted || !signerName.trim()) { setErrMsg('Vänligen fyll i ditt namn i dokumentet.'); return; }
    if (!signatureCompleted) { setErrMsg('Vänligen signera i dokumentet.'); return; }
    const signatureImage = getSignatureImage();
    if (!signatureImage) { setErrMsg('Signatur saknas.'); return; }
    setBusy(true); setErrMsg('');
    try {
      const res = await fetch(`/api/offers/public/${token}/sign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureImage, signerName: signerName.trim() }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})) as { detail?: string }; throw new Error(j.detail ?? `Fel ${res.status}`); }
      setState('accepted');
    } catch (e) { setErrMsg((e as Error).message); } finally { setBusy(false); }
  }, [token, signerName, nameCompleted, signatureCompleted, getSignatureImage]);

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

  // ─── Styles ──────────────────────────────────────────────────────────────────

  const S: Record<string, React.CSSProperties> = {
    wrap:   { maxWidth: '680px', margin: '0 auto', padding: '16px 12px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
    card:   { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,.06)' },
    muted:  { color: '#64748b', fontSize: '12px', margin: 0 },
    err:    { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', color: '#dc2626', fontSize: '13px', marginBottom: '10px' },
    btn:    { padding: '9px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', border: 'none', transition: 'opacity .15s' },
    btnPri: { background: '#0f172a', color: '#fff' },
    btnDng: { background: '#fff', color: '#dc2626', border: '1px solid #fecaca' },
    btnGry: { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' },
    label:  { display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '3px' },
    input:  { width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 10px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
    center: { textAlign: 'center', padding: '40px 20px' },
    panel:  { padding: '14px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' },
  };

  const pill = (on: boolean): React.CSSProperties => ({
    padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 600,
    cursor: 'pointer', border: 'none', background: on ? '#0f172a' : '#f1f5f9', color: on ? '#fff' : '#64748b',
  });

  // ─── Terminal states ─────────────────────────────────────────────────────────

  if (state === 'loading') return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}><p style={S.muted}>Laddar offert…</p></div>;
  if (state === 'expired') return <div style={S.wrap}><div style={{ ...S.card, ...S.center }}><div style={{ fontSize: '40px', marginBottom: '12px' }}>⏰</div><h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>Länken har utgått</h2><p style={S.muted}>Kontakta avsändaren för en ny länk.</p></div></div>;
  if (state === 'error') return <div style={S.wrap}><div style={{ ...S.card, ...S.center }}><div style={{ fontSize: '40px', marginBottom: '12px' }}>❌</div><h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>Offerten hittades inte</h2><p style={S.muted}>{errMsg || 'Kontrollera länken.'}</p></div></div>;
  if (state === 'accepted') return <div style={S.wrap}><div style={{ ...S.card, ...S.center }}><div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div><h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>Offert signerad!</h2><p style={S.muted}>Tack! Avsändaren har meddelats.</p></div></div>;
  if (state === 'declined') return <div style={S.wrap}><div style={{ ...S.card, ...S.center }}><div style={{ fontSize: '40px', marginBottom: '12px' }}>🚫</div><h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>Offert avvisad</h2><p style={S.muted}>Avsändaren har meddelats.</p></div></div>;

  if (!offer) return null;
  const isDecline = state === 'declining';
  const font = SIG_FONTS.find((f) => f.id === sigFont) ?? SIG_FONTS[0];
  const allDone = nameCompleted && signatureCompleted;

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        {/* ── Header ── */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{offer.title}</h1>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
              Till {offer.recipientName}{offer.recipientCompany ? ` · ${offer.recipientCompany}` : ''} · Giltig till {fmtDate(offer.validUntil)}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{fmtSEK(offer.totalIncVat)}</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>inkl. moms</p>
          </div>
        </div>

        {/* ── Document ── */}
        {offer.generatedDocument && (
          <iframe
            ref={iframeRef}
            srcDoc={offer.generatedDocument}
            title="Offertdokument"
            onLoad={handleIframeLoad}
            style={{ width: '100%', border: 'none', display: 'block', overflow: 'hidden' }}
            scrolling="no"
          />
        )}

        {/* ── Inline editing panel (appears when a field is clicked) ── */}
        {activeField && (
          <div ref={panelRef} style={S.panel}>
            {errMsg && <div style={S.err}>{errMsg}</div>}

            {activeField === 'name' && (
              <>
                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>👤 Fullständigt namn</p>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Skriv ditt fullständiga namn"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') confirmName(); }}
                  style={S.input as React.CSSProperties}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button type="button" onClick={confirmName} style={{ ...S.btn, ...S.btnPri }}>Bekräfta</button>
                  <button type="button" onClick={() => { setActiveField(null); setErrMsg(''); }} style={{ ...S.btn, ...S.btnGry }}>Avbryt</button>
                </div>
              </>
            )}

            {activeField === 'signature' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>✍ Signatur</p>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <button type="button" onClick={() => setSigMode('type')} style={pill(sigMode === 'type')}>Skriv</button>
                    <button type="button" onClick={() => setSigMode('draw')} style={pill(sigMode === 'draw')}>Rita</button>
                  </div>
                </div>

                {sigMode === 'type' ? (
                  <>
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      {SIG_FONTS.map((f) => (
                        <button key={f.id} type="button" onClick={() => setSigFont(f.id)} style={{
                          padding: '3px 10px', borderRadius: '5px', fontSize: '11px',
                          border: sigFont === f.id ? '2px solid #0f172a' : '1px solid #e2e8f0',
                          background: sigFont === f.id ? '#f0f4ff' : '#fff',
                          fontFamily: f.family, cursor: 'pointer', color: '#0f172a',
                        }}>{f.label}</button>
                      ))}
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', background: '#fff', minHeight: '48px', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={typedSig}
                        onChange={(e) => setTypedSig(e.target.value)}
                        placeholder="Skriv ditt namn…"
                        autoFocus
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: font.family, fontSize: '26px', color: '#0f172a', padding: 0 }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div ref={canvasWrapperRef} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff', height: '90px', position: 'relative' }}>
                      <SignatureCanvas ref={sigRef} penColor="#0f172a" canvasProps={{ style: { display: 'block' } }} />
                      <div style={{ position: 'absolute', bottom: '20px', left: '12px', right: '12px', borderBottom: '1px dashed #e2e8f0', pointerEvents: 'none' }} />
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <button type="button" onClick={() => sigRef.current?.clear()} style={{ ...S.btn, ...S.btnGry, padding: '2px 10px', fontSize: '11px' }}>Rensa</button>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button type="button" onClick={confirmSignature} style={{ ...S.btn, ...S.btnPri }}>Bekräfta signatur</button>
                  <button type="button" onClick={() => { setActiveField(null); setErrMsg(''); }} style={{ ...S.btn, ...S.btnGry }}>Avbryt</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Bottom action bar ── */}
        {!isDecline ? (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {errMsg && !activeField && <div style={{ ...S.err, width: '100%' }}>{errMsg}</div>}
            {!allDone && (
              <p style={{ ...S.muted, flex: '1 1 auto', fontSize: '12px' }}>
                Fyll i alla fält i dokumentet ovan för att signera.
              </p>
            )}
            <button
              type="button"
              onClick={() => void handleSign()}
              disabled={busy || !allDone}
              style={{ ...S.btn, ...S.btnPri, opacity: busy || !allDone ? 0.4 : 1, flex: allDone ? '1 1 auto' : undefined }}
            >
              {busy ? 'Signerar…' : 'Signera offert'}
            </button>
            <button type="button" onClick={() => setState('declining')} style={{ ...S.btn, ...S.btnDng }}>Avvisa</button>
          </div>
        ) : (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>Avvisa offert</p>
            <p style={{ ...S.muted, marginBottom: '10px' }}>Avsändaren kommer att meddelas.</p>
            {errMsg && <div style={S.err}>{errMsg}</div>}
            <div style={{ marginBottom: '10px' }}>
              <label style={S.label}>Anledning (valfri)</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Berätta gärna varför…" style={{ ...S.input, resize: 'vertical' } as React.CSSProperties} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => void handleDecline()} disabled={busy} style={{ ...S.btn, background: '#dc2626', color: '#fff', opacity: busy ? 0.6 : 1 }}>{busy ? 'Avvisar…' : 'Bekräfta'}</button>
              <button type="button" onClick={() => { setState('ready'); setErrMsg(''); }} style={{ ...S.btn, ...S.btnGry }}>Avbryt</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
