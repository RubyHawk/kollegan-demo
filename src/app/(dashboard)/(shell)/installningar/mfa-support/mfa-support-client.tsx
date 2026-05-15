'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAccessReview,
  type AccessReviewUserRow,
} from '@shared/lib/api/compliance.api';
import { resetUserMfaRecovery } from '@shared/lib/api/auth-security.api';
import {
  FieldLabel,
  Input,
  SectionCard,
  type UserProps,
} from '../_components/shared';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('sv-SE');
}

function statusTone(user: AccessReviewUserRow, now: number): 'success' | 'warning' | 'danger' {
  if (user.mfaEnabled) return 'success';
  if (user.mfaGraceExpiresAt && new Date(user.mfaGraceExpiresAt).getTime() > now) return 'warning';
  return 'danger';
}

function statusLabel(user: AccessReviewUserRow, now: number): string {
  if (user.mfaEnabled) {
    const methods: string[] = [];
    if (user.totpConfigured) methods.push('Authenticator app');
    if (user.passkeysRegistered > 0) methods.push(`${user.passkeysRegistered} passkey`);
    return methods.join(' + ') || 'MFA aktiv';
  }

  if (user.mfaGraceExpiresAt && new Date(user.mfaGraceExpiresAt).getTime() > now) {
    return `Grace till ${formatDate(user.mfaGraceExpiresAt)}`;
  }

  return 'MFA saknas';
}

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'success' | 'warning' | 'danger';
}) {
  const classes = tone === 'success'
    ? 'border-emerald-300/40 bg-emerald-500/10 text-emerald-700'
    : tone === 'warning'
    ? 'border-amber-300/40 bg-amber-500/10 text-amber-700'
    : 'border-red-300/40 bg-red-500/10 text-red-700';

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${classes}`}>
      {children}
    </span>
  );
}

export default function MfaSupportClient({ user }: { user: UserProps }) {
  const [users, setUsers] = useState<AccessReviewUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [reason, setReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pendingReset, setPendingReset] = useState<string | null>(null);
  const now = Date.now();

  const canReset = !!user.mfaAuthenticated;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAccessReview();
      setUsers(data.users);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Kunde inte läsa MFA-stödet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;

    return users.filter((entry) =>
      entry.email.toLowerCase().includes(needle)
      || (entry.name ?? '').toLowerCase().includes(needle)
      || entry.roles.some((role) => role.toLowerCase().includes(needle)),
    );
  }, [query, users]);

  const totals = useMemo(() => ({
    enabled: users.filter((entry) => entry.mfaEnabled).length,
    grace: users.filter((entry) => !entry.mfaEnabled && entry.mfaGraceExpiresAt && new Date(entry.mfaGraceExpiresAt).getTime() > now).length,
    overdue: users.filter((entry) => !entry.mfaEnabled && (!entry.mfaGraceExpiresAt || new Date(entry.mfaGraceExpiresAt).getTime() <= now)).length,
  }), [now, users]);

  async function handleReset(targetUser: AccessReviewUserRow) {
    if (reason.trim().length < 8) {
      setError('Ange en kort men tydlig anledning innan du återställer MFA.');
      return;
    }

    setPendingReset(targetUser.id);
    setError('');
    setNotice('');
    try {
      const result = await resetUserMfaRecovery({
        userId: targetUser.id,
        reason: reason.trim(),
      });
      setNotice(`${targetUser.email} fick en ny grace-period till ${formatDate(result.graceExpiresAt)}.`);
      setSelectedUserId(null);
      setReason('');
      await load();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Kunde inte återställa MFA.');
    } finally {
      setPendingReset(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="MFA-support"
        description="Hjälp användare tillbaka in i systemet utan att försvaga MFA-kravet. Åtgärden rensar deras faktorer, loggar ut alla sessioner och ger 24 timmar för ny registrering."
      >
        <div className="flex flex-col gap-4">
          {!canReset && (
            <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
              Den här sessionen är inte MFA-verifierad. Logga in igen med din egen MFA innan du återställer någon annans konto.
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-emerald-600">{notice}</p>}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">MFA aktiv</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{totals.enabled}</p>
            </div>
            <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Grace-period</p>
              <p className="mt-2 text-3xl font-semibold text-amber-800">{totals.grace}</p>
            </div>
            <div className="rounded-2xl border border-red-300/30 bg-red-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Behöver hjälp</p>
              <p className="mt-2 text-3xl font-semibold text-red-800">{totals.overdue}</p>
            </div>
          </div>
          <div>
            <FieldLabel description="Sök på namn, e-post eller roll för att hitta rätt användare snabbare.">
              Sök användare
            </FieldLabel>
            <Input value={query} onChange={setQuery} placeholder="fadi@soleria.se" />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Återställningskö"
        description="Använd den här listan när en användare är låst ute, har tappat sin enhet eller behöver börja om med passkey eller authenticator app."
      >
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Laddar MFA-status…</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Inga användare matchade din sökning.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredUsers.map((entry) => {
              const expanded = selectedUserId === entry.id;
              const tone = statusTone(entry, now);

              return (
                <div key={entry.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {entry.name ?? entry.email}
                        </p>
                        <StatusBadge tone={tone}>{statusLabel(entry, now)}</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{entry.email}</p>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        Roller: {entry.roles.join(', ') || 'inga'} · Senaste inloggning {formatDate(entry.lastLoginAt)} · {entry.activeSessions} aktiv(a) session(er)
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setNotice('');
                          setSelectedUserId(expanded ? null : entry.id);
                          if (selectedUserId !== entry.id) setReason('');
                        }}
                        className="rounded-lg border border-[var(--border)] px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-alt)]"
                      >
                        {expanded ? 'Stäng' : 'Återställ MFA'}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-4 grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                      <div className="grid gap-2 text-sm text-[var(--text-secondary)] sm:grid-cols-3">
                        <p>Authenticator app: {entry.totpConfigured ? 'Ja' : 'Nej'}</p>
                        <p>Passkeys: {entry.passkeysRegistered}</p>
                        <p>Grace utgår: {formatDate(entry.mfaGraceExpiresAt)}</p>
                      </div>
                      <div>
                        <FieldLabel description="Den här orsaken skrivs till audit-loggen tillsammans med vem som utförde återställningen.">
                          Anledning
                        </FieldLabel>
                        <textarea
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          rows={3}
                          placeholder="Exempel: användaren tappade sin telefon och behöver registrera en ny passkey."
                          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-[var(--text-muted)]">
                          Åtgärden loggar ut användaren överallt och startar en ny 24-timmars grace-period.
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleReset(entry)}
                          disabled={!canReset || pendingReset === entry.id}
                          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {pendingReset === entry.id ? 'Återställer…' : 'Bekräfta återställning'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
