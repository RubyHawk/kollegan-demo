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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  userType: string;
  isActive: boolean;
  organizationId: string | null;
  roles: string[];
  lastLoginAt: string | null;
  mfaEnabled: boolean;
  totpConfigured: boolean;
  passkeysRegistered: number;
  mfaGraceExpiresAt: string | null;
  activeSessions: number;
  createdAt: string;
}

interface ReviewData {
  generatedAt: string;
  totalUsers: number;
  users: UserRow[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function MfaBadge({ user, now }: { user: UserRow; now: number }) {
  if (user.mfaEnabled) {
    const methods: string[] = [];
    if (user.totpConfigured) methods.push('TOTP');
    if (user.passkeysRegistered > 0) methods.push(`${user.passkeysRegistered} passkey${user.passkeysRegistered > 1 ? 's' : ''}`);
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        ✓ {methods.join(' + ') || 'Enabled'}
      </span>
    );
  }
  if (user.mfaGraceExpiresAt) {
    const daysLeft = Math.ceil((new Date(user.mfaGraceExpiresAt).getTime() - now) / 86_400_000);
    if (daysLeft > 0) {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
          ⚠ Grace {daysLeft}d left
        </span>
      );
    }
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
      ✗ Not configured
    </span>
  );
}

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function exportCsv(users: UserRow[]) {
  const headers = ['Email', 'Name', 'Type', 'Roles', 'Active', 'Last Login', 'MFA', 'TOTP', 'Passkeys', 'Grace Expires', 'Sessions'];
  const rows = users.map((u) => [
    u.email,
    u.name ?? '',
    u.userType,
    u.roles.join(';'),
    u.isActive ? 'Yes' : 'No',
    fmt(u.lastLoginAt),
    u.mfaEnabled ? 'Enabled' : 'Not configured',
    u.totpConfigured ? 'Yes' : 'No',
    String(u.passkeysRegistered),
    fmt(u.mfaGraceExpiresAt),
    String(u.activeSessions),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
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
  const [now] = useState(Date.now);
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/access-review');
      if (!res.ok) {
        if (res.status === 403) throw new Error('Access denied — admin role required');
        throw new Error(`Failed to load data (${res.status})`);
      }
      const json = await res.json() as { data: ReviewData };
      setData(json.data);
    } catch (e) {
      setError((e as Error).message);
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

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Access Review</h1>
            <p className="mt-1 text-sm text-gray-500">
              SOC 2 CC6.3 — Quarterly review of user access and MFA compliance.
              {data && <> Generated {new Date(data.generatedAt).toLocaleString()}.</>}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => void load()}
              disabled={loading}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            {data && (
              <button
                onClick={() => exportCsv(filtered)}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        {data && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total users', value: data.totalUsers },
              { label: 'MFA enabled', value: data.users.filter((u) => u.mfaEnabled).length },
              { label: 'In grace period', value: data.users.filter((u) => !u.mfaEnabled && u.mfaGraceExpiresAt && new Date(u.mfaGraceExpiresAt) > new Date()).length },
              { label: 'MFA overdue', value: data.users.filter((u) => !u.mfaEnabled && (!u.mfaGraceExpiresAt || new Date(u.mfaGraceExpiresAt) <= new Date())).length },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        {data && (
          <div className="mb-4">
            <input
              type="search"
              placeholder="Filter by email, name, or role…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {/* Table */}
        {data && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Email', 'Name', 'Type', 'Roles', 'Status', 'Last Login', 'MFA', 'Sessions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.id} className={u.isActive ? '' : 'opacity-50'}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">{u.email}</td>
                    <td className="px-4 py-3 text-gray-700">{u.name ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${u.userType === 'staff' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {u.userType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.roles.join(', ') || <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3">
                      {u.isActive
                        ? <span className="text-green-700">Active</span>
                        : <span className="text-gray-400">Inactive</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fmt(u.lastLoginAt)}</td>
                    <td className="px-4 py-3"><MfaBadge user={u} now={now} /></td>
                    <td className="px-4 py-3 text-center text-gray-700">{u.activeSessions}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                      {filter ? 'No users match your filter.' : 'No users found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            Loading access review data…
          </div>
        )}
      </div>
    </div>
  );
}
