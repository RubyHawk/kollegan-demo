import { Check, Download, Printer } from 'lucide-react';
import type {
  ActiveSessionRecord,
  PasskeyRecord,
  SecurityMfaStatus,
} from '@shared/lib/api/auth-security.api';
import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';
import { StatusBadge } from '@shared/ui/status-badge';
import { SectionCard } from '../_components/shared';

export function formatDateTime(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-GB');
}

export function formatRelativeDate(value: string | null): string {
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

export function deviceLabel(passkey: PasskeyRecord): string {
  if (passkey.credentialDeviceType === 'singleDevice') return 'Device-bound key';
  if (passkey.credentialBackedUp) return 'Synced passkey';
  return 'Passkey';
}

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  return <StatusBadge tone={tone}>{children}</StatusBadge>;
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

export function SecurityOverviewSection({
  loading,
  securityError,
  security,
  graceWarning,
  needsStepUp,
  actionError,
  actionNotice,
}: {
  loading: boolean;
  securityError: string;
  security: SecurityMfaStatus | null;
  graceWarning: string | null | false;
  needsStepUp: boolean;
  actionError: string;
  actionNotice: string;
}) {
  const strength = strengthFor(security);

  return (
    <SectionCard title="Security" description="Sign-in strength, recovery coverage, and active sessions at a glance.">
      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Loading security state...</p>
      ) : securityError ? (
        <InlineAlert tone="danger">{securityError}</InlineAlert>
      ) : security ? (
        <div className="grid gap-4">
          <div>
            <div className="flex items-center gap-2">
              <StatusPill tone={strength.tone}>{strength.label}</StatusPill>
              <StatusPill tone={security.currentSessionMfaAuthenticated ? 'success' : 'neutral'}>
                {security.currentSessionMfaAuthenticated ? 'Current session verified' : 'Step-up required'}
              </StatusPill>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ui-text-secondary)]">{strength.rationale}</p>
          </div>
          {graceWarning ? (
            <InlineAlert tone="warning">
              Add a sign-in method before {formatDateTime(security.graceExpiresAt)} to avoid enforcement blocking this account.
            </InlineAlert>
          ) : null}
          {needsStepUp ? (
            <InlineAlert tone="info">
              Sign in again with MFA before adding, removing, or regenerating factors in this session.
            </InlineAlert>
          ) : null}
          {actionError ? <InlineAlert tone="danger">{actionError}</InlineAlert> : null}
          {actionNotice ? <InlineAlert tone="success">{actionNotice}</InlineAlert> : null}
        </div>
      ) : null}
    </SectionCard>
  );
}

export function BackupCodesSection({
  security,
  backupCodes,
  backupCountLabel,
  needsStepUp,
  onRegenerate,
  onCopyAll,
  onDownload,
  onPrint,
}: {
  security: SecurityMfaStatus | null;
  backupCodes: string[];
  backupCountLabel: string;
  needsStepUp: boolean;
  onRegenerate: () => void;
  onCopyAll: () => void;
  onDownload: () => void;
  onPrint: () => void;
}) {
  return (
    <SectionCard title="Backup codes" description="Recovery-only codes for the day your normal factor is unavailable.">
      {!security ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Loading...</p>
      ) : (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <StatusPill tone={security.backupCodesRemaining <= 3 ? 'warning' : 'neutral'}>{backupCountLabel}</StatusPill>
              <p className="text-sm text-[var(--ui-text-secondary)]">Recovery codes are not primary sign-in factors.</p>
            </div>
            <Button type="button" variant="outline" onClick={onRegenerate} disabled={!security.enabled || needsStepUp}>
              Regenerate
            </Button>
          </div>

          {backupCodes.length > 0 ? (
            <div className="grid gap-4 rounded-[var(--ui-radius-lg)] border border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] p-4">
              <div>
                <p className="text-sm font-semibold text-[var(--ui-text)]">We won&apos;t show these again.</p>
                <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">Store them somewhere separate from your normal sign-in device.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {backupCodes.map((code) => (
                  <div key={code} className="flex items-center gap-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
                    <code className="flex-1 font-mono text-sm text-[var(--ui-text)]">{code}</code>
                    <button type="button" onClick={() => void navigator.clipboard.writeText(code)} className="text-xs text-[var(--ui-accent)] hover:underline">
                      Copy
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={onCopyAll}>
                  <Check aria-hidden="true" size={16} strokeWidth={1.75} />
                  Copy all
                </Button>
                <Button type="button" variant="outline" onClick={onDownload}>
                  <Download aria-hidden="true" size={16} strokeWidth={1.75} />
                  Download .txt
                </Button>
                <Button type="button" variant="outline" onClick={onPrint}>
                  <Printer aria-hidden="true" size={16} strokeWidth={1.75} />
                  Print
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}

export function ActiveSessionsSection({
  loading,
  sessions,
}: {
  loading: boolean;
  sessions: ActiveSessionRecord[];
}) {
  return (
    <SectionCard title="Active sessions" description="Browsers that still hold a valid session for this account.">
      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">No active sessions found.</p>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--ui-text)]">{session.userAgent || 'Unknown device'}</p>
                <StatusPill tone={session.mfaVerifiedAt ? 'success' : 'neutral'}>{formatSessionMethod(session.mfaMethod)}</StatusPill>
              </div>
              <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                IP {session.ipAddress ?? 'unknown'} - Started {formatDateTime(session.issuedAt)} - Expires {formatDateTime(session.expiresAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
