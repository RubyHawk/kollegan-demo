'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_SPRING } from '@shared/lib/motion';
import { SectionCard, FieldLabel, Input, SaveButton, Icon, type UserProps } from '../_components/shared';

type MfaStep = 'idle' | 'scan' | 'confirm' | 'backup' | 'disable';

export default function SakerhetClient({ user }: { user: UserProps }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwPending, setPwPending] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  const [mfaEnabled, setMfaEnabled] = useState(user.mfaEnabled ?? false);
  const [mfaStep, setMfaStep] = useState<MfaStep>('idle');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaQr, setMfaQr] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disableCode, setDisableCode] = useState('');

  async function changePassword() {
    setPwPending(true);
    setPwError('');
    setPwSaved(false);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setPwError(data.error ?? 'Något gick fel.');
        return;
      }
      setPwSaved(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setPwSaved(false), 3000);
    } catch {
      setPwError('Nätverksfel. Försök igen.');
    } finally {
      setPwPending(false);
    }
  }

  async function startMfaSetup() {
    setMfaLoading(true);
    setMfaError('');
    try {
      const res = await fetch('/api/auth/mfa/setup', { method: 'POST' });
      if (!res.ok) {
        setMfaError('Kunde inte starta MFA-konfiguration. Försök igen.');
        return;
      }
      const { data } = await res.json() as { data: { qrDataUrl: string; secret: string } };
      setMfaQr(data.qrDataUrl);
      setMfaSecret(data.secret);
      setMfaStep('scan');
    } catch {
      setMfaError('Nätverksfel. Försök igen.');
    } finally {
      setMfaLoading(false);
    }
  }

  async function confirmMfaSetup() {
    setMfaLoading(true);
    setMfaError('');
    try {
      const res = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mfaCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { detail?: string };
        setMfaError(data.detail ?? 'Ogiltig kod. Kontrollera din autentiseringsapp och försök igen.');
        setMfaCode('');
        return;
      }
      const { data } = await res.json() as { data: { backupCodes: string[] } };
      setBackupCodes(data.backupCodes);
      setMfaCode('');
      setMfaStep('backup');
      setMfaEnabled(true);
    } catch {
      setMfaError('Nätverksfel. Försök igen.');
    } finally {
      setMfaLoading(false);
    }
  }

  async function confirmMfaDisable() {
    setMfaLoading(true);
    setMfaError('');
    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { detail?: string };
        setMfaError(data.detail ?? 'Ogiltig kod. Försök igen.');
        setDisableCode('');
        return;
      }
      setDisableCode('');
      setMfaStep('idle');
      setMfaEnabled(false);
    } catch {
      setMfaError('Nätverksfel. Försök igen.');
    } finally {
      setMfaLoading(false);
    }
  }

  function cancelMfa() {
    setMfaStep('idle');
    setMfaError('');
    setMfaCode('');
    setDisableCode('');
    setMfaQr('');
    setMfaSecret('');
    setBackupCodes([]);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Password */}
      <SectionCard title="Lösenord" description="Uppdatera ditt lösenord regelbundet för bättre säkerhet.">
        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel>Nuvarande lösenord</FieldLabel>
            <Input value={currentPw} onChange={setCurrentPw} type="password" placeholder="Ditt nuvarande lösenord" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* MFA */}
      <SectionCard title="Tvåfaktorsautentisering" description="Lägg till ett extra lager av säkerhet till ditt konto.">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-center shrink-0">
              <Icon path={<><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>} size={18} className="text-[var(--text-secondary)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Autentiseringsapp</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Genererar tidsbegränsade engångskoder (TOTP)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {mfaEnabled ? (
              <>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wide">Aktiv</span>
                {mfaStep === 'idle' && (
                  <button
                    onClick={() => { setMfaStep('disable'); setMfaError(''); }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-red-300/60 dark:border-red-700/40 text-red-500 hover:bg-red-500/5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400/40"
                  >
                    Inaktivera
                  </button>
                )}
              </>
            ) : (
              <>
                <span className="px-2 py-0.5 rounded-md bg-[var(--border-light)] text-[var(--text-muted)] text-[10px] font-semibold uppercase tracking-wide">Ej aktiverad</span>
                {mfaStep === 'idle' && (
                  <button
                    onClick={() => void startMfaSetup()}
                    disabled={mfaLoading}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)]/5 hover:border-[var(--accent)]/60 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {mfaLoading ? 'Laddar…' : 'Aktivera'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <AnimatePresence>
          {mfaStep !== 'idle' && (
            <motion.div
              key={mfaStep}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: EASE_SPRING }}
              className="overflow-hidden"
            >
              <div className="mt-4 border-t border-[var(--border)] pt-4 flex flex-col gap-4">
                {mfaStep === 'scan' && (
                  <>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Skanna QR-koden med din autentiseringsapp (t.ex. Google Authenticator eller Authy), klicka sedan på <strong>Nästa</strong>.
                    </p>
                    <div className="flex flex-col items-center gap-3">
                      {mfaQr && (
                        <img src={mfaQr} alt="TOTP QR-kod" className="w-40 h-40 rounded-xl border border-[var(--border)]" />
                      )}
                      <div className="w-full">
                        <p className="text-[11px] text-[var(--text-muted)] mb-1">Eller ange koden manuellt:</p>
                        <code className="block w-full text-center text-xs font-mono bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-3 py-2 tracking-widest select-all break-all">
                          {mfaSecret}
                        </code>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelMfa} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Avbryt</button>
                      <button onClick={() => { setMfaStep('confirm'); setMfaError(''); }} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity">Nästa</button>
                    </div>
                  </>
                )}

                {mfaStep === 'confirm' && (
                  <>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Ange den 6-siffriga koden från din autentiseringsapp för att bekräfta aktiveringen.
                    </p>
                    <div>
                      <FieldLabel>Verifieringskod</FieldLabel>
                      <input
                        type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-primary)] text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                      />
                    </div>
                    {mfaError && <p className="text-xs text-red-500">{mfaError}</p>}
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setMfaStep('scan')} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Tillbaka</button>
                      <button
                        onClick={() => void confirmMfaSetup()}
                        disabled={mfaCode.length < 6 || mfaLoading}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait"
                      >
                        {mfaLoading ? 'Verifierar…' : 'Aktivera MFA'}
                      </button>
                    </div>
                  </>
                )}

                {mfaStep === 'backup' && (
                  <>
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-400/30 text-amber-700 dark:text-amber-300">
                      <Icon path={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>} size={16} className="shrink-0 mt-0.5" />
                      <p className="text-xs">MFA aktiverat! Spara dessa reservkoder på ett säkert ställe — de visas aldrig igen.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {backupCodes.map((code) => (
                        <code key={code} className="text-center text-xs font-mono bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-2 py-1.5 tracking-widest">{code}</code>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <button onClick={cancelMfa} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity">Klar</button>
                    </div>
                  </>
                )}

                {mfaStep === 'disable' && (
                  <>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Ange din nuvarande TOTP-kod eller ett reservkod för att inaktivera tvåfaktorsautentisering.
                    </p>
                    <div>
                      <FieldLabel>Verifieringskod</FieldLabel>
                      <input
                        type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus
                        value={disableCode}
                        onChange={(e) => setDisableCode(e.target.value)}
                        placeholder="123456"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-primary)] text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-red-400/40"
                      />
                    </div>
                    {mfaError && <p className="text-xs text-red-500">{mfaError}</p>}
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelMfa} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Avbryt</button>
                      <button
                        onClick={() => void confirmMfaDisable()}
                        disabled={disableCode.length < 1 || mfaLoading}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-red-300/60 dark:border-red-700/40 text-red-500 hover:bg-red-500/5 transition-all disabled:opacity-50 disabled:cursor-wait"
                      >
                        {mfaLoading ? 'Inaktiverar…' : 'Inaktivera MFA'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* Active session */}
      <SectionCard title="Aktiv session" description="Din nuvarande inloggningssession.">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)]">
          <div className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] flex items-center justify-center shrink-0">
            <Icon path={<><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>} size={14} className="text-[var(--text-secondary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--text-primary)]">Webbläsarsession</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{user.email} · Aktiv nu</p>
          </div>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold shrink-0">
            <span className="w-1 h-1 rounded-full bg-current" />
            Nu
          </span>
        </div>
      </SectionCard>
    </div>
  );
}
