'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';

const DEMO_ACCOUNTS = [
  { label: 'Receptionist', email: 'receptionist@demo-hotel.com' },
  { label: 'Manager', email: 'manager@demo-hotel.com' },
  { label: 'Admin', email: 'admin@demo-hotel.com' },
];
const DEMO_PASSWORD = 'demo1234';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Inloggning misslyckades.');
        return;
      }

      // Full page reload so SSE initializes cleanly after auth cookie is set.
      // router.push() causes a race where full_state arrives before store
      // listeners are attached, leaving skeleton loaders stuck forever.
      window.location.href = redirect;
    } catch {
      setError('Nätverksfel. Försök igen.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError('');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
            </svg>
          </div>
          <span className="font-heading text-xl font-semibold text-[var(--text-primary)]">Kollegan</span>
        </div>

        {/* Login card */}
        <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] shadow-lg">
          <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Logga in</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1" htmlFor="email">
                E-post
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1" htmlFor="password">
                Lösenord
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-light)] transition-colors disabled:opacity-60"
            >
              {loading ? 'Loggar in…' : 'Logga in'}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-0)]">
          <p className="text-xs text-[var(--text-muted)] mb-3 font-medium uppercase tracking-wide">
            Demokonton — lösenord: <code className="font-mono bg-[var(--surface-1)] px-1 py-0.5 rounded">{DEMO_PASSWORD}</code>
          </p>
          <div className="flex flex-col gap-1.5">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => fillDemo(a.email)}
                className="flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-[var(--surface-1)] transition-colors group"
              >
                <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                  {a.label}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono">{a.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
