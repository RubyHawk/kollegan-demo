'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { getAccessReview, type AccessReviewUserRow } from '@shared/lib/api/compliance.api';
import { resetUserMfaRecovery } from '@shared/lib/api/auth-security.api';
import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ModalBody,
} from '@shared/ui/dialog';
import { InlineAlert } from '@shared/ui/inline-alert';
import { StatusBadge } from '@shared/ui/status-badge';
import { Textarea } from '@shared/ui/textarea';
import { useToast } from '@shared/ui/toast/toast-context';
import ToastContainer from '@shared/ui/toast/toast-container';
import { FieldLabel, Input, SectionCard, type UserProps } from '../_components/shared';

type MfaTone = 'success' | 'warning' | 'danger';

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-GB');
}

function statusTone(user: AccessReviewUserRow, now: number): MfaTone {
  if (user.mfaEnabled) return 'success';
  if (user.mfaGraceExpiresAt && new Date(user.mfaGraceExpiresAt).getTime() > now) return 'warning';
  return 'danger';
}

function statusLabel(user: AccessReviewUserRow, now: number): string {
  if (user.mfaEnabled) {
    const methods: string[] = [];
    if (user.totpConfigured) methods.push('Authenticator app');
    if (user.passkeysRegistered > 0) methods.push(`${user.passkeysRegistered} passkey${user.passkeysRegistered > 1 ? 's' : ''}`);
    return methods.join(' + ') || 'MFA active';
  }
  if (user.mfaGraceExpiresAt && new Date(user.mfaGraceExpiresAt).getTime() > now) {
    return `Grace until ${formatDate(user.mfaGraceExpiresAt)}`;
  }
  return 'Missing MFA';
}

function MfaStatusBadge({ children, tone }: { children: React.ReactNode; tone: MfaTone }) {
  return <StatusBadge tone={tone}>{children}</StatusBadge>;
}

export default function MfaSupportClient({ user }: { user: UserProps }) {
  const [users, setUsers] = useState<AccessReviewUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [reason, setReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pendingReset, setPendingReset] = useState<string | null>(null);
  const { toasts, addToast, dismissToast } = useToast();
  const now = Date.now();
  const canReset = !!user.mfaAuthenticated;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAccessReview();
      setUsers(data.users);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load MFA support.');
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

  const selectedUser = useMemo(
    () => users.find((entry) => entry.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  async function handleReset(targetUser: AccessReviewUserRow) {
    if (reason.trim().length < 8) {
      setError('Add a clear reason before resetting MFA.');
      return;
    }

    setPendingReset(targetUser.id);
    setError('');
    try {
      const result = await resetUserMfaRecovery({ userId: targetUser.id, reason: reason.trim() });
      addToast({
        message: `${targetUser.email} received a new grace window until ${formatDate(result.graceExpiresAt)}.`,
        color: 'emerald',
        icon: <CheckCircle aria-hidden="true" size={16} strokeWidth={1.75} />,
      });
      setSelectedUserId(null);
      setReason('');
      await load();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Could not reset MFA.');
    } finally {
      setPendingReset(null);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        <SectionCard
          title="MFA support"
          description="Recover locked-out users without weakening the MFA requirement. Resets revoke sessions and start a 24-hour enrollment window."
        >
          <div className="grid gap-4">
            {!canReset ? (
              <InlineAlert tone="warning">
                This operator session is not MFA-verified. Sign in again with your own MFA before resetting another account.
              </InlineAlert>
            ) : null}
            {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-[var(--ui-border-subtle)] py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">MFA active</p>
                <p className="mt-1 text-xl font-semibold text-[var(--ui-text)]">{totals.enabled}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">In grace</p>
                <p className="mt-1 text-xl font-semibold text-[var(--ui-warning-text)]">{totals.grace}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">Needs action</p>
                <p className="mt-1 text-xl font-semibold text-[var(--ui-danger-text)]">{totals.overdue}</p>
              </div>
            </div>

            <div>
              <FieldLabel description="Search name, email, or role to find the right account quickly.">Search users</FieldLabel>
              <Input value={query} onChange={setQuery} placeholder="name@company.com" />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Recovery queue"
          description="Dense support view for locked-out users, lost devices, and passkey resets."
        >
          {loading ? (
            <p className="text-sm text-[var(--ui-text-muted)]">Loading MFA state...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-[var(--ui-text-muted)]">No users matched your search.</p>
          ) : (
            <div className="overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)]">
              <div className="hidden grid-cols-[minmax(220px,1.4fr)_180px_180px_180px_100px] gap-4 border-b border-[var(--ui-border-subtle)] bg-[var(--ui-surface-subtle)] px-4 py-3 text-[11px] font-semibold uppercase text-[var(--ui-text-muted)] lg:grid">
                <span>User</span>
                <span>Status</span>
                <span>Last login</span>
                <span>Methods</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-[var(--ui-border-subtle)]">
                {filteredUsers.map((entry) => {
                  const tone = statusTone(entry, now);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(entry.id);
                        setReason('');
                        setError('');
                      }}
                      className="grid w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ui-focus)] lg:grid-cols-[minmax(220px,1.4fr)_180px_180px_180px_100px] lg:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{entry.name ?? entry.email}</p>
                        <p className="truncate text-xs text-[var(--ui-text-muted)]">{entry.email}</p>
                      </div>
                      <div><MfaStatusBadge tone={tone}>{statusLabel(entry, now)}</MfaStatusBadge></div>
                      <p className="text-sm text-[var(--ui-text-secondary)]">{formatDate(entry.lastLoginAt)}</p>
                      <p className="text-sm text-[var(--ui-text-secondary)]">
                        {entry.totpConfigured ? 'App' : '-'} - {entry.passkeysRegistered} passkey{entry.passkeysRegistered === 1 ? '' : 's'}
                      </p>
                      <span className="text-sm font-medium text-[var(--ui-accent)]">Open</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => {
        if (!open) {
          setSelectedUserId(null);
          setReason('');
          setError('');
        }
      }}>
        <DialogContent mobileVariant="right-panel" size="right-panel">
          <DialogHeader>
            <DialogTitle>{selectedUser?.name ?? selectedUser?.email ?? 'User details'}</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <ModalBody className="grid gap-5">
            {selectedUser ? (
              <>
                <div className="grid gap-3 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-4 text-sm text-[var(--ui-text-secondary)]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Status</span>
                    <MfaStatusBadge tone={statusTone(selectedUser, now)}>{statusLabel(selectedUser, now)}</MfaStatusBadge>
                  </div>
                  <div className="flex items-center justify-between gap-3"><span>Authenticator app</span><span>{selectedUser.totpConfigured ? 'Yes' : 'No'}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Passkeys</span><span>{selectedUser.passkeysRegistered}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Active sessions</span><span>{selectedUser.activeSessions}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Grace expires</span><span>{formatDate(selectedUser.mfaGraceExpiresAt)}</span></div>
                </div>

                <InlineAlert tone="warning">
                  Resetting MFA revokes all sessions, clears existing factors, and starts a fresh 24-hour grace window.
                </InlineAlert>

                <div>
                  <FieldLabel description="Stored in the audit log with the operator identity. Minimum 8 characters.">Reason</FieldLabel>
                  <Textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={4}
                    placeholder="Example: user lost their phone and needs to enroll a new passkey."
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={() => void handleReset(selectedUser)}
                    disabled={!canReset || pendingReset === selectedUser.id}
                  >
                    {pendingReset === selectedUser.id ? 'Resetting...' : 'Reset MFA'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSelectedUserId(null)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : null}
          </ModalBody>
        </DialogContent>
      </Dialog>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
