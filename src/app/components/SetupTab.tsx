'use client';

import { useState, useCallback } from 'react';

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
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {label}
    </span>
  );
}

function Avatar({ email }: { email: string }) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center shrink-0">
      <span className="text-[11px] font-bold text-[var(--text-secondary)]">{initials}</span>
    </div>
  );
}

function HashDisplay({ hash }: { hash: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = hash.slice(0, 29) + '\u2026';
  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      title={expanded ? 'Klicka för att dölja' : 'Klicka för att visa hela hashen'}
      className="text-left"
    >
      <code className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors break-all leading-relaxed">
        {expanded ? hash : preview}
      </code>
    </button>
  );
}

// ─── Create form ──────────────────────────────────────────────────────────────

function CreateUserForm({ onCreated }: { onCreated: (u: StaffUser) => void }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [role,     setRole]     = useState<Role>('receptionist');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [created,  setCreated]  = useState<StaffUser | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCreated(null);

    try {
      const res  = await fetch('/api/staff', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), password, role }),
      });
      const json = await res.json() as Record<string, unknown>;
      if (!res.ok) {
        setError((json.error as string) ?? 'Något gick fel.');
        return;
      }
      const user = (json as { user: StaffUser }).user;
      setCreated(user);
      onCreated(user);
      setEmail('');
      setPassword('');
    } catch {
      setError('Nätverksfel — är servern igång?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-alt)] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Skapa anställd</p>
          <p className="text-xs text-[var(--text-muted)]">Lägg till ett nytt personalkonto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">E-postadress</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="anna@hotellet.se"
            required
            className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Lösenord</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minst 6 tecken"
              required
              minLength={6}
              className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              {showPw ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Roll</label>
          <div className="flex gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={[
                  'flex-1 py-2 rounded-xl text-xs font-semibold border transition-all',
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

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl text-xs text-red-600 dark:text-red-400">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        {/* Success: hash proof */}
        {created && (
          <div className="bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Konto skapat — lösenordet är bcrypt-hashat (12 rundor)
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5">
              <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">bcrypt hash</p>
              <code className="text-[10px] font-mono text-[var(--text-secondary)] break-all leading-relaxed">
                {created.passwordHash}
              </code>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim() || password.length < 6}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-[var(--text-primary)] text-[var(--surface)] hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
              Skapar konto…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Skapa konto
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Employee list ────────────────────────────────────────────────────────────

function EmployeeList({ refreshKey }: { refreshKey: number }) {
  const [open,     setOpen]     = useState(true);
  const [users,    setUsers]    = useState<StaffUser[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lastKey,  setLastKey]  = useState(refreshKey);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/staff');
      const json = await res.json() as { users: StaffUser[] };
      setUsers(json.users ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggle = () => {
    if (!open) load();
    setOpen((v) => !v);
  };

  // Reload when a new user was created while list is open
  if (open && refreshKey !== lastKey) {
    setLastKey(refreshKey);
    load();
  }

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/staff?id=${id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-alt)] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Visa anställda</p>
            <p className="text-xs text-[var(--text-muted)]">Se alla konton och bcrypt-hashar</p>
          </div>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-[var(--text-muted)] transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="border-t border-[var(--border)]">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-[var(--border)] border-t-amber-500 animate-spin" />
              <span className="text-sm text-[var(--text-muted)]">Hämtar…</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              <p className="text-sm text-[var(--text-muted)]">Inga anställda hittades.</p>
              <p className="text-xs text-[var(--text-muted)]">Skapa ett konto eller seed demo-data.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {users.map((user) => (
                <div key={user.id} className="px-5 py-3.5 flex items-start gap-3 group hover:bg-[var(--surface-alt)] transition-colors">
                  <Avatar email={user.email} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.email}</p>
                      <RolePill role={user.role} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] shrink-0">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      <HashDisplay hash={user.passwordHash} />
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Skapad {new Date(user.createdAt).toLocaleString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={deleting === user.id}
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-40"
                    title="Ta bort"
                  >
                    {deleting === user.id ? (
                      <div className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin" />
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Seed card ────────────────────────────────────────────────────────────────

function SeedCard({ onSeeded }: { onSeeded: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/demo/seed-staff', { method: 'POST' });
      const json = await res.json() as Record<string, unknown>;
      if (!res.ok) {
        setError(typeof json.detail === 'string' ? json.detail : 'Något gick fel.');
        return;
      }
      setDone(true);
      onSeeded();
    } catch {
      setError('Nätverksfel — är servern igång?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]">
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Seed demo-data</p>
          <p className="text-xs text-[var(--text-muted)]">3 konton · lösenord <code className="font-mono text-[10px] bg-[var(--surface-alt)] px-1 py-px rounded">demo1234</code></p>
        </div>
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <button
        onClick={handleSeed}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--surface-alt)] hover:bg-[var(--border)] transition-all active:scale-[0.98] disabled:opacity-40"
      >
        {loading ? (
          <><div className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin" />Seeder…</>
        ) : done ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Klar — seed igen
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.15"/>
            </svg>
            Seed personalkonton
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SetupTab() {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="space-y-5 fade-in-up">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Inställningar</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Hantera personalkonton och demo-data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left column: form + seed */}
        <div className="space-y-4">
          <CreateUserForm onCreated={bump} />
          <SeedCard onSeeded={bump} />
        </div>

        {/* Right column: employee list */}
        <div>
          <EmployeeList refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
