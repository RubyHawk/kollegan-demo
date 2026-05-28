'use client';

import { EnvelopeSimple, LockKey, ShieldCheck } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  devLoginUrl,
  login,
  type MfaMethod,
} from '@shared/lib/api/auth-session.api';
import { TooltipProvider } from '@shared/ui/tooltip';
import { AuthBrandMark } from './AuthBrandMark';
import { FloatingInput } from './FloatingInput';
import { InlineError } from './InlineError';
import { MfaStep } from './MfaStep';
import { PasswordVisibilityToggle } from './PasswordVisibilityToggle';
import { RememberDeviceSwitch } from './RememberDeviceSwitch';
import { SubmitButton, type SubmitState } from './SubmitButton';
import { EASE_OUT_SOFT } from './motion';

type Step = 'login' | 'mfa';

const HEADLINES: Record<Step, { title: string; sub: string }> = {
  login: {
    title: 'Välkommen tillbaka',
    sub: 'Logga in för att fortsätta arbeta.',
  },
  mfa: {
    title: 'Bekräfta att det är du',
    sub: 'Välj en av dina registrerade metoder.',
  },
};

interface LoginFormProps {
  redirect: string;
}

export function LoginForm({ redirect }: LoginFormProps) {
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

  useEffect(() => {
    if (step === 'login') {
      const t = setTimeout(() => emailInputRef.current?.focus(), 240);
      return () => clearTimeout(t);
    }
  }, [step]);

  function handleSuccessRedirect() {
    setExiting(true);
  }

  function handleExitComplete() {
    if (exiting) {
      window.location.replace(redirect);
    }
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
      <main className="auth-login-panel">
        <AnimatePresence onExitComplete={handleExitComplete}>
          {!exiting ? (
            <motion.div
              key="card"
              className="auth-login-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ delay: 0.08, duration: 0.36, ease: EASE_OUT_SOFT }}
            >
              <div className="auth-product-pill">
                <AuthBrandMark size={44} />
                <span>Soleria Workspace</span>
              </div>

              <section className="auth-login-surface">
                <header className="auth-login-header">
                  <p className="auth-login-kicker">Intern arbetsportal</p>
                  <h1 className="auth-login-title">{header.title}</h1>
                  <p className="auth-login-subtitle">{header.sub}</p>
                </header>

                {step === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="auth-login-form">
                    <FloatingInput
                      ref={emailInputRef}
                      label="E-postadress"
                      type="email"
                      autoComplete="email"
                      placeholder="Ange din e-postadress"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      error={Boolean(error) && !email.includes('@')}
                      trailing={
                        <span className="auth-input-icon" aria-hidden="true">
                          <EnvelopeSimple size={18} weight="duotone" />
                        </span>
                      }
                    />

                    <FloatingInput
                      ref={passwordInputRef}
                      label="Lösenord"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Ange ditt lösenord"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      error={Boolean(error) && email.includes('@')}
                      trailing={
                        <div className="auth-input-trailing">
                          <span className="auth-input-icon" aria-hidden="true">
                            <LockKey size={18} weight="duotone" />
                          </span>
                          <PasswordVisibilityToggle
                            visible={showPassword}
                            onToggle={() => setShowPassword((v) => !v)}
                          />
                        </div>
                      }
                    />

                    <InlineError message={error} />

                    <div className="mt-1">
                      <RememberDeviceSwitch
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                      />
                    </div>

                    <SubmitButton state={loginState}>Logga in</SubmitButton>

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

                <div className="auth-login-note">
                  <ShieldCheck size={18} weight="duotone" />
                  <span>
                    Säker intern åtkomst för offert, order, planering och
                    installation.
                  </span>
                </div>
              </section>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </TooltipProvider>
  );
}
