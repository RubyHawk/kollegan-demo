'use client';

import { useState, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type StaffUser = {
  id:           string;
  email:        string;
  role:         string;
  passwordHash: string;
  createdAt:    string;
};

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLES = [
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'manager',      label: 'Manager'      },
  { value: 'admin',        label: 'Admin'        },
] as const;

type Role = (typeof ROLES)[number]['value'];

const ROLE_STYLE: Record<Role, { pill: string; dot: string }> = {
  receptionist: {
    dot:  'bg-blue-500',
    pill: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40',
  },
  manager: {
    dot:  'bg-violet-500',
    pill: 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/40',
  },
  admin: {
    dot:  'bg-amber-500',
    pill: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40',
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RolePill({ role }: { role: string }) {
  const s = ROLE_STYLE[role as Role] ?? { dot: 'bg-gray-400', pill: 'text-[var(--text-muted)] bg-[var(--surface-alt)] border-[var(--border)]' };
  const label = ROLES.find((r) => r.value === role)?.label ?? role;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${s.pill}`}>
      <span className={`w-1 h-1 rounded-full shrink-0 ${s.dot}`} />
      {label}
    </span>
  );
}

function Avatar({ email }: { email: string }) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <div className="w-7 h-7 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center shrink-0">
      <span className="text-[10px] font-bold text-[var(--text-secondary)]">{initials}</span>
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function StaffForm({ onRefresh }: { onRefresh: () => void }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [role,     setRole]     = useState<Role>('receptionist');
  const [loading,  setLoading]  = useState(false);
  const [seeding,  setSeeding]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res  = await fetch('/api/staff', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), password, role }),
      });
      const json = await res.json() as Record<string, unknown>;
      if (!res.ok) { setError((json.error as string) ?? 'Något gick fel.'); return; }
      setSuccess(`${email.trim()} skapades.`);
      setEmail('');
      setPassword('');
      onRefresh();
    } catch { setError('Nätverksfel.'); }
    finally  { setLoading(false); }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    setSuccess(null);
    try {
      const res  = await fetch('/api/demo/seed-staff', { method: 'POST' });
      const json = await res.json() as Record<string, unknown>;
      if (!res.ok) { setError(typeof json.detail === 'string' ? json.detail : 'Något gick fel.'); return; }
      setSuccess('3 demokonton seedade (demo1234).');
      onRefresh();
    } catch { setError('Nätverksfel.'); }
    finally  { setSeeding(false); }
  };

  const canCreate = email.trim().length > 0 && password.length >= 6;

  return (
    <form onSubmit={handleCreate} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-alt)]">
        <div className="w-6 h-6 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
        </div>
        <span className="text-xs font-semibold text-[var(--text-primary)]">Nytt personalkonto</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Email + Password side-by-side */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">E-post</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="anna@hotellet.se"
              required
              className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Lösenord</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 tecken"
                required
                minLength={6}
                className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-3 py-1.5 pr-8 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showPw ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Role selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Roll</label>
          <div className="flex gap-1.5">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={[
                  'flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all',
                  role === r.value
                    ? ROLE_STYLE[r.value].pill + ' shadow-sm'
                    : 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface-alt)] hover:text-[var(--text-secondary)]',
                ].join(' ')}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg text-[11px] text-red-600 dark:text-red-400">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/40 rounded-lg text-[11px] text-emerald-700 dark:text-emerald-400">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {success}
          </div>
        )}

        {/* Actions row */}
        <div className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--surface-alt)] hover:bg-[var(--border)] transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {seeding ? (
              <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
            )}
            Seed demo
          </button>
          <button
            type="submit"
            disabled={loading || !canCreate}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--text-primary)] text-[var(--surface)] hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            )}
            {loading ? 'Skapar…' : 'Skapa konto'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Employee list ────────────────────────────────────────────────────────────

function EmployeeList({ refreshKey }: { refreshKey: number }) {
  const [users,    setUsers]    = useState<StaffUser[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/staff');
      const json = await res.json() as { users: StaffUser[] };
      setUsers(json.users ?? []);
    } catch { setUsers([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/staff?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } finally { setDeleting(null); }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-alt)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span className="text-xs font-semibold text-[var(--text-primary)]">Anställda</span>
          {!loading && (
            <span className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-full px-1.5 py-0.5 tabular-nums">
              {users.length}
            </span>
          )}
        </div>
        <button
          onClick={load}
          className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--border)] transition-all"
          title="Uppdatera"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}>
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.15"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8">
          <div className="w-4 h-4 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-1.5 text-center px-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          <p className="text-xs text-[var(--text-muted)]">Inga anställda ännu</p>
          <p className="text-[10px] text-[var(--text-muted)] opacity-70">Skapa ett konto eller tryck Seed demo</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-light)]">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-2.5 px-4 py-2.5 group hover:bg-[var(--surface-alt)] transition-colors">
              <Avatar email={user.email} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.email}</p>
                  <RolePill role={user.role} />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {new Date(user.createdAt).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(user.id)}
                disabled={deleting === user.id}
                className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-40 shrink-0"
                title="Ta bort"
              >
                {deleting === user.id ? (
                  <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SetupTab() {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="space-y-4 fade-in-up max-w-2xl">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">
          Personalkonton
        </span>
        <div className="flex-1 h-px bg-[var(--border-light)]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4 items-start">
        <StaffForm onRefresh={bump} />
        <EmployeeList refreshKey={refreshKey} />
      </div>
    </div>
  );
}
