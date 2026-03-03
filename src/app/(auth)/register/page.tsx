'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--page-bg) px-4">
      <div className="w-full max-w-sm">
        <div className="p-8 rounded-2xl border border-(--border) bg-(--surface-0) shadow-lg">
          <h1 className="text-lg font-semibold text-(--text-primary) mb-6">Create account</h1>

          {done ? (
            <div className="flex flex-col gap-4 text-sm">
              <p className="text-green-500">Account created! You can now log in.</p>
              <Link href="/login" className="w-full py-2 px-4 rounded-lg bg-(--accent) text-white text-sm font-medium hover:bg-(--accent-light) transition-colors text-center">
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-(--text-secondary) mb-1" htmlFor="email">Email</label>
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
                <label className="block text-sm text-(--text-secondary) mb-1" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-(--border) bg-(--surface-1) text-(--text-primary) text-sm focus:outline-none focus:border-(--accent)"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 rounded-lg bg-(--accent) text-white text-sm font-medium hover:bg-(--accent-light) transition-colors disabled:opacity-60"
              >
                {loading ? 'Creating…' : 'Create account'}
              </button>

              <Link href="/login" className="text-sm text-(--text-muted) hover:text-(--text-secondary) text-center transition-colors">
                Already have an account? Log in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
