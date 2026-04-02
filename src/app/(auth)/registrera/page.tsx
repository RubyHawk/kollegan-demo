'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Input } from '@shared/ui/input';
import { Button } from '@shared/ui/button';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Registreringen gick inte att slutföra.');
        return;
      }

      window.location.href = '/';
    } catch {
      setError('Nätverksfel. Försök igen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--page-bg) px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/soleria-logo.svg" alt="Soleria" className="h-16 w-auto" onError={(e) => { (e.target as HTMLImageElement).src = '/soleria-logo.png'; }} />
          <span className="font-heading text-2xl font-semibold text-(--text-primary) tracking-tight">Soleria</span>
        </div>

        <div className="p-8 rounded-2xl border border-(--border) bg-(--surface-0) shadow-lg">
          <div className="mb-6 space-y-2">
            <h1 className="text-lg font-semibold text-(--text-primary)">Skapa konto</h1>
            <p className="text-sm text-(--text-secondary)">
              Kom igång med offertverktyget och bjud in resten av teamet senare.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-(--text-secondary) mb-1" htmlFor="password">
                Lösenord
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="mt-1 text-xs text-(--text-muted)">Minst 8 tecken rekommenderas.</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Skapar konto…' : 'Skapa konto'}
            </Button>

            <Link
              href="/logga-in"
              className="text-sm text-(--text-muted) hover:text-(--text-secondary) text-center transition-colors"
            >
              Har du redan ett konto? Logga in
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
