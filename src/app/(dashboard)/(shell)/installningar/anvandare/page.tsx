'use client';

/**
 * /settings/users
 *
 * User management — list, create, and delete staff accounts.
 * Connected to GET/POST/DELETE /api/v1/staff.
 * Admin-only: access is enforced server-side on the API.
 */

import { useState, useEffect, useCallback } from 'react';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import {
  createStaffUser,
  deleteStaffUser,
  listStaffUsers,
  type StaffRole,
  type StaffUser,
} from '@shared/lib/api/staff.api';

// ─── Types ──────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  admin:        'bg-[var(--accent)]/10 text-[var(--accent)]',
  manager:      'bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-400',
  receptionist: 'bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400',
};

const ROLE_LABEL: Record<string, string> = {
  admin:        'Admin',
  manager:      'Manager',
  receptionist: 'Receptionist',
};

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
function avatarColor(id: string) { return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length]; }

const EMPTY_FORM = { email: '', password: '', role: 'receptionist' as StaffRole };

// ─── Page ────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers]       = useState<StaffUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<StaffUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listStaffUsers());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const saveUser = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await createStaffUser({ email: form.email, password: form.password, role: form.role });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [form, load]);

  const deleteUser = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await deleteStaffUser(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
      setConfirmDeleteUser(null);
    }
  }, [load]);

  return (
    <div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--text-muted)]">
            Hantera personal och deras åtkomst till systemet.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ny användare
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* New user form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Ny användare</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">E-postadress *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Lösenord * (min 12 tecken)</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Roll</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as typeof form.role }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors">
                <option value="receptionist">Receptionist</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => void saveUser()} disabled={saving || !form.email || form.password.length < 12}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Sparar…' : 'Skapa användare'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Users table */}
      {!loading && (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <table className="min-w-full divide-y divide-[var(--border)] text-sm">
            <thead className="bg-[var(--surface-alt)]">
              <tr>
                {['Användare', 'Roll', 'Skapad', 'Senaste inloggning', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[var(--surface-alt)] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${avatarColor(u.id)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {initials(u.email)}
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[u.role] ?? 'bg-[var(--surface-alt)] text-[var(--text-muted)]'}`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmt(u.createdAt)}</td>
                  <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmt(u.lastLogin)}</td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => setConfirmDeleteUser(u)} disabled={deletingId === u.id}
                      className="text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-40">
                      Ta bort
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                    Inga användare hittades.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar användare…</p>
        </div>
      )}
      <ConfirmDestructiveDialog
        open={Boolean(confirmDeleteUser)}
        onOpenChange={(open) => { if (!open) setConfirmDeleteUser(null); }}
        title="Ta bort användare?"
        description={
          confirmDeleteUser
            ? `${confirmDeleteUser.email} tas bort från organisationen. Det här går inte att ångra.`
            : 'Användaren tas bort från organisationen. Det här går inte att ångra.'
        }
        confirmLabel="Ta bort användare"
        loading={Boolean(confirmDeleteUser && deletingId === confirmDeleteUser.id)}
        onConfirm={() => {
          if (!confirmDeleteUser) return;
          void deleteUser(confirmDeleteUser.id);
        }}
      />
    </div>
  );
}
