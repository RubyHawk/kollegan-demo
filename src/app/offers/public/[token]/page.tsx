'use client';

/**
 * /offers/public/[token]
 *
 * Public offer signing page — no authentication required.
 * Accessible to the offer recipient via the unique publicToken link.
 *
 * Flow:
 *  1. Fetch offer by token (auto-marks as 'viewed' if status = 'sent')
 *  2. Render the generated HTML document in an iframe
 *  3. Show name, date, and signature pad + "Signera" / "Avvisa" buttons
 *  4. On sign: POST signature image + signer name → status becomes 'accepted'
 *  5. On decline: POST optional comment → status becomes 'declined'
 *
 * Security:
 *  - Token is a UUID (2^122 entropy)
 *  - Server checks publicTokenExpiresAt (30 days from sentAt)
 *  - Server validates signature data URL size (≤ 500 KB)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';

// ─── Types ─────────────────────────────────────────────────────────────────────

type OfferStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

interface PublicOffer {
  id:                  string;
  title:               string;
  status:              OfferStatus;
  recipientName:       string;
  recipientEmail:      string;
  recipientCompany?:   string;
  totalExVat:          number;
  totalIncVat:         number;
  validUntil:          string;
  notes?:              string;
  generatedDocument?:  string;
  publicToken:         string;
  publicTokenExpiresAt?: string;
}

type PageState = 'loading' | 'ready' | 'signing' | 'declining' | 'accepted' | 'declined' | 'expired' | 'error';

// ─── Utilities ─────────────────────────────────────────────────────────────────

function fmtSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function todayISO() {
  return new Date().toLocaleDateString('sv-SE');
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PublicOfferPage() {
  const params = useParams<{ token: string }>();
  const token  = params.token;

  const [state,        setState]        = useState<PageState>('loading');
  const [offer,        setOffer]        = useState<PublicOffer | null>(null);
  const [errMsg,       setErrMsg]       = useState('');
  const [comment,      setComment]      = useState('');
  const [signerName,   setSignerName]   = useState('');
  const [busy,         setBusy]         = useState(false);

  const sigRef = useRef<SignatureCanvas>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // ── Resize canvas to match container width (fixes blurry / misaligned drawing) ─
  useEffect(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;

    const syncSize = () => {
      const canvas = wrapper.querySelector('canvas');
      if (!canvas) return;
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(rect.width);
      const h = 160;
      // Only resize if dimensions actually changed to avoid clearing the drawing
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        // Save the current drawing before resize
        const dataUrl = sigRef.current && !sigRef.current.isEmpty()
          ? sigRef.current.getTrimmedCanvas().toDataURL('image/png')
          : null;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
        // Restore drawing after resize
        if (dataUrl && sigRef.current) {
          sigRef.current.fromDataURL(dataUrl, { width: w, height: h });
        }
      }
    };

    // Initial sync after mount
    const raf = requestAnimationFrame(syncSize);

    const observer = new ResizeObserver(syncSize);
    observer.observe(wrapper);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [state]); // re-run when state changes so canvas is available in DOM

  // ── Fetch offer ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch(`/api/offers/public/${token}`);
        if (res.status === 404 || res.status === 410) {
          setState('expired');
          return;
        }
        if (!res.ok) throw new Error(`Fel ${res.status}`);
        const json = await res.json() as { data: PublicOffer };
        const o = json.data;
        setOffer(o);
        setSignerName(o.recipientName ?? '');
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

  // ── Sign ──────────────────────────────────────────────────────────────────────
  const handleSign = useCallback(async () => {
    if (!signerName.trim()) {
      setErrMsg('Vänligen ange ditt namn.');
      return;
    }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErrMsg('Vänligen rita din namnteckning i fältet nedan.');
      return;
    }
    setBusy(true); setErrMsg('');
    try {
      const signatureImage = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
      const res = await fetch(`/api/offers/public/${token}/sign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ signatureImage, signerName: signerName.trim() }),
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
  }, [token, signerName]);

  // ── Decline ───────────────────────────────────────────────────────────────────
  const handleDecline = useCallback(async () => {
    setBusy(true); setErrMsg('');
    try {
      const res = await fetch(`/api/offers/public/${token}/decline`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ comment: comment.trim() || undefined }),
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

  // ─────────────────────────────────────────────────────────────────────────────

  const s = {
    wrapper: { maxWidth: '720px', margin: '0 auto', padding: '24px 16px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
    card:    { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.08)' },
    section: { padding: '24px 28px', borderTop: '1px solid #e2e8f0' },
    h1:      { margin: '0 0 4px 0', fontSize: '22px', fontWeight: 700, color: '#0f172a' },
    muted:   { color: '#64748b', fontSize: '13px', margin: 0 },
    btn:     { padding: '12px 28px', borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', border: 'none', transition: 'opacity .15s' },
    btnPri:  { background: '#0f172a', color: '#fff' },
    btnDng:  { background: '#fff', color: '#dc2626', border: '1px solid #fecaca' },
    btnGry:  { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' },
    err:     { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' },
    success: { textAlign: 'center' as const, padding: '48px 24px' },
    input:   { width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: 'inherit', outline: 'none' },
    label:   { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
  };

  // Loading
  if (state === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#64748b' }}>Laddar offert…</p>
      </div>
    );
  }

  // Expired / error
  if (state === 'expired') {
    return (
      <div style={s.wrapper}>
        <div style={{ ...s.card, ...s.success }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
          <h2 style={{ ...s.h1, marginBottom: '8px' }}>Länken har utgått</h2>
          <p style={s.muted}>Den här offertlänken är inte längre giltig. Kontakta avsändaren för en ny länk.</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={s.wrapper}>
        <div style={{ ...s.card, ...s.success }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ ...s.h1, marginBottom: '8px' }}>Offerten hittades inte</h2>
          <p style={s.muted}>{errMsg || 'Kontrollera länken och försök igen.'}</p>
        </div>
      </div>
    );
  }

  // Accepted
  if (state === 'accepted') {
    return (
      <div style={s.wrapper}>
        <div style={{ ...s.card, ...s.success }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ ...s.h1, marginBottom: '8px' }}>Offert signerad!</h2>
          <p style={s.muted}>Tack! Du har accepterat och signerat offerten. Avsändaren har fått ett meddelande.</p>
        </div>
      </div>
    );
  }

  // Declined
  if (state === 'declined') {
    return (
      <div style={s.wrapper}>
        <div style={{ ...s.card, ...s.success }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <h2 style={{ ...s.h1, marginBottom: '8px' }}>Offert avvisad</h2>
          <p style={s.muted}>Du har avvisat offerten. Avsändaren har fått ett meddelande.</p>
        </div>
      </div>
    );
  }

  if (!offer) return null;

  const isDeclineMode = state === 'declining';

  return (
    <div style={s.wrapper}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 6px 0' }}>Offert till {offer.recipientName}</p>
        <h1 style={s.h1}>{offer.title}</h1>
        {offer.recipientCompany && <p style={s.muted}>{offer.recipientCompany}</p>}
      </div>

      <div style={s.card}>
        {/* Summary strip */}
        <div style={{ padding: '20px 28px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ ...s.muted, marginBottom: '2px' }}>Totalt inkl. moms</p>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>{fmtSEK(offer.totalIncVat)}</p>
          </div>
          <div>
            <p style={{ ...s.muted, marginBottom: '2px' }}>Giltig till</p>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{fmtDate(offer.validUntil)}</p>
          </div>
          {offer.status === 'viewed' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>Visad</span>
            </div>
          )}
        </div>

        {/* Generated document */}
        {offer.generatedDocument ? (
          <div style={{ borderBottom: '1px solid #e2e8f0' }}>
            <iframe srcDoc={offer.generatedDocument} title="Offertdokument" style={{ width: '100%', border: 'none', minHeight: '500px', display: 'block' }}/>
          </div>
        ) : (
          <div style={{ ...s.section, borderTop: 'none' }}>
            {offer.notes && <p style={{ color: '#334155', lineHeight: '1.6', margin: 0 }}>{offer.notes}</p>}
          </div>
        )}

        {/* Signature / Decline section */}
        {!isDeclineMode ? (
          <div style={s.section}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Signera offert</h3>

            {errMsg && <div style={s.err}>{errMsg}</div>}

            {/* Name + Date on one row */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={s.label}>Namn</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Ditt fullständiga namn"
                  style={s.input}
                />
              </div>
              <div style={{ flex: '0 0 160px' }}>
                <label style={s.label}>Datum</label>
                <input
                  type="text"
                  value={todayISO()}
                  readOnly
                  style={{ ...s.input, background: '#f8fafc', color: '#64748b' }}
                />
              </div>
            </div>

            {/* Signature pad */}
            <div style={{ marginBottom: '12px' }}>
              <label style={s.label}>Namnteckning</label>
              <div
                ref={canvasWrapperRef}
                style={{ border: '2px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', background: '#fff', height: '160px' }}
              >
                <SignatureCanvas
                  ref={sigRef}
                  penColor="#0f172a"
                  canvasProps={{ style: { display: 'block' } }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <button onClick={() => sigRef.current?.clear()} style={{ ...s.btn, ...s.btnGry, padding: '8px 16px', fontSize: '13px' }}>
                Rensa
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => void handleSign()} disabled={busy} style={{ ...s.btn, ...s.btnPri, opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Signerar…' : 'Signera offert'}
              </button>
              <button onClick={() => setState('declining')} style={{ ...s.btn, ...s.btnDng }}>
                Avvisa offerten
              </button>
            </div>
          </div>
        ) : (
          <div style={s.section}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>Avvisa offert</h3>
            <p style={{ ...s.muted, marginBottom: '16px' }}>Vill du avvisa denna offert? Avsändaren kommer att meddelas.</p>

            {errMsg && <div style={s.err}>{errMsg}</div>}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Anledning (valfri)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Berätta gärna varför du avvisar…"
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => void handleDecline()} disabled={busy} style={{ ...s.btn, background: '#dc2626', color: '#fff', opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Avvisar…' : 'Bekräfta avvisning'}
              </button>
              <button onClick={() => { setState('ready'); setErrMsg(''); }} style={{ ...s.btn, ...s.btnGry }}>
                Avbryt
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '16px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
            E-signatur · Giltig till {fmtDate(offer.validUntil)} · {offer.recipientEmail}
          </p>
        </div>
      </div>
    </div>
  );
}
