'use client';

import { Fingerprint } from '@phosphor-icons/react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  startPasskeyAuthentication,
  verifyMfa,
  verifyPasskeyAuthentication,
  type MfaMethod,
} from '@shared/lib/api/auth-session.api';
import { OtpInput } from '@shared/ui/otp-input';
import { FloatingInput } from './FloatingInput';
import { InlineError } from './InlineError';
import { SubmitButton, type SubmitState } from './SubmitButton';

type MfaView = 'totp' | 'webauthn' | 'backup_code';

interface MfaStepProps {
  methods: MfaMethod[];
  onSuccess: () => void;
  onBack: () => void;
}

const VIEW_LABEL: Record<MfaView, string> = {
  totp: 'App',
  webauthn: 'Passkey',
  backup_code: 'Säkerhetskod',
};

export function MfaStep({ methods, onSuccess, onBack }: MfaStepProps) {
  const hasPasskey = methods.includes('webauthn');
  const availableViews: MfaView[] = [
    ...(methods.includes('totp') ? ['totp' as const] : []),
    ...(hasPasskey ? ['webauthn' as const] : []),
    ...(methods.includes('backup_code') ? ['backup_code' as const] : []),
  ];

  const [view, setView] = useState<MfaView>(
    methods.includes('totp') ? 'totp' : (methods[0] ?? 'totp'),
  );
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<SubmitState>('idle');
  const [passkeyState, setPasskeyState] = useState<SubmitState>('idle');

  useEffect(() => {
    if (hasPasskey && view === 'webauthn') {
      void runPasskey();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, hasPasskey]);

  async function runPasskey() {
    setPasskeyState('loading');
    setError(null);

    try {
      const options = await startPasskeyAuthentication();
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const response = await startAuthentication({
        optionsJSON: options as Parameters<typeof startAuthentication>[0]['optionsJSON'],
      });
      await verifyPasskeyAuthentication(response);
      setPasskeyState('success');
      onSuccess();
    } catch (err) {
      const name = (err as { name?: string }).name;
      if (name === 'NotAllowedError') {
        setPasskeyState('idle');
        return;
      }

      setError('Passkey-verifiering misslyckades. Försök igen.');
      setPasskeyState('error');
      setTimeout(() => setPasskeyState('idle'), 450);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setState('loading');

    try {
      await verifyMfa(view === 'backup_code' ? backupCode : totpCode);
      setState('success');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nätverksfel. Försök igen.');
      setState('error');
      setTotpCode('');
      setBackupCode('');
      setTimeout(() => setState('idle'), 450);
    }
  }

  return (
    <div className="auth-mfa-shell">
      <button type="button" onClick={onBack} className="auth-mfa-back">
        ← Tillbaka
      </button>

      {availableViews.length > 1 ? (
        <div className="auth-mfa-tabs">
          {availableViews.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => {
                setError(null);
                setView(method);
              }}
              className={`auth-mfa-tab ${
                view === method ? 'auth-mfa-tab--active' : 'auth-mfa-tab--idle'
              }`}
            >
              {VIEW_LABEL[method]}
            </button>
          ))}
        </div>
      ) : null}

      {view === 'webauthn' ? (
        <div className="auth-mfa-form">
          <div className="auth-passkey-card">
            <div className="flex items-start gap-3">
              <div className="auth-passkey-card__icon">
                <Fingerprint size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Passkey redo
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                  Webbläsarens prompt öppnas automatiskt. Använd passkeyn som
                  sparats på den här enheten eller en annan godkänd enhet.
                </p>
              </div>
            </div>
          </div>

          <InlineError message={error} />

          <SubmitButton
            type="button"
            state={passkeyState}
            loadingLabel="Väntar på passkey..."
            onClick={() => void runPasskey()}
          >
            Fortsätt med passkey
          </SubmitButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-mfa-form">
          {view === 'totp' ? (
            <OtpInput
              value={totpCode}
              onChange={setTotpCode}
              autoFocus
              ariaLabel="Autentiseringskod"
              className="justify-between"
            />
          ) : (
            <div>
              <FloatingInput
                label="Säkerhetskod"
                autoFocus
                value={backupCode}
                placeholder="Ange din säkerhetskod"
                onChange={(event) =>
                  setBackupCode(
                    event.target.value.toUpperCase().replace(/\s/g, '').slice(0, 8),
                  )
                }
                maxLength={8}
                className="auth-input auth-input--mono"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
              />
              <p className="auth-backup-note">
                Varje säkerhetskod kan användas en gång. Detta förbrukar en av
                dina tio återställningskoder.
              </p>
            </div>
          )}

          <InlineError message={error} />

          <SubmitButton
            state={state}
            loadingLabel="Verifierar..."
            disabled={view === 'totp' ? totpCode.length !== 6 : backupCode.length !== 8}
          >
            Verifiera
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
