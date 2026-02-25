'use client';

import { useState } from 'react';

// ─── Types (mirrors the API response envelope) ────────────────────────────────

type SeededUser = {
  id:        string;
  email:     string;
  role:      string;
  createdAt: string; // ISO 8601
  status:    'created' | 'updated';
};

type SeedResponse = {
  data: {
    summary:     { created: number; updated: number; total: number };
    users:       SeededUser[];
    credentials: { email: string; password: string; role: string }[];
  };
  meta: { timestamp: string; operation: string };
};

// ─── Role display config ──────────────────────────────────────────────────────

const ROLE: Record<string, { label: string; dot: string; pill: string }> = {
  receptionist: {
    label: 'Receptionist',
    dot:   'bg-blue-500',
    pill:  'bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
  },
  manager: {
    label: 'Manager',
    dot:   'bg-violet-500',
    pill:  'bg-violet-100/80 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800/50',
  },
  admin: {
    label: 'Admin',
    dot:   'bg-amber-500',
    pill:  'bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  },
};

const fallbackRole = { label: 'Unknown', dot: 'bg-gray-400', pill: 'bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-white/50 border-gray-200 dark:border-white/10' };

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-[var(--text-muted)] dark:text-white/25 uppercase tracking-widest">
      {children}
    </p>
  );
}

function RolePill({ role }: { role: string }) {
  const cfg = ROLE[role] ?? fallbackRole;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: 'created' | 'updated' }) {
  return status === 'created' ? (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
      Skapad
    </span>
  ) : (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/8 text-[var(--text-muted)]">
      Uppdaterad
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SetupTab() {
  const [loading, setLoading]   = useState(false);
  const [result,  setResult]    = useState<SeedResponse | null>(null);
  const [error,   setError]     = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/demo/seed-staff', { method: 'POST' });
      const json = await res.json() as Record<string, unknown>;

      if (!res.ok) {
        // RFC 7807 Problem Details — use `detail` field
        const detail = typeof json.detail === 'string' ? json.detail : 'Något gick fel. Kontrollera server-loggarna.';
        setError(detail);
        return;
      }

      setResult(json as SeedResponse);
    } catch {
      setError('Nätverksfel — är servern igång?');
    } finally {
      setLoading(false);
    }
  }

  const summary = result?.data.summary;

  return (
    <div className="max-w-2xl space-y-6 fade-in-up">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] dark:bg-amber-500/12 flex items-center justify-center shrink-0">
          {/* Database icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)] dark:text-amber-400">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        </div>
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">
            Database Setup
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Seed demo-data för lokal testning av databasen
          </p>
        </div>
      </div>

      {/* ── Staff users card ── */}
      <div className="glass-panel rounded-2xl border border-[var(--border)] dark:border-white/8 overflow-hidden shadow-card">

        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] dark:border-white/8 bg-[var(--surface-hover)] dark:bg-white/3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Personalkonton</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Ett demokonto per behörighetsnivå · Lösenord{' '}
              <code className="font-mono bg-[var(--surface-alt)] dark:bg-white/8 px-1 py-px rounded text-[var(--text-secondary)] text-[11px]">
                demo1234
              </code>
            </p>
          </div>

          {/* Seed summary badge (shown after first run) */}
          {summary && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 rounded-full">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {summary.created > 0 ? `${summary.created} skapade` : `${summary.updated} uppdaterade`}
            </div>
          )}
        </div>

        <div className="p-5 space-y-5">

          {/* Role preview pills */}
          <div className="flex flex-wrap gap-2">
            {Object.keys(ROLE).map((role) => (
              <RolePill key={role} role={role} />
            ))}
          </div>

          {/* Seed button */}
          <button
            onClick={handleSeed}
            disabled={loading}
            className={[
              'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
              'transition-all duration-150 active:scale-[0.98] focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
              loading
                ? 'opacity-60 cursor-not-allowed bg-[var(--accent)] text-white dark:bg-amber-500 dark:text-black'
                : 'bg-[var(--accent)] hover:opacity-90 text-white shadow-sm dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-black',
            ].join(' ')}
          >
            {loading ? (
              <>
                {/* Spinner */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin shrink-0">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Seeder...
              </>
            ) : (
              <>
                {/* Refresh / seed icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.15" />
                </svg>
                {result ? 'Seed igen' : 'Seed personalkonton'}
              </>
            )}
          </button>

          {/* ── Error banner (RFC 7807 `detail` field) ── */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-xs text-red-600 dark:text-red-400 fade-in-up">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* ── Results list ── */}
          {result && (
            <div className="space-y-2.5 fade-in-up">
              <SectionLabel>Resultat</SectionLabel>

              {result.data.users.map((user, i) => {
                const cfg  = ROLE[user.role] ?? fallbackRole;
                const cred = result.data.credentials.find((c) => c.email === user.email);
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-alt)] dark:bg-white/4 border border-[var(--border)] dark:border-white/8 stagger-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* Role colour dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />

                    {/* Email + password */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.email}</p>
                      <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5 tracking-wide">
                        {cred?.password}
                      </p>
                    </div>

                    {/* Role pill */}
                    <RolePill role={user.role} />

                    {/* Status badge */}
                    <StatusBadge status={user.status} />
                  </div>
                );
              })}

              {/* Timestamp from meta */}
              <p className="text-[10px] text-[var(--text-muted)] text-right pt-1 font-mono">
                {new Date(result.meta.timestamp).toLocaleString('sv-SE')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
