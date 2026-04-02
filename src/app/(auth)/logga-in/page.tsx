'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'credentials' | 'mfa';
type MfaMethod = 'totp' | 'webauthn' | 'backup_code';

// ── Icons (inline SVG — no extra dep) ─────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function FingerprintIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
      <path d="M2 12a10 10 0 0 1 18-6"/>
      <path d="M2 17.5A14.5 14.5 0 0 0 5 21"/>
      <path d="M8 2.13a10 10 0 0 1 11 14.68"/>
      <path d="M12 2a9.96 9.96 0 0 0-7 2.93"/>
      <path d="M8 10a4 4 0 0 1 8 0c0 1.78-.16 3.77-.3 4.93"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';

  const [step,       setStep]       = useState<Step>('credentials');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaCode,    setMfaCode]    = useState('');
  const [mfaMethods, setMfaMethods] = useState<MfaMethod[]>([]);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const hasPasskey = mfaMethods.includes('webauthn');

  // ── Step 1: email + password ────────────────────────────────────────────────

  async function handleCredentials(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, rememberMe }),
      });

      if (res.status === 202) {
        const json = await res.json().catch(() => ({})) as { data?: { methods?: MfaMethod[] } };
        setMfaMethods(json.data?.methods ?? ['totp']);
        setStep('mfa');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { detail?: string; error?: string };
        setError(data.detail ?? data.error ?? 'Inloggning misslyckades.');
        return;
      }

      window.location.replace(redirect);
    } catch {
      setError('Nätverksfel. Försök igen.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2a: TOTP / backup code ─────────────────────────────────────────────

  async function handleMfa(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: mfaCode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { detail?: string; error?: string };
        setError(data.detail ?? data.error ?? 'Ogiltig kod. Försök igen.');
        setMfaCode('');
        return;
      }

      window.location.replace(redirect);
    } catch {
      setError('Nätverksfel. Försök igen.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2b: Passkey / Face ID ──────────────────────────────────────────────

  async function handlePasskey() {
    setPasskeyLoading(true);
    setError('');
    try {
      const optRes = await fetch('/api/auth/webauthn/authenticate/options', { method: 'POST' });
      if (!optRes.ok) {
        const data = await optRes.json().catch(() => ({})) as { detail?: string };
        setError(data.detail ?? 'Kunde inte starta passkey-autentisering.');
        return;
      }
      const { data: optData } = await optRes.json() as { data: unknown };

      // Dynamically import to avoid SSR issues with the WebAuthn browser API
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const authResponse = await startAuthentication({ optionsJSON: optData as Parameters<typeof startAuthentication>[0]['optionsJSON'] });

      const verifyRes = await fetch('/api/auth/webauthn/authenticate/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(authResponse),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({})) as { detail?: string };
        setError(data.detail ?? 'Passkey-verifiering misslyckades.');
        return;
      }

      window.location.replace(redirect);
    } catch (err: unknown) {
      // User cancelled the native prompt — silently ignore
      if ((err as { name?: string }).name !== 'NotAllowedError') {
        setError('Passkey-autentisering misslyckades. Försök igen.');
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex bg-(--page-bg)">

      {/* ── Left decorative panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[420px] lg:shrink-0 relative overflow-hidden bg-[var(--accent)] flex-col items-start justify-between p-10">
        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        {/* Content */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <img src="/soleria-logo.svg" alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Soleria</span>
        </div>

        <div className="relative z-10">
          <p className="text-white/90 text-2xl font-semibold leading-snug mb-3">
            Välkommen tillbaka.
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            Logga in för att fortsätta till ditt konto.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-white/50 text-xs">
          <ShieldIcon />
          <span>Säkrad med tvåfaktorsautentisering</span>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] flex items-center justify-center shadow-lg">
            <img src="/soleria-logo.svg" alt="Soleria" className="w-7 h-7 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <span className="font-semibold text-xl text-(--text-primary) tracking-tight">Soleria</span>
        </div>

        <div className="w-full max-w-sm">

          {/* ── Credentials step ── */}
          {step === 'credentials' && (
            <div>
              <div className="mb-7">
                <h1 className="text-xl font-semibold text-(--text-primary) tracking-tight">Logga in</h1>
                <p className="text-sm text-(--text-muted) mt-1">Ange dina uppgifter för att fortsätta.</p>
              </div>

              <form onSubmit={handleCredentials} className="flex flex-col gap-4">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-(--text-secondary)" htmlFor="email">
                    E-postadress
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="namn@foretag.se"
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/60 transition-colors"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-(--text-secondary)" htmlFor="password">
                    Lösenord
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] pl-3 pr-10 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/60 transition-colors"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-secondary) transition-colors"
                      aria-label={showPw ? 'Dölj lösenord' : 'Visa lösenord'}
                    >
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border transition-colors ${rememberMe ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-[var(--surface-alt)] border-[var(--border)]'}`}>
                      {rememberMe && (
                        <svg className="w-full h-full p-0.5 text-white" viewBox="0 0 12 12" fill="none">
                          <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-(--text-secondary)">Kom ihåg mig i 30 dagar</span>
                </label>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2">
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 w-full rounded-lg bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60 disabled:cursor-wait mt-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Loggar in…
                    </span>
                  ) : 'Logga in'}
                </button>
              </form>

              {/* Dev login (non-production) */}
              {process.env.NODE_ENV !== 'production' && (
                <div className="mt-6 pt-5 border-t border-(--border) text-center">
                  <a
                    href={`/api/auth/dev-login?redirect=${encodeURIComponent(redirect)}`}
                    className="text-xs text-(--text-muted) hover:text-(--text-secondary) transition-colors"
                  >
                    Dev: logga in utan konto →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── MFA step ── */}
          {step === 'mfa' && (
            <div>
              <button
                type="button"
                onClick={() => { setStep('credentials'); setError(''); setMfaCode(''); }}
                className="flex items-center gap-1.5 text-xs text-(--text-muted) hover:text-(--text-secondary) transition-colors mb-6"
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Tillbaka
              </button>

              <div className="mb-7">
                <h1 className="text-xl font-semibold text-(--text-primary) tracking-tight">Tvåstegsverifiering</h1>
                <p className="text-sm text-(--text-muted) mt-1">
                  {hasPasskey
                    ? 'Verifiera med din passkey eller autentiseringsapp.'
                    : 'Ange koden från din autentiseringsapp eller ett reservkod.'}
                </p>
              </div>

              {/* Passkey button — shown when webauthn is available */}
              {hasPasskey && (
                <button
                  type="button"
                  onClick={() => void handlePasskey()}
                  disabled={passkeyLoading || loading}
                  className="w-full h-12 rounded-xl border-2 border-[var(--accent)]/30 bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/50 text-[var(--accent)] font-semibold text-sm flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 disabled:cursor-wait mb-4"
                >
                  {passkeyLoading ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : <FingerprintIcon />}
                  {passkeyLoading ? 'Väntar på passkey…' : 'Använd Face ID / Passkey'}
                </button>
              )}

              {/* Divider between passkey and TOTP */}
              {hasPasskey && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-[11px] text-(--text-muted) shrink-0">eller ange kod manuellt</span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
              )}

              {/* TOTP form */}
              <form onSubmit={handleMfa} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-(--text-secondary)" htmlFor="mfa-code">
                    Verifieringskod
                  </label>
                  <input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus={!hasPasskey}
                    required
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="123456"
                    maxLength={20}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm text-(--text-primary) text-center tracking-[0.25em] font-mono placeholder:tracking-normal placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/60 transition-colors"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2">
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || mfaCode.length < 1}
                  className="h-10 w-full rounded-lg bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60 disabled:cursor-wait"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Verifierar…
                    </span>
                  ) : 'Verifiera'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
