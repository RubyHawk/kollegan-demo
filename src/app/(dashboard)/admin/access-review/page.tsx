/**
 * /admin/access-review
 *
 * Quarterly access review page for admins.
 * Displays a table of all users with their roles, MFA status, and last login.
 * Provides CSV export for audit evidence.
 *
 * SOC 2 CC6.3 evidence: this page is the artifact auditors review to confirm
 * that access is periodically reviewed and inappropriate access removed.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAccessReview,
  type AccessReviewData as ReviewData,
  type AccessReviewUserRow as UserRow,
} from '@shared/lib/api/compliance.api';

// ─── Types ─────────────────────────────────────────────────────────────────────

// ─── Helpers ───────────────────────────────────────────────────────────────────

function MfaBadge({ user, now }: { user: UserRow; now: number }) {
  if (user.mfaEnabled) {
    const methods: string[] = [];
    if (user.totpConfigured)         methods.push('TOTP');
    if (user.passkeysRegistered > 0) methods.push(`${user.passkeysRegistered} passkey${user.passkeysRegistered > 1 ? 's' : ''}`);
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/25 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {methods.join(' + ') || 'Aktiverad'}
      </span>
    );
  }
  if (user.mfaGraceExpiresAt) {
    const daysLeft = Math.ceil((new Date(user.mfaGraceExpiresAt).getTime() - now) / 86_400_000);
    if (daysLeft > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/25 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Grace {daysLeft}d
        </span>
      );
    }
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/25 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
      Saknas
    </span>
  );
}

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function exportCsv(users: UserRow[]) {
  const headers = ['Email', 'Namn', 'Typ', 'Roller', 'Aktiv', 'Senaste inloggning', 'MFA', 'TOTP', 'Passkeys', 'Grace utgår', 'Sessioner'];
  const rows = users.map((u) => [
    u.email, u.name ?? '', u.userType, u.roles.join(';'),
    u.isActive ? 'Ja' : 'Nej', fmt(u.lastLoginAt),
    u.mfaEnabled ? 'Aktiverad' : 'Ej konfigurerad',
    u.totpConfigured ? 'Ja' : 'Nej',
    String(u.passkeysRegistered), fmt(u.mfaGraceExpiresAt), String(u.activeSessions),
  ]);
  const csv  = [headers, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `access-review-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AccessReviewPage() {
  const [now]                = useState(Date.now);
  const [data, setData]      = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]    = useState<string | null>(null);
  const [filter, setFilter]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAccessReview());
    } catch (e) {
      const status = typeof e === 'object' && e && 'status' in e ? (e as { status?: number }).status : undefined;
      setError(status === 403 ? 'Åtkomst nekad — admin-roll krävs' : (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = data?.users.filter((u) =>
    filter === '' ||
    u.email.toLowerCase().includes(filter.toLowerCase()) ||
    (u.name ?? '').toLowerCase().includes(filter.toLowerCase()) ||
    u.roles.some((r) => r.includes(filter.toLowerCase()))
  ) ?? [];

  const mfaEnabled  = data?.users.filter(u => u.mfaEnabled).length ?? 0;
  const mfaGrace    = data?.users.filter(u => !u.mfaEnabled && u.mfaGraceExpiresAt && new Date(u.mfaGraceExpiresAt) > new Date()).length ?? 0;
  const mfaOverdue  = data?.users.filter(u => !u.mfaEnabled && (!u.mfaGraceExpiresAt || new Date(u.mfaGraceExpiresAt) <= new Date())).length ?? 0;

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Åtkomstgranskning</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            SOC 2 CC6.3 — Kvartalsgranskning av användaråtkomst och MFA-efterlevnad.
            {data && (
              <span className="ml-2 text-[var(--text-muted)]">
                Genererad {new Date(data.generatedAt).toLocaleString('sv-SE')}.
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors"
          >
            {loading ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
              </svg>
            )}
            {loading ? 'Laddar…' : 'Uppdatera'}
          </button>
          {data && (
            <button
              onClick={() => exportCsv(filtered)}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportera CSV
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* Stats */}
      {data && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Totalt användare', value: data.totalUsers, color: 'text-[var(--text-primary)]', bg: 'bg-[var(--surface)] border-[var(--border)]' },
            { label: 'MFA aktiverad',    value: mfaEnabled,      color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30' },
            { label: 'Grace-period',     value: mfaGrace,        color: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30' },
            { label: 'MFA saknas',       value: mfaOverdue,      color: 'text-red-700 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
              <p className={`text-xs font-semibold mb-2 ${color}`}>{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      {data && (
        <div className="mb-4 relative max-w-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Filtrera på e-post, namn eller roll…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
      )}

      {/* Table */}
      {data && (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--surface-alt)]">
                <tr>
                  {['E-post', 'Namn', 'Typ', 'Roller', 'Status', 'Senaste inloggning', 'MFA', 'Sessioner'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {filtered.map((u) => (
                  <tr key={u.id} className={['hover:bg-[var(--surface-alt)] transition-colors', u.isActive ? '' : 'opacity-50'].join(' ')}>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--text-primary)]">{u.email}</td>
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">{u.name ?? <span className="text-[var(--text-muted)]">—</span>}</td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${u.userType === 'staff' ? 'bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400' : 'bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-400'}`}>
                        {u.userType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                      {u.roles.length > 0 ? u.roles.join(', ') : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {u.isActive
                        ? <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">Aktiv</span>
                        : <span className="text-[var(--text-muted)] text-xs">Inaktiv</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmt(u.lastLoginAt)}</td>
                    <td className="px-4 py-3.5"><MfaBadge user={u} now={now} /></td>
                    <td className="px-4 py-3.5 text-center text-[var(--text-secondary)]">{u.activeSessions}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                      {filter ? 'Inga användare matchar filtret.' : 'Inga användare hittades.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar åtkomstgranskningsdata…</p>
        </div>
      )}
    </div>
  );
}
