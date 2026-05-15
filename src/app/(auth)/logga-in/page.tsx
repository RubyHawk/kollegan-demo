'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { Eye, EyeSlash, Fingerprint, ShieldCheck } from '@phosphor-icons/react';
import { useSearchParams } from 'next/navigation';
import {
  devLoginUrl,
  login,
  startPasskeyAuthentication,
  verifyMfa,
  verifyPasskeyAuthentication,
  type MfaMethod,
} from '@shared/lib/api/auth-session.api';
import { BrandLockup, BrandScene } from '@shared/ui/brand';
import { OtpInput } from '@shared/ui/otp-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/ui/tooltip';

type Step = 'credentials' | 'mfa';
type MfaView = 'totp' | 'webauthn' | 'backup_code';

function sanitizeRedirect(target: string | null): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) return '/';
  return target;
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-[var(--status-danger-text)]/20 bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
      {message}
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = sanitizeRedirect(searchParams.get('redirect'));

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaMethods, setMfaMethods] = useState<MfaMethod[]>([]);
  const [mfaView, setMfaView] = useState<MfaView>('totp');
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const hasPasskey = mfaMethods.includes('webauthn');
  const availableViews: MfaView[] = [
    ...(mfaMethods.includes('totp') ? ['totp' as const] : []),
    ...(hasPasskey ? ['webauthn' as const] : []),
    ...(mfaMethods.includes('backup_code') ? ['backup_code' as const] : []),
  ];

  useEffect(() => {
    if (step === 'mfa' && hasPasskey && mfaView === 'webauthn') {
      void handlePasskey();
    }
    // handlePasskey intentionally stays outside deps so the prompt fires once on view entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, hasPasskey, mfaView]);

  async function handleCredentials(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login({ email, password, rememberMe });
      if (result.status === 'mfa_required') {
        setMfaMethods(result.methods);
        setMfaView(result.methods.includes('totp') ? 'totp' : result.methods[0] ?? 'totp');
        setStep('mfa');
        return;
      }
      window.location.replace(redirect);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyMfa(mfaView === 'backup_code' ? backupCode : totpCode);
      window.location.replace(redirect);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Network error. Try again.');
      setTotpCode('');
      setBackupCode('');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasskey() {
    setPasskeyLoading(true);
    setError('');
    try {
      const options = await startPasskeyAuthentication();
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const response = await startAuthentication({
        optionsJSON: options as Parameters<typeof startAuthentication>[0]['optionsJSON'],
      });
      await verifyPasskeyAuthentication(response);
      window.location.replace(redirect);
    } catch (passkeyError: unknown) {
      if ((passkeyError as { name?: string }).name !== 'NotAllowedError') {
        setError('Passkey verification failed. Try again.');
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-[var(--page-bg)]">
        <aside className="relative hidden w-[420px] shrink-0 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10">
          <BrandScene className="absolute inset-0" priority />
          <div className="absolute inset-0 bg-linear-to-b from-[#d5effd]/10 via-transparent to-[#13223d]/35" />
          <BrandLockup size={32} priority className="relative z-10" textClassName="text-lg text-white" />
          <div className="relative z-10 max-w-[260px]">
            <p className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-white">Welcome back.</p>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Continue into the workspace with the factor that fits this moment.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-xs text-white/65">
            <ShieldCheck size={18} />
            Multi-factor sign-in protected
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-6">
          <div className="w-full max-w-[390px]">
            <BrandLockup
              size={46}
              priority
              align="center"
              className="mb-8 flex flex-col items-center gap-2 lg:hidden"
              textClassName="text-xl text-[var(--text-primary)]"
            />

            {step === 'credentials' ? (
              <section>
                <header className="mb-6">
                  <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Sign in</h1>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Use your work account to continue.</p>
                </header>

                <form onSubmit={handleCredentials} className="flex flex-col gap-4">
                  <label className="grid gap-1.5 text-sm text-[var(--text-secondary)]">
                    Email address
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@company.com"
                      className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--accent)]/30"
                    />
                  </label>

                  <label className="grid gap-1.5 text-sm text-[var(--text-secondary)]">
                    Password
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                        className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 pr-10 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--accent)]/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
                    />
                    Remember this device
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-[var(--text-muted)] underline decoration-dotted underline-offset-4">
                          30 days
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Trust this browser for 30 days after successful MFA.</TooltipContent>
                    </Tooltip>
                  </label>

                  {error ? <ErrorBanner message={error} /> : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                  >
                    {loading ? <><Spinner /> Signing in…</> : 'Continue'}
                  </button>
                </form>

                {process.env.NODE_ENV !== 'production' ? (
                  <div className="mt-6 border-t border-[var(--border)] pt-5 text-center">
                    <a href={devLoginUrl(redirect)} className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]">
                      Dev: sign in without an account →
                    </a>
                  </div>
                ) : null}
              </section>
            ) : (
              <section>
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setError('');
                    setTotpCode('');
                    setBackupCode('');
                  }}
                  className="mb-5 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
                >
                  ← Back
                </button>

                <header className="mb-5">
                  <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Verify it’s you</h1>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Choose one enrolled method to finish signing in.</p>
                </header>

                <div className="mb-5 grid grid-cols-3 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-1 text-xs">
                  {availableViews.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setError('');
                        setMfaView(method);
                      }}
                      className={`rounded-md px-2 py-2 font-medium transition-colors ${
                        mfaView === method
                          ? 'bg-[var(--surface-0)] text-[var(--text-primary)] shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      {method === 'totp' ? 'App' : method === 'webauthn' ? 'Passkey' : 'Backup'}
                    </button>
                  ))}
                </div>

                {mfaView === 'webauthn' ? (
                  <div className="grid gap-4">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-alt)] text-[var(--text-secondary)]">
                          <Fingerprint size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">Passkey ready</p>
                          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                            Your browser prompt should open automatically. Use the passkey saved on this device or another approved device.
                          </p>
                        </div>
                      </div>
                    </div>
                    {error ? <ErrorBanner message={error} /> : null}
                    <button
                      type="button"
                      onClick={() => void handlePasskey()}
                      disabled={passkeyLoading}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                    >
                      {passkeyLoading ? <><Spinner /> Waiting for passkey…</> : 'Continue with passkey'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleMfa} className="grid gap-4">
                    {mfaView === 'totp' ? (
                      <>
                        <OtpInput value={totpCode} onChange={setTotpCode} autoFocus ariaLabel="Authenticator code" className="justify-between" />
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                          {hasPasskey ? (
                            <button type="button" onClick={() => setMfaView('webauthn')} className="text-[var(--accent)] hover:underline">
                              Use a passkey instead
                            </button>
                          ) : null}
                          {mfaMethods.includes('backup_code') ? (
                            <button type="button" onClick={() => setMfaView('backup_code')} className="text-[var(--accent)] hover:underline">
                              Use a backup code
                            </button>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <>
                        <label className="grid gap-1.5 text-sm text-[var(--text-secondary)]">
                          Backup code
                          <input
                            autoFocus
                            value={backupCode}
                            onChange={(event) => setBackupCode(event.target.value.toUpperCase().replace(/\s/g, '').slice(0, 8))}
                            maxLength={8}
                            placeholder="AB12CD34"
                            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 font-mono text-sm tracking-[0.22em] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--accent)]/30"
                          />
                        </label>
                        <p className="rounded-lg border border-[var(--status-warning-text)]/20 bg-[var(--status-warning-bg)] px-3 py-2 text-sm text-[var(--status-warning-text)]">
                          Each backup code works once. This will consume one of your ten recovery codes.
                        </p>
                      </>
                    )}

                    {error ? <ErrorBanner message={error} /> : null}

                    <button
                      type="submit"
                      disabled={loading || (mfaView === 'totp' ? totpCode.length !== 6 : backupCode.length !== 8)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? <><Spinner /> Verifying…</> : 'Verify'}
                    </button>
                  </form>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
