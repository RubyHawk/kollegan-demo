'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
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
  setupTotp,
  startPasskeyRegistration,
  type ActiveSessionRecord,
  type PasskeyRecord,
  type SecurityMfaStatus,
} from '@shared/lib/api/auth-security.api';
import { SectionCard, FieldLabel, Input, SaveButton, Icon } from '../_components/shared';

type TotpSetupState = {
  qrDataUrl: string;
  secret: string;
  otpAuthUrl?: string;
} | null;

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('sv-SE');
}

function formatSessionMethod(method: ActiveSessionRecord['mfaMethod']): string {
  if (method === 'totp') return 'Authenticator app';
  if (method === 'webauthn') return 'Passkey';
  return 'Password only';
}

function formatMethodLabel(method: 'totp' | 'webauthn'): string {
  return method === 'totp' ? 'Authenticator app' : 'Passkey';
}

function StatusPill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning' }) {
  const toneClass = tone === 'success'
    ? 'bg-emerald-500/10 text-emerald-700'
    : tone === 'warning'
    ? 'bg-amber-500/10 text-amber-700'
    : 'bg-[var(--surface-alt)] text-[var(--text-secondary)]';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}

export default function SakerhetClient() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwPending, setPwPending] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

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
  const [passkeyName, setPasskeyName] = useState('Min enhet');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

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
      setSecurityError(error instanceof Error ? error.message : 'Kunde inte läsa säkerhetsinställningarna.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSecurityState();
  }, []);

  async function changePassword() {
    setPwPending(true);
    setPwError('');
    setPwSaved(false);
    try {
      await changeAccountPassword({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw });
      setPwSaved(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setPwSaved(false), 3000);
    } catch (error) {
      setPwError(error instanceof Error ? error.message : 'Nätverksfel. Försök igen.');
    } finally {
      setPwPending(false);
    }
  }

  async function startTotpEnrollment() {
    setPendingAction('totp-setup');
    setActionError('');
    setActionNotice('');
    try {
      const setup = await setupTotp();
      setTotpSetupState(setup);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Kunde inte starta MFA-konfigureringen.');
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
      setActionNotice('Authenticator app aktiverad. Spara reservkoderna innan du går vidare.');
      await loadSecurityState();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Kunde inte verifiera koden.');
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRemoveTotp() {
    if (!confirm('Ta bort authenticator app från ditt konto? Du behöver logga in igen efteråt.')) return;
    setPendingAction('totp-remove');
    setActionError('');
    try {
      await removeTotp();
      window.location.assign('/logga-in?redirect=/installningar/sakerhet');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Kunde inte ta bort authenticator app.');
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
      setActionNotice('Nya reservkoder skapades. De visas bara en gång.');
      await loadSecurityState();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Kunde inte skapa reservkoder.');
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
      const response = await startRegistration({ optionsJSON: options as Parameters<typeof startRegistration>[0]['optionsJSON'] });
      await finishPasskeyRegistration(response, passkeyName.trim() || 'Min enhet');
      setActionNotice('Passkey registrerad.');
      setPasskeyName('Min enhet');
      await loadSecurityState();
    } catch (error) {
      if ((error as { name?: string }).name !== 'NotAllowedError') {
        setActionError(error instanceof Error ? error.message : 'Passkey-registrering misslyckades.');
      }
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDeletePasskey(id: string) {
    if (!confirm('Ta bort den här passkeyn? Du behöver logga in igen efteråt.')) return;
    setPendingAction(`passkey-remove:${id}`);
    setActionError('');
    try {
      await deletePasskey(id);
      window.location.assign('/logga-in?redirect=/installningar/sakerhet');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Kunde inte ta bort passkeyn.');
      setPendingAction(null);
    }
  }

  const needsStepUp = !!security && security.enabled && !security.currentSessionMfaAuthenticated;
  const graceWarning = security && !security.enabled && security.graceExpiresAt;

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Säkerhetsöversikt" description="Hantera inloggningsmetoder, reservkoder och aktiva sessioner på ett ställe.">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Laddar säkerhetsstatus…</p>
        ) : securityError ? (
          <p className="text-sm text-red-500">{securityError}</p>
        ) : security ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={security.enabled ? 'success' : graceWarning ? 'warning' : 'neutral'}>
                {security.enabled ? 'MFA aktiv' : graceWarning ? 'Konfigurering krävs' : 'Ingen MFA registrerad'}
              </StatusPill>
              <StatusPill tone={security.currentSessionMfaAuthenticated ? 'success' : 'neutral'}>
                {security.currentSessionMfaAuthenticated ? 'Nuvarande session verifierad' : 'Nuvarande session saknar MFA-steg'}
              </StatusPill>
              {security.enrolledMethods.map((method) => (
                <StatusPill key={method}>{formatMethodLabel(method)}</StatusPill>
              ))}
            </div>
            {graceWarning && (
              <div className="rounded-xl border border-amber-300/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
                Lägg till en sign-in-metod innan {formatDateTime(security.graceExpiresAt)} för att undvika att bli utelåst.
              </div>
            )}
            {needsStepUp && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                Logga in igen med MFA om du vill lägga till, ta bort eller återställa faktorer i den här sessionen.
              </div>
            )}
            {actionError && <p className="text-sm text-red-500">{actionError}</p>}
            {actionNotice && <p className="text-sm text-emerald-600">{actionNotice}</p>}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Authenticator app" description="Använd tidsbaserade engångskoder från exempelvis 1Password, Authy eller Google Authenticator.">
        {!security ? (
          <p className="text-sm text-[var(--text-muted)]">Laddar…</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-alt)]">
                  <Icon path={<><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></>} size={18} className="text-[var(--text-secondary)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {security.totpConfigured ? 'Aktiverad' : security.pendingTotpSetup ? 'Väntar på bekräftelse' : 'Inte aktiverad'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Verifiera med en sexsiffrig kod från din app.</p>
                </div>
              </div>
              <div className="flex gap-2">
                {!security.totpConfigured && (
                  <button
                    onClick={() => void startTotpEnrollment()}
                    disabled={pendingAction === 'totp-setup' || needsStepUp}
                    className="rounded-lg border border-[var(--accent)]/40 px-3.5 py-1.5 text-xs font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/5 disabled:opacity-50"
                  >
                    {pendingAction === 'totp-setup' ? 'Laddar…' : totpSetupState || security.pendingTotpSetup ? 'Starta om' : 'Aktivera'}
                  </button>
                )}
                {security.totpConfigured && (
                  <button
                    onClick={() => void handleRemoveTotp()}
                    disabled={pendingAction === 'totp-remove' || needsStepUp}
                    className="rounded-lg border border-red-300/60 px-3.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/5 disabled:opacity-50"
                  >
                    {pendingAction === 'totp-remove' ? 'Tar bort…' : 'Ta bort'}
                  </button>
                )}
              </div>
            </div>

            {totpSetupState && (
              <div className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 md:grid-cols-[auto,1fr]">
                <Image
                  src={totpSetupState.qrDataUrl}
                  alt="QR-kod för MFA"
                  width={160}
                  height={160}
                  unoptimized
                  className="h-40 w-40 rounded-xl border border-[var(--border)] bg-white p-2"
                />
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Skanna QR-koden eller använd den manuella nyckeln nedan, och bekräfta sedan med en ny kod från appen.
                  </p>
                  <code className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-xs tracking-[0.25em] text-[var(--text-primary)]">
                    {totpSetupState.secret}
                  </code>
                  <div>
                    <FieldLabel>Verifieringskod</FieldLabel>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={totpCode}
                      onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-center text-sm tracking-[0.25em] text-[var(--text-primary)]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => void confirmTotpEnrollment()}
                      disabled={totpCode.length < 6 || pendingAction === 'totp-enable'}
                      className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {pendingAction === 'totp-enable' ? 'Verifierar…' : 'Bekräfta och aktivera'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Passkeys" description="Registrera en eller flera passkeys för snabb och phishing-resistent inloggning.">
        {!security ? (
          <p className="text-sm text-[var(--text-muted)]">Laddar…</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr),auto] md:items-end">
              <div>
                <FieldLabel>Namn på enhet</FieldLabel>
                <Input value={passkeyName} onChange={setPasskeyName} placeholder="Min laptop" />
              </div>
              <button
                onClick={() => void handleAddPasskey()}
                disabled={pendingAction === 'passkey-add' || needsStepUp}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pendingAction === 'passkey-add' ? 'Startar…' : 'Lägg till passkey'}
              </button>
            </div>

            <div className="grid gap-3">
              {passkeys.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--text-muted)]">
                  Inga passkeys registrerade ännu.
                </div>
              ) : passkeys.map((passkey) => (
                <div key={passkey.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{passkey.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Skapad {formatDateTime(passkey.createdAt)} · Senast använd {formatDateTime(passkey.lastUsedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleDeletePasskey(passkey.id)}
                    disabled={pendingAction === `passkey-remove:${passkey.id}` || needsStepUp}
                    className="rounded-lg border border-red-300/60 px-3.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/5 disabled:opacity-50"
                  >
                    {pendingAction === `passkey-remove:${passkey.id}` ? 'Tar bort…' : 'Ta bort'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Reservkoder" description="Skapa engångskoder som kan användas om du tappar åtkomst till dina vanliga MFA-metoder.">
        {!security ? (
          <p className="text-sm text-[var(--text-muted)]">Laddar…</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{security.backupCodesRemaining} kod(er) återstår</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Reservkoder är återställningskoder. De ersätter inte en riktig sign-in-metod.
                </p>
              </div>
              <button
                onClick={() => void handleRegenerateBackupCodes()}
                disabled={pendingAction === 'backup-codes' || !security.enabled || needsStepUp}
                className="rounded-lg border border-[var(--accent)]/40 px-3.5 py-1.5 text-xs font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/5 disabled:opacity-50"
              >
                {pendingAction === 'backup-codes' ? 'Skapar…' : security.backupCodesRemaining > 0 ? 'Generera nya koder' : 'Skapa reservkoder'}
              </button>
            </div>
            {backupCodes.length > 0 && (
              <div className="grid gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 md:grid-cols-2">
                {backupCodes.map((code) => (
                  <code key={code} className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-center text-xs tracking-[0.25em] text-[var(--text-primary)]">
                    {code}
                  </code>
                ))}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Aktiva sessioner" description="Se vilka webbläsarsessioner som fortfarande är giltiga för ditt konto.">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Laddar sessioner…</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Inga aktiva sessioner hittades.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{session.userAgent || 'Okänd enhet'}</p>
                  <StatusPill tone={session.mfaVerifiedAt ? 'success' : 'neutral'}>
                    {formatSessionMethod(session.mfaMethod)}
                  </StatusPill>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  IP {session.ipAddress ?? 'okänd'} · Startad {formatDateTime(session.issuedAt)} · Gäller till {formatDateTime(session.expiresAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Lösenord" description="Uppdatera ditt lösenord regelbundet för bättre säkerhet.">
        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel>Nuvarande lösenord</FieldLabel>
            <Input value={currentPw} onChange={setCurrentPw} type="password" placeholder="Ditt nuvarande lösenord" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Nytt lösenord</FieldLabel>
              <Input value={newPw} onChange={setNewPw} placeholder="Minst 8 tecken" type="password" />
            </div>
            <div>
              <FieldLabel>Bekräfta nytt lösenord</FieldLabel>
              <Input value={confirmPw} onChange={setConfirmPw} placeholder="Upprepa lösenordet" type="password" />
            </div>
          </div>
          {pwError && <p className="text-sm text-red-500">{pwError}</p>}
          <SaveButton pending={pwPending} saved={pwSaved} onClick={() => void changePassword()} />
        </div>
      </SectionCard>
    </div>
  );
}
