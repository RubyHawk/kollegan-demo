'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Check, DownloadSimple, Key, PencilSimple, Printer, Trash } from '@phosphor-icons/react';
import { changePassword as changeAccountPassword } from '@shared/lib/api/auth-account.api';
import {
  deletePasskey,
  enableTotp,
  finishPasskeyRegistration,
  getSecurityMfaStatus,
  listActiveSessions,
  listPasskeys,
  regenerateBackupCodes,
  removeTotp,
  renamePasskey,
  setupTotp,
  startPasskeyRegistration,
  type ActiveSessionRecord,
  type PasskeyRecord,
  type SecurityMfaStatus,
} from '@shared/lib/api/auth-security.api';
import { Button } from '@shared/ui/button';
import { CopyableCode } from '@shared/ui/copyable-code';
import { OtpInput } from '@shared/ui/otp-input';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { SectionCard, FieldLabel, Input, SaveButton } from '../_components/shared';

type TotpSetupState = {
  qrDataUrl: string;
  secret: string;
  otpAuthUrl?: string;
} | null;

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB');
}

function formatRelativeDate(value: string | null): string {
  if (!value) return 'Never used';
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.max(1, Math.round(diff / 86_400_000));
  return days === 1 ? 'Last used 1 day ago' : `Last used ${days} days ago`;
}

function formatSessionMethod(method: ActiveSessionRecord['mfaMethod']): string {
  if (method === 'totp') return 'Authenticator app';
  if (method === 'webauthn') return 'Passkey';
  return 'Password only';
}

function deviceLabel(passkey: PasskeyRecord): string {
  if (passkey.credentialDeviceType === 'singleDevice') return 'Device-bound key';
  if (passkey.credentialBackedUp) return 'Synced passkey';
  return 'Passkey';
}

