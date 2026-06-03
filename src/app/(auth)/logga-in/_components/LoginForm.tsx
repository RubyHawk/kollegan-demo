'use client';

import { EnvelopeSimple, LockKey } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import {
  devLoginUrl,
  login,
  type MfaMethod,
} from '@shared/lib/api/auth-session.api';
import { LOGIN_CINEMATIC_NAVIGATION_DELAY_MS } from '@shared/lib/login-cinematic-timing';
import { useCinematic } from '@shared/stores/cinematic.store';
import { TooltipProvider } from '@shared/ui/tooltip';
import { FloatingInput } from './FloatingInput';
import { InlineError } from './InlineError';
import { LoginAccessConsole } from './LoginAccessConsole';
import { MfaStep } from './MfaStep';
import { PasswordVisibilityToggle } from './PasswordVisibilityToggle';
import { RememberDeviceSwitch } from './RememberDeviceSwitch';
import { SubmitButton, type SubmitState } from './SubmitButton';
import { EASE_OUT_SOFT } from './motion';

type Step = 'login' | 'mfa';

const HEADLINES: Record<Step, { title: string; sub: string }> = {
  login: {
    title: 'Välkommen tillbaka',
    sub: 'Verifiera dig så tar arbetsytan vid.',
  },
  mfa: {
    title: 'Bekräfta att det är du',
    sub: 'Välj en av dina registrerade metoder.',
  },
};

interface LoginFormProps {
  redirect: string;
  onCinematicStart: () => void;
}

export function LoginForm({ redirect, onCinematicStart }: LoginFormProps) {
  const router = useRouter();
  const { arm } = useCinematic();
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaMethods, setMfaMethods] = useState<MfaMethod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loginState, setLoginState] = useState<SubmitState>('idle');
  const [exiting, setExiting] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  function handleSuccessRedirect() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      router.push(redirect);
      return;
    }
    setExiting(true);
    onCinematicStart();
    router.prefetch(redirect);
    window.setTimeout(() => router.prefetch(redirect), 900);
    // At 70% of the 7.2s cinematic (5.04s) the film is fully applied and
    // mist is blooming — perfect bridge point to soft-navigate. The dashboard
    // mounts with the wipe overlay already at 70% via negative animation-delay.
    window.setTimeout(() => {
      arm();
      router.push(redirect);
    }, LOGIN_CINEMATIC_NAVIGATION_DELAY_MS);
  }

  function handleExitComplete() {
    return;
  }

  async function handleLoginSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Ange en giltig e-postadress.');
      setLoginState('error');
      setTimeout(() => setLoginState('idle'), 450);
      emailInputRef.current?.focus();
      return;
    }

    if (!password) {
      setError('Ange ditt lösenord.');
      setLoginState('error');
      setTimeout(() => setLoginState('idle'), 450);
      passwordInputRef.current?.focus();
      return;
    }

    setLoginState('loading');

    try {
      const result = await login({ email, password, rememberMe });
      if (result.status === 'mfa_required') {
        setMfaMethods(result.methods);
        setLoginState('idle');
        setStep('mfa');
        return;
      }

      setLoginState('success');
      setTimeout(handleSuccessRedirect, 240);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nätverksfel. Försök igen.');
      setLoginState('error');
      setPassword('');
      setTimeout(() => setLoginState('idle'), 450);
      passwordInputRef.current?.focus();
    }
  }

  function handleMfaSuccess() {
    setTimeout(handleSuccessRedirect, 240);
  }

  const header = HEADLINES[step];

  return (
    <TooltipProvider delayDuration={150}>
      <main
        className="auth-login-panel"
        data-state={exiting ? 'cinematic' : loginState === 'success' ? 'success' : 'idle'}
      >
        <div className="auth-login-panel__atmosphere" aria-hidden="true" />
        <div className="auth-login-panel__grid" aria-hidden="true" />

        <AnimatePresence onExitComplete={handleExitComplete}>
          {!exiting ? (
            <motion.div
              key="console-shell"
              className="auth-login-panel__inner"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ delay: 0.08, duration: 0.36, ease: EASE_OUT_SOFT }}
            >
              <LoginAccessConsole
                mode={step}
                title={header.title}
                subtitle={header.sub}
              >
                {step === 'login' ? (
                  <form
                    onSubmit={handleLoginSubmit}
                    className="auth-console-form"
                    noValidate
                  >
                    <div className="auth-console-fields">
                      <FloatingInput
                        ref={emailInputRef}
                        label="E-postadress"
                        labelIcon={<EnvelopeSimple size={14} weight="duotone" />}
                        type="email"
                        autoComplete="email"
                        placeholder="Ange din e-postadress"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        error={Boolean(error) && !email.includes('@')}
                      />

                      <FloatingInput
                        ref={passwordInputRef}
                        label="Lösenord"
                        labelIcon={<LockKey size={14} weight="duotone" />}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Ange ditt lösenord"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        error={Boolean(error) && email.includes('@')}
                        trailing={
                          <div className="auth-input-trailing">
                            <PasswordVisibilityToggle
                              visible={showPassword}
                              onToggle={() => setShowPassword((value) => !value)}
                            />
                          </div>
                        }
                      />
                    </div>

                    <InlineError message={error} />

                    <div className="auth-console-action-tray">
                      <RememberDeviceSwitch
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                      />
                      <SubmitButton state={loginState}>Logga in</SubmitButton>
                    </div>

                    {process.env.NODE_ENV !== 'production' ? (
                      <div className="auth-dev-login">
                        <a href={devLoginUrl(redirect)} className="auth-dev-login__link">
                          Dev: logga in utan konto →
                        </a>
                      </div>
                    ) : null}
                  </form>
                ) : (
                  <MfaStep
                    methods={mfaMethods}
                    onSuccess={handleMfaSuccess}
                    onBack={() => setStep('login')}
                  />
                )}
              </LoginAccessConsole>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </TooltipProvider>
  );
}
