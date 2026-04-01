'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@shared/ui/input';
import { Button } from '@shared/ui/button';

type Step = 'credentials' | 'mfa';

function LoginForm() {
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
          <img src="/soleria-logo.png" alt="Soleria" className="h-12 w-auto" />
          <span className="font-heading text-xl font-semibold text-(--text-primary)">Soleria</span>
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
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-(--text-secondary) mb-1" htmlFor="password">
                    Lösenord
                  </label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Loggar in…' : 'Logga in'}
                </Button>

                <Link href="/register" className="text-sm text-(--text-muted) hover:text-(--text-secondary) text-center transition-colors">
                  Inget konto? Skapa ett
                </Link>
              </form>

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
                  <Input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="123456"
                    className="tracking-widest text-center"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Verifierar…' : 'Verifiera'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => { setStep('credentials'); setError(''); setMfaCode(''); }}
                >
                  ← Tillbaka
                </Button>
              </form>
            </>
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