function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const classes = tone === 'success'
    ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
    : tone === 'warning'
      ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]'
      : tone === 'danger'
        ? 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]'
        : 'bg-[var(--surface-alt)] text-[var(--text-secondary)]';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes}`}>{children}</span>;
}

function strengthFor(security: SecurityMfaStatus | null) {
  if (!security || !security.enabled) {
    return {
      label: 'At risk',
      tone: 'danger' as const,
      rationale: 'No primary factor is enrolled yet. Add an authenticator app or passkey before enforcement reaches this account.',
    };
  }
  if (security.totpConfigured && security.passkeysRegistered > 0) {
    return {
      label: 'Strong',
      tone: 'success' as const,
      rationale: 'Passkey and authenticator app are both available, so the account has resilient sign-in options.',
    };
  }
  return {
    label: 'Standard',
    tone: 'warning' as const,
    rationale: 'One primary factor is active. Add a second method to reduce recovery friction and lockout risk.',
  };
}

export default function SakerhetClient() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [loading, setLoading] = useState(true);
  const [securityError, setSecurityError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [security, setSecurity] = useState<SecurityMfaStatus | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([]);
  const [sessions, setSessions] = useState<ActiveSessionRecord[]>([]);
  const [totpSetupState, setTotpSetupState] = useState<TotpSetupState>(null);
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showManualSecret, setShowManualSecret] = useState(false);
  const [passkeyName, setPasskeyName] = useState('My device');
  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [editingPasskeyName, setEditingPasskeyName] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [removeTotpOpen, setRemoveTotpOpen] = useState(false);
  const [removePasskeyId, setRemovePasskeyId] = useState<string | null>(null);
  const [regenerateOpen, setRegenerateOpen] = useState(false);

  async function loadSecurityState() {
    setLoading(true);
    setSecurityError('');
    try {
      const [mfaStatus, passkeyList, sessionList] = await Promise.all([
        getSecurityMfaStatus(),
        listPasskeys(),
        listActiveSessions(),
      ]);
      setSecurity(mfaStatus);
      setPasskeys(passkeyList);
      setSessions(sessionList);
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : 'Could not load security settings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSecurityState();
  }, []);

  async function changePassword() {
    setPasswordPending(true);
    setPasswordError('');
    setPasswordSaved(false);
    try {
      await changeAccountPassword({ currentPassword, newPassword, confirmPassword });
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      window.setTimeout(() => setPasswordSaved(false), 3000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Network error. Try again.');
    } finally {
      setPasswordPending(false);
    }
  }

  async function startTotpEnrollment() {
    setPendingAction('totp-setup');
    setActionError('');
    setActionNotice('');
    try {
      setTotpSetupState(await setupTotp());
      setShowManualSecret(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not start authenticator setup.');
    } finally {
      setPendingAction(null);
    }
  }

  async function confirmTotpEnrollment() {
    setPendingAction('totp-enable');
    setActionError('');
    setActionNotice('');
    try {
      const data = await enableTotp(totpCode);
      setBackupCodes(data.backupCodes);
      setTotpCode('');
      setTotpSetupState(null);
      setActionNotice('Authenticator app enabled. Save the backup codes before leaving this page.');
      await loadSecurityState();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not verify that code.');
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRemoveTotp() {
    setPendingAction('totp-remove');
    setActionError('');
    try {
      await removeTotp();
      window.location.assign('/logga-in?redirect=/installningar/sakerhet');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not remove authenticator app.');
      setPendingAction(null);
    }
  }

  async function handleRegenerateBackupCodes() {
    setPendingAction('backup-codes');
    setActionError('');
    setActionNotice('');
    try {
      const data = await regenerateBackupCodes();
      setBackupCodes(data.backupCodes);
      setActionNotice('New backup codes created. They will only be shown once.');
      setRegenerateOpen(false);
      await loadSecurityState();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not create backup codes.');
    } finally {
      setPendingAction(null);
    }
  }

  async function handleAddPasskey() {
    setPendingAction('passkey-add');
    setActionError('');
    setActionNotice('');
    try {
      const options = await startPasskeyRegistration();
      const { startRegistration } = await import('@simplewebauthn/browser');
      const response = await startRegistration({
        optionsJSON: options as Parameters<typeof startRegistration>[0]['optionsJSON'],
      });
      await finishPasskeyRegistration(response, passkeyName.trim() || 'My device');
      setActionNotice('Passkey registered.');
      setPasskeyName('My device');
      await loadSecurityState();
    } catch (error) {
      if ((error as { name?: string }).name !== 'NotAllowedError') {
        setActionError(error instanceof Error ? error.message : 'Passkey registration failed.');
      }
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRenamePasskey(id: string) {
    const name = editingPasskeyName.trim();
    if (!name) return;
    setPendingAction(`passkey-rename:${id}`);
    setActionError('');
    try {
      await renamePasskey(id, name);
      setEditingPasskeyId(null);
      setEditingPasskeyName('');
      await loadSecurityState();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not rename passkey.');
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDeletePasskey(id: string) {
    setPendingAction(`passkey-remove:${id}`);
    setActionError('');
    try {
      await deletePasskey(id);
      window.location.assign('/logga-in?redirect=/installningar/sakerhet');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not remove passkey.');
      setPendingAction(null);
    }
  }

  async function copyAllBackupCodes() {
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    setActionNotice('Backup codes copied.');
  }

  function downloadBackupCodes() {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kollegan-backup-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  function printBackupCodes() {
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) return;
    popup.document.write(`<pre style="font:16px monospace;line-height:1.8">${backupCodes.join('\n')}</pre>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  const needsStepUp = !!security && security.enabled && !security.currentSessionMfaAuthenticated;
  const graceWarning = security && !security.enabled && security.graceExpiresAt;
  const strength = strengthFor(security);
  const totpStep = security?.totpConfigured ? 'Done' : totpSetupState ? 'Verify' : 'Scan';
  const backupCountLabel = security ? `${security.backupCodesRemaining} unused` : '—';
  const removePasskey = useMemo(
    () => passkeys.find((passkey) => passkey.id === removePasskeyId) ?? null,
    [passkeys, removePasskeyId],
  );

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Security" description="Sign-in strength, recovery coverage, and active sessions at a glance.">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading security state…</p>
        ) : securityError ? (
          <p className="text-sm text-[var(--status-danger-text)]">{securityError}</p>
        ) : security ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={strength.tone}>{strength.label}</StatusPill>
                  <StatusPill tone={security.currentSessionMfaAuthenticated ? 'success' : 'neutral'}>
                    {security.currentSessionMfaAuthenticated ? 'Current session verified' : 'Step-up required'}
                  </StatusPill>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{strength.rationale}</p>
              </div>
            </div>
            {graceWarning ? (
              <div className="rounded-lg border border-[var(--status-warning-text)]/20 bg-[var(--status-warning-bg)] px-4 py-3 text-sm text-[var(--status-warning-text)]">
                Add a sign-in method before {formatDateTime(security.graceExpiresAt)} to avoid enforcement blocking this account.
              </div>
            ) : null}
            {needsStepUp ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                Sign in again with MFA before adding, removing, or regenerating factors in this session.
              </div>
            ) : null}
            {actionError ? <p className="text-sm text-[var(--status-danger-text)]">{actionError}</p> : null}
            {actionNotice ? <p className="text-sm text-[var(--status-success-text)]">{actionNotice}</p> : null}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Authenticator app" description="Time-based one-time codes from 1Password, Bitwarden, or another authenticator.">
        {!security ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <StatusPill tone={security.totpConfigured ? 'success' : security.pendingTotpSetup ? 'warning' : 'neutral'}>
                    {security.totpConfigured ? 'Enabled' : security.pendingTotpSetup ? 'Pending verification' : 'Not enabled'}
                  </StatusPill>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    {['Scan', 'Verify', 'Done'].map((step) => (
                      <span key={step} className={step === totpStep ? 'font-semibold text-[var(--text-primary)]' : ''}>{step}</span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Use a six-digit code as a strong fallback beside passkeys.</p>
              </div>
              {security.totpConfigured ? (
                <Button type="button" variant="outline" onClick={() => setRemoveTotpOpen(true)} disabled={needsStepUp}>
                  Remove
                </Button>
              ) : (
                <Button type="button" onClick={() => void startTotpEnrollment()} disabled={pendingAction === 'totp-setup' || needsStepUp}>
                  {pendingAction === 'totp-setup' ? 'Loading…' : totpSetupState || security.pendingTotpSetup ? 'Restart setup' : 'Enable'}
                </Button>
              )}
            </div>

            {totpSetupState ? (
              <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 md:grid-cols-[176px,minmax(0,1fr)]">
                <div className="h-fit rounded-xl border border-[var(--border)] bg-white p-2">
                  <Image src={totpSetupState.qrDataUrl} alt="Authenticator QR code" width={160} height={160} unoptimized />
                </div>
                <div className="grid gap-3">
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    Scan the QR code, then enter the next code from your app to prove you control it.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowManualSecret((value) => !value)}
                    className="w-fit text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    Can’t scan?
                  </button>
                  {showManualSecret ? <CopyableCode value={totpSetupState.secret} label="Manual setup key" /> : null}
                  <OtpInput value={totpCode} onChange={setTotpCode} ariaLabel="Authenticator confirmation code" />
                  <div>
                    <Button type="button" onClick={() => void confirmTotpEnrollment()} disabled={totpCode.length !== 6 || pendingAction === 'totp-enable'}>
                      {pendingAction === 'totp-enable' ? 'Verifying…' : 'Confirm and enable'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Passkeys" description="Phishing-resistant sign-in methods for trusted devices and security keys.">
        {!security ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-[220px] flex-1">
                <FieldLabel>Device name</FieldLabel>
                <Input value={passkeyName} onChange={setPasskeyName} placeholder="Work laptop" />
              </div>
              <Button type="button" onClick={() => void handleAddPasskey()} disabled={pendingAction === 'passkey-add' || needsStepUp}>
                {pendingAction === 'passkey-add' ? 'Starting…' : 'Add passkey'}
              </Button>
            </div>

            {passkeys.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--text-muted)]">
                No passkeys yet. Add one to make sign-in faster and stronger.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border)]">
                {passkeys.map((passkey) => (
                  <div key={passkey.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-alt)] text-[var(--text-secondary)]">
                        <Key size={20} />
                      </div>
                      <div className="min-w-0">
                        {editingPasskeyId === passkey.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={editingPasskeyName}
                              onChange={(event) => setEditingPasskeyName(event.target.value)}
                              className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 text-sm outline-none focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--accent)]/30"
                            />
                            <Button type="button" size="sm" onClick={() => void handleRenamePasskey(passkey.id)} disabled={pendingAction === `passkey-rename:${passkey.id}`}>
                              Save
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{passkey.name}</p>
                              <StatusPill>{deviceLabel(passkey)}</StatusPill>
                            </div>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                              {formatRelativeDate(passkey.lastUsedAt)} · Added {formatDateTime(passkey.createdAt)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Rename ${passkey.name}`}
                        onClick={() => {
                          setEditingPasskeyId(passkey.id);
                          setEditingPasskeyName(passkey.name);
                        }}
                      >
                        <PencilSimple />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${passkey.name}`}
                        onClick={() => setRemovePasskeyId(passkey.id)}
                        disabled={needsStepUp}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Backup codes" description="Recovery-only codes for the day your normal factor is unavailable.">
        {!security ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={security.backupCodesRemaining <= 3 ? 'warning' : 'neutral'}>{backupCountLabel}</StatusPill>
                  <p className="text-sm text-[var(--text-secondary)]">Recovery codes are not primary sign-in factors.</p>
                </div>
              </div>
              <Button type="button" variant="outline" onClick={() => setRegenerateOpen(true)} disabled={!security.enabled || needsStepUp}>
                Regenerate
              </Button>
            </div>

            {backupCodes.length > 0 ? (
              <div className="grid gap-4 rounded-xl border border-[var(--status-warning-text)]/20 bg-[var(--status-warning-bg)] p-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">We won’t show these again.</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">Store them somewhere separate from your normal sign-in device.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {backupCodes.map((code) => (
                    <div key={code} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2">
                      <code className="flex-1 font-mono text-sm tracking-[0.18em] text-[var(--text-primary)]">{code}</code>
                      <button type="button" onClick={() => void navigator.clipboard.writeText(code)} className="text-xs text-[var(--accent)] hover:underline">
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => void copyAllBackupCodes()}><Check />Copy all</Button>
                  <Button type="button" variant="outline" onClick={downloadBackupCodes}><DownloadSimple />Download .txt</Button>
                  <Button type="button" variant="outline" onClick={printBackupCodes}><Printer />Print</Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Active sessions" description="Browsers that still hold a valid session for this account.">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No active sessions found.</p>
        ) : (
          <div className="grid gap-3">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{session.userAgent || 'Unknown device'}</p>
                  <StatusPill tone={session.mfaVerifiedAt ? 'success' : 'neutral'}>{formatSessionMethod(session.mfaMethod)}</StatusPill>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  IP {session.ipAddress ?? 'unknown'} · Started {formatDateTime(session.issuedAt)} · Expires {formatDateTime(session.expiresAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Password" description="Change your password without altering MFA enrollment.">
        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel>Current password</FieldLabel>
            <Input value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="Your current password" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>New password</FieldLabel>
              <Input value={newPassword} onChange={setNewPassword} placeholder="At least 8 characters" type="password" />
            </div>
            <div>
              <FieldLabel>Confirm new password</FieldLabel>
              <Input value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat password" type="password" />
            </div>
          </div>
          {passwordError ? <p className="text-sm text-[var(--status-danger-text)]">{passwordError}</p> : null}
          <SaveButton pending={passwordPending} saved={passwordSaved} onClick={() => void changePassword()} />
        </div>
      </SectionCard>

      <ConfirmDestructiveDialog
        open={removeTotpOpen}
        onOpenChange={setRemoveTotpOpen}
        title="Remove authenticator app?"
        description="You will need to sign in again after removal. Keep at least one other primary factor enrolled."
        confirmLabel="Remove"
        loading={pendingAction === 'totp-remove'}
        onConfirm={() => void handleRemoveTotp()}
      />

      <ConfirmDestructiveDialog
        open={!!removePasskey}
        onOpenChange={(open) => {
          if (!open) setRemovePasskeyId(null);
        }}
        title={`Remove ${removePasskey?.name ?? 'passkey'}?`}
        description="You will need to sign in again after removal. Keep at least one other primary factor enrolled."
        confirmLabel="Remove"
        loading={!!removePasskey && pendingAction === `passkey-remove:${removePasskey.id}`}
        onConfirm={() => {
          if (removePasskey) void handleDeletePasskey(removePasskey.id);
        }}
      />

      <ConfirmDestructiveDialog
        open={regenerateOpen}
        onOpenChange={setRegenerateOpen}
        title="Regenerate backup codes?"
        description="All existing backup codes will stop working immediately."
        confirmLabel="Regenerate"
        loading={pendingAction === 'backup-codes'}
        onConfirm={() => void handleRegenerateBackupCodes()}
      />
    </div>
  );
}
