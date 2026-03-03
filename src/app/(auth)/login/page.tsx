'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Step = 'credentials' | 'mfa';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';

  const [step, setStep]       = useState<Step>('credentials');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 202) {
        // MFA required — challenge cookie is set; move to step 2
        setStep('mfa');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? data.error ?? 'Inloggning misslyckades.');
        return;
      }

      // Full page reload so SSE initializes cleanly after auth cookie is set.
      window.location.href = redirect;
    } catch {
      setError('Nätverksfel. Försök igen.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mfaCode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? data.error ?? 'Ogiltig kod. Försök igen.');
        setMfaCode('');
        return;
      }

      window.location.href = redirect;
    } catch {
      setError('Nätverksfel. Försök igen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--page-bg) px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
            </svg>
          </div>
          <span className="font-heading text-xl font-semibold text-(--text-primary)">Kollegan</span>
        </div>

        {/* Login card */}
        <div className="p-8 rounded-2xl border border-(--border) bg-(--surface-0) shadow-lg">
          {step === 'credentials' ? (
            <>
              <h1 className="text-lg font-semibold text-(--text-primary) mb-6">Logga in</h1>

              <form onSubmit={handleCredentials} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-(--text-secondary) mb-1" htmlFor="email">
                    E-post
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-(--border) bg-(--surface-1) text-(--text-primary) text-sm focus:outline-none focus:border-(--accent)"
                  />
                </div>

                <div>
                  <label className="block text-sm text-(--text-secondary) mb-1" htmlFor="password">
                    Lösenord
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-(--border) bg-(--surface-1) text-(--text-primary) text-sm focus:outline-none focus:border-(--accent)"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-lg bg-(--accent) text-white text-sm font-medium hover:bg-(--accent-light) transition-colors disabled:opacity-60"
                >
                  {loading ? 'Loggar in…' : 'Logga in'}
                </button>

                <Link href="/register" className="text-sm text-(--text-muted) hover:text-(--text-secondary) text-center transition-colors">
                  Inget konto? Skapa ett
                </Link>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-(--text-primary) mb-2">Tvåstegsverifiering</h1>
              <p className="text-sm text-(--text-secondary) mb-6">
                Ange koden från din autentiseringsapp eller ett reservkod.
              </p>

              <form onSubmit={handleMfa} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-(--text-secondary) mb-1" htmlFor="mfa-code">
                    Verifieringskod
                  </label>
                  <input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-2 rounded-lg border border-(--border) bg-(--surface-1) text-(--text-primary) text-sm focus:outline-none focus:border-(--accent) tracking-widest text-center"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-lg bg-(--accent) text-white text-sm font-medium hover:bg-(--accent-light) transition-colors disabled:opacity-60"
                >
                  {loading ? 'Verifierar…' : 'Verifiera'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setError(''); setMfaCode(''); }}
                  className="text-sm text-(--text-muted) hover:text-(--text-secondary) text-center transition-colors"
                >
                  ← Tillbaka
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
