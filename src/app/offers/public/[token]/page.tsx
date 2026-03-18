'use client';

/**
 * /offers/public/[token]
 *
 * Public offer signing page — no authentication required.
 *
 * Flow:
 *  1. Fetch offer by token (auto-marks as 'viewed')
 *  2. Render document in iframe
 *  3. Inline signing section: draw or type signature, name, auto-date
 *  4. POST signature + signer name → accepted
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

// ─── Signature font styles ─────────────────────────────────────────────────────

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

/** Render typed text to a canvas and return data URL */
function textToSignatureImage(text: string, fontFamily: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 150;
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
  const [signerName, setSignerName] = useState('');
  const [busy, setBusy] = useState(false);

  // Signature mode
  const [sigMode, setSigMode] = useState<SigMode>('type');
  const [sigFont, setSigFont] = useState(SIG_FONTS[0].id);
  const [typedSig, setTypedSig] = useState('');

  const sigRef = useRef<SignatureCanvas>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // ── Resize canvas to match container ─────────────────────────────────────────
  useEffect(() => {
    if (sigMode !== 'draw') return;
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;

    const syncSize = () => {
      const canvas = wrapper.querySelector('canvas');
      if (!canvas) return;
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(rect.width);
      const h = 120;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        const dataUrl = sigRef.current && !sigRef.current.isEmpty()
          ? sigRef.current.getTrimmedCanvas().toDataURL('image/png')
          : null;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
        if (dataUrl && sigRef.current) {
          sigRef.current.fromDataURL(dataUrl, { width: w, height: h });
        }
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
      } catch (e) {
        setErrMsg((e as Error).message);
        setState('error');
      }
    })();
  }, [token]);

  // ── Get signature image based on current mode ────────────────────────────────
  const getSignatureImage = useCallback((): string | null => {
    if (sigMode === 'draw') {
      if (!sigRef.current || sigRef.current.isEmpty()) return null;
      return sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    }
    // Type mode
    if (!typedSig.trim()) return null;
    const font = SIG_FONTS.find((f) => f.id === sigFont) ?? SIG_FONTS[0];
    return textToSignatureImage(typedSig.trim(), font.family);
  }, [sigMode, typedSig, sigFont]);

  // ── Sign ─────────────────────────────────────────────────────────────────────
  const handleSign = useCallback(async () => {
    if (!signerName.trim()) { setErrMsg('Vänligen ange ditt namn.'); return; }
    const signatureImage = getSignatureImage();
    if (!signatureImage) {
      setErrMsg(sigMode === 'draw' ? 'Vänligen rita din namnteckning.' : 'Vänligen skriv din namnteckning.');
      return;
    }
    setBusy(true); setErrMsg('');
    try {
      const res = await fetch(`/api/offers/public/${token}/sign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureImage, signerName: signerName.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Fel ${res.status}`);
      }
      setState('accepted');
    } catch (e) {
      setErrMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [token, signerName, getSignatureImage, sigMode]);

  // ── Decline ──────────────────────────────────────────────────────────────────
  const handleDecline = useCallback(async () => {
    setBusy(true); setErrMsg('');
    try {
      const res = await fetch(`/api/offers/public/${token}/decline`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment.trim() || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Fel ${res.status}`);
      }
      setState('declined');
    } catch (e) {
      setErrMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [token, comment]);

  // ─── Styles ──────────────────────────────────────────────────────────────────

  const c = {
    wrapper:  { maxWidth: '720px', margin: '0 auto', padding: '24px 16px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' } as React.CSSProperties,
    card:     { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.08)' } as React.CSSProperties,
    muted:    { color: '#64748b', fontSize: '13px', margin: 0 } as React.CSSProperties,
    err:      { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '12px' } as React.CSSProperties,
    btn:      { padding: '10px 24px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', border: 'none', transition: 'opacity .15s' } as React.CSSProperties,
    btnPri:   { background: '#0f172a', color: '#fff' } as React.CSSProperties,
    btnDng:   { background: '#fff', color: '#dc2626', border: '1px solid #fecaca' } as React.CSSProperties,
    btnGry:   { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' } as React.CSSProperties,
    label:    { display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' } as React.CSSProperties,
    input:    { width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: 'inherit', outline: 'none' } as React.CSSProperties,
    success:  { textAlign: 'center' as const, padding: '48px 24px' } as React.CSSProperties,
  };

  const pill = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all .15s',
    background: active ? '#0f172a' : '#f1f5f9',
    color: active ? '#fff' : '#64748b',
  });

  // ─── Terminal states ─────────────────────────────────────────────────────────

  if (state === 'loading') {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><p style={c.muted}>Laddar offert…</p></div>;
  }
  if (state === 'expired') {
    return <div style={c.wrapper}><div style={{ ...c.card, ...c.success }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div><h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700 }}>Länken har utgått</h2><p style={c.muted}>Kontakta avsändaren för en ny länk.</p></div></div>;
  }
  if (state === 'error') {
    return <div style={c.wrapper}><div style={{ ...c.card, ...c.success }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div><h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700 }}>Offerten hittades inte</h2><p style={c.muted}>{errMsg || 'Kontrollera länken och försök igen.'}</p></div></div>;
  }
  if (state === 'accepted') {
    return <div style={c.wrapper}><div style={{ ...c.card, ...c.success }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div><h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700 }}>Offert signerad!</h2><p style={c.muted}>Tack! Avsändaren har fått ett meddelande.</p></div></div>;
  }
  if (state === 'declined') {
    return <div style={c.wrapper}><div style={{ ...c.card, ...c.success }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div><h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700 }}>Offert avvisad</h2><p style={c.muted}>Avsändaren har fått ett meddelande.</p></div></div>;
  }

  if (!offer) return null;
  const isDeclineMode = state === 'declining';
  const selectedFont = SIG_FONTS.find((f) => f.id === sigFont) ?? SIG_FONTS[0];

  return (
    <div style={c.wrapper}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 4px' }}>Offert till {offer.recipientName}</p>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{offer.title}</h1>
      </div>

      <div style={c.card}>
        {/* Summary strip */}
        <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <p style={{ ...c.muted, fontSize: '11px', marginBottom: '1px' }}>Totalt inkl. moms</p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{fmtSEK(offer.totalIncVat)}</p>
          </div>
          <div>
            <p style={{ ...c.muted, fontSize: '11px', marginBottom: '1px' }}>Giltig till</p>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{fmtDate(offer.validUntil)}</p>
          </div>
        </div>

        {/* Document */}
        {offer.generatedDocument && (
          <div style={{ borderBottom: '1px solid #e2e8f0' }}>
            <iframe srcDoc={offer.generatedDocument} title="Offertdokument" style={{ width: '100%', border: 'none', minHeight: '420px', display: 'block' }} />
          </div>
        )}

        {/* ── Signing section ─────────────────────────────────────────────────── */}
        {!isDeclineMode ? (
          <div style={{ padding: '20px' }}>
            {/* Approval header */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 18px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Godkännande och underskrift</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                Genom att underteckna bekräftar du att offerten godkänts och att ovanstående villkor accepteras.
              </p>
            </div>

            {errMsg && <div style={c.err}>{errMsg}</div>}

            {/* Name + Date row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <div style={{ flex: '1 1 0' }}>
                <label style={c.label}>👤 Fullständigt namn</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Ditt namn"
                  style={c.input}
                />
              </div>
              <div style={{ flex: '0 0 130px' }}>
                <label style={c.label}>📅 Datum</label>
                <input type="text" value={todaySv()} readOnly style={{ ...c.input, background: '#f8fafc', color: '#64748b' }} />
              </div>
            </div>

            {/* Signature area */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ ...c.label, margin: 0 }}>✍ Signatur</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button type="button" onClick={() => setSigMode('type')} style={pill(sigMode === 'type')}>Skriv</button>
                  <button type="button" onClick={() => setSigMode('draw')} style={pill(sigMode === 'draw')}>Rita</button>
                </div>
              </div>

              {sigMode === 'type' ? (
                <>
                  {/* Font picker */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {SIG_FONTS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSigFont(f.id)}
                        style={{
                          padding: '4px 12px', borderRadius: '6px', fontSize: '12px',
                          border: sigFont === f.id ? '2px solid #0f172a' : '1px solid #e2e8f0',
                          background: sigFont === f.id ? '#f0f4ff' : '#fff',
                          fontFamily: f.family, cursor: 'pointer', color: '#0f172a',
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {/* Typed signature input */}
                  <input
                    type="text"
                    value={typedSig}
                    onChange={(e) => setTypedSig(e.target.value)}
                    placeholder="Skriv ditt namn"
                    style={{ ...c.input, fontFamily: selectedFont.family, fontSize: '24px', padding: '12px 14px', height: '56px' }}
                  />
                  {/* Preview */}
                  {typedSig.trim() && (
                    <div style={{ marginTop: '6px', padding: '10px 16px', border: '1px dashed #cbd5e1', borderRadius: '8px', background: '#fafbfc' }}>
                      <p style={{ margin: 0, fontFamily: selectedFont.family, fontSize: '32px', color: '#0f172a' }}>
                        {typedSig}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div
                    ref={canvasWrapperRef}
                    style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff', height: '120px', position: 'relative' }}
                  >
                    <SignatureCanvas
                      ref={sigRef}
                      penColor="#0f172a"
                      canvasProps={{ style: { display: 'block' } }}
                    />
                    {/* Baseline hint */}
                    <div style={{ position: 'absolute', bottom: '28px', left: '16px', right: '16px', borderBottom: '1px dashed #e2e8f0', pointerEvents: 'none' }} />
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <button type="button" onClick={() => sigRef.current?.clear()} style={{ ...c.btn, ...c.btnGry, padding: '4px 14px', fontSize: '12px' }}>
                      Rensa
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => void handleSign()} disabled={busy} style={{ ...c.btn, ...c.btnPri, opacity: busy ? 0.6 : 1, flex: '1 1 auto' }}>
                {busy ? 'Signerar…' : 'Signera offert'}
              </button>
              <button type="button" onClick={() => setState('declining')} style={{ ...c.btn, ...c.btnDng }}>
                Avvisa
              </button>
            </div>
          </div>
        ) : (
          /* ── Decline mode ──────────────────────────────────────────────────── */
          <div style={{ padding: '20px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>Avvisa offert</p>
            <p style={{ ...c.muted, marginBottom: '12px' }}>Avsändaren kommer att meddelas.</p>

            {errMsg && <div style={c.err}>{errMsg}</div>}

            <div style={{ marginBottom: '12px' }}>
              <label style={c.label}>Anledning (valfri)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Berätta gärna varför…"
                style={{ ...c.input, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => void handleDecline()} disabled={busy} style={{ ...c.btn, background: '#dc2626', color: '#fff', opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Avvisar…' : 'Bekräfta'}
              </button>
              <button type="button" onClick={() => { setState('ready'); setErrMsg(''); }} style={{ ...c.btn, ...c.btnGry }}>
                Avbryt
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '10px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
            E-signatur · {offer.recipientEmail}
          </p>
        </div>
      </div>
    </div>
  );
}
