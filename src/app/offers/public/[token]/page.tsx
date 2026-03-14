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
 *  3. Show signature pad + "Signera" / "Avvisa" buttons
 *  4. On sign: POST signature image → status becomes 'accepted'
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

// Injected at build time — if NEXT_PUBLIC_DOCUSIGN_ENABLED=true the DocuSign
// button is shown instead of the canvas pad.
const DOCUSIGN_ENABLED = process.env.NEXT_PUBLIC_DOCUSIGN_ENABLED === 'true';

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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PublicOfferPage() {
  const params = useParams<{ token: string }>();
  const token  = params.token;

  // Handle DocuSign return query params (?signed=1 or ?declined=1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('signed')   === '1') setState('accepted');
    if (sp.get('declined') === '1') setState('declined');
  }, []);

  const [state,        setState]        = useState<PageState>('loading');
  const [offer,        setOffer]        = useState<PublicOffer | null>(null);
  const [errMsg,       setErrMsg]       = useState('');
  const [comment,      setComment]      = useState('');
  const [busy,         setBusy]         = useState(false);
  const [dsRedirecting, setDsRedirecting] = useState(false);

  const sigRef = useRef<SignatureCanvas>(null);

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
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErrMsg('Vänligen rita din namnteckning i fältet ovan.');
      return;
    }
    setBusy(true); setErrMsg('');
    try {
      const signatureImage = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
      const res = await fetch(`/api/offers/public/${token}/sign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ signatureImage }),
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
  }, [token]);

  // ── DocuSign redirect ─────────────────────────────────────────────────────────
  const handleDocuSign = useCallback(async () => {
    setDsRedirecting(true); setErrMsg('');
    try {
      const res = await fetch('/api/offers/docusign/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ token }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `Fel ${res.status}`);
      }
      const j = await res.json() as { signingUrl: string };
      window.location.href = j.signingUrl;
    } catch (e) {
      setErrMsg((e as Error).message);
      setDsRedirecting(false);
    }
  }, [token]);

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
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Signera offert</h3>

            {errMsg && <div style={s.err}>{errMsg}</div>}

            {DOCUSIGN_ENABLED ? (
              /* ── DocuSign embedded signing ── */
              <>
                <p style={{ ...s.muted, marginBottom: '20px' }}>
                  Klicka nedan för att signera offerten med säker e-signatur via DocuSign. Du omdirigeras tillbaka när du är klar.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={() => void handleDocuSign()}
                    disabled={dsRedirecting}
                    style={{ ...s.btn, ...s.btnPri, opacity: dsRedirecting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {dsRedirecting ? 'Omdirigerar…' : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Signera med DocuSign
                      </>
                    )}
                  </button>
                  <button onClick={() => setState('declining')} style={{ ...s.btn, ...s.btnDng }}>
                    Avvisa offerten
                  </button>
                </div>
                <p style={{ marginTop: '16px', fontSize: '11px', color: '#94a3b8' }}>
                  Din signatur är rättsligt bindande enligt EU eIDAS-förordningen.
                </p>
              </>
            ) : (
              /* ── Canvas signature (default) ── */
              <>
                <p style={{ ...s.muted, marginBottom: '16px' }}>Rita din namnteckning i fältet nedan och klicka på &ldquo;Signera&rdquo;.</p>
                <div style={{ border: '2px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', background: '#fff' }}>
                  <SignatureCanvas
                    ref={sigRef}
                    penColor="#0f172a"
                    canvasProps={{ style: { width: '100%', height: '160px', display: 'block' } }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  <button onClick={() => sigRef.current?.clear()} style={{ ...s.btn, ...s.btnGry, padding: '8px 16px', fontSize: '13px' }}>
                    Rensa
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={() => void handleSign()} disabled={busy} style={{ ...s.btn, ...s.btnPri, opacity: busy ? 0.6 : 1 }}>
                    {busy ? 'Signerar…' : '✍️  Signera offert'}
                  </button>
                  <button onClick={() => setState('declining')} style={{ ...s.btn, ...s.btnDng }}>
                    Avvisa offerten
                  </button>
                </div>
              </>
            )}
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
            Säker e-signatur · Giltig till {fmtDate(offer.validUntil)} · {offer.recipientEmail}
          </p>
        </div>
      </div>
    </div>
  );
}
