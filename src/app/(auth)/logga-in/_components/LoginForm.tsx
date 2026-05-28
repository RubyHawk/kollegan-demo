'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  devLoginUrl,
  login,
  type MfaMethod,
} from '@shared/lib/api/auth-session.api';
import { BrandLockup } from '@shared/ui/brand';
import { TooltipProvider } from '@shared/ui/tooltip';
import { FloatingInput } from './FloatingInput';
import { InlineError } from './InlineError';
import { MfaStep } from './MfaStep';
import { PasswordVisibilityToggle } from './PasswordVisibilityToggle';
import { RememberDeviceSwitch } from './RememberDeviceSwitch';
import { SubmitButton, type SubmitState } from './SubmitButton';
import { EASE_OUT_SOFT, fadeUp, stepVariants } from './motion';

type Step = 'login' | 'mfa';

const HEADLINES: Record<Step, { title: string; sub: string }> = {
  login: { title: 'Logga in', sub: 'Använd ditt arbetskonto för att fortsätta.' },
  mfa: { title: 'Bekräfta att det är du', sub: 'Välj en av dina registrerade metoder.' },
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
      <main className="flex flex-1 flex-col items-center justify-center bg-white px-8 py-14 sm:px-12">
        <AnimatePresence onExitComplete={handleExitComplete}>
          {!exiting ? (
            <motion.div
              key="card"
              className="w-full max-w-[400px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ delay: 0.08, duration: 0.36, ease: EASE_OUT_SOFT }}
            >
              <motion.div
                className="mb-10 flex justify-center lg:hidden"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <BrandLockup
                  size={40}
                  priority
                  align="center"
                  className="flex flex-col items-center gap-2"
                  textClassName="text-[18px] font-semibold"
                />
              </motion.div>

              <header className="mb-7 min-h-[68px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: EASE_OUT_SOFT }}
                  >
                    <h1 className="text-[30px] font-bold tracking-[-0.03em] text-gray-900">
                      {header.title}
                    </h1>
                    <p className="mt-1.5 text-[14px] leading-6 text-gray-500">
                      {header.sub}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </header>

              <AnimatePresence mode="wait">
                {step === 'login' ? (
                  <motion.form
                    key="login-step"
                    onSubmit={handleLoginSubmit}
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex flex-col gap-3.5"
                  >
                    <FloatingInput
                      ref={emailInputRef}
                      label="E-postadress"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      error={Boolean(error) && !email.includes('@')}
                    />

                    <FloatingInput
                      ref={passwordInputRef}
                      label="Lösenord"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      error={Boolean(error) && email.includes('@')}
                      trailing={
                        <PasswordVisibilityToggle
                          visible={showPassword}
                          onToggle={() => setShowPassword((v) => !v)}
                        />
                      }
                    />

                    <InlineError message={error} />

                    <div className="mt-1 flex items-center justify-between">
                      <RememberDeviceSwitch
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                      />
                    </div>

                    <SubmitButton state={loginState}>Logga in</SubmitButton>

                    {process.env.NODE_ENV !== 'production' ? (
                      <div className="mt-3 border-t border-gray-100 pt-4 text-center">
                        <a
                          href={devLoginUrl(redirect)}
                          className="text-xs text-gray-400 underline decoration-dotted underline-offset-4 transition-colors hover:text-gray-600"
                        >
                          Dev: logga in utan konto →
                        </a>
                      </div>
                    ) : null}
                  </motion.form>
                ) : (
                  <motion.div
                    key="mfa-step"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <MfaStep
                      methods={mfaMethods}
                      onSuccess={handleMfaSuccess}
                      onBack={() => setStep('login')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </TooltipProvider>
  );
}
