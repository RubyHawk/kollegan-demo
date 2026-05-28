'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from '@phosphor-icons/react';
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

type Step = 'email' | 'password' | 'mfa';

const HEADLINES: Record<Step, { title: string; sub: string }> = {
  email: { title: 'Välkommen tillbaka', sub: 'Logga in med ditt arbetskonto för att fortsätta.' },
  password: { title: 'Ange lösenord', sub: 'Skriv in lösenordet kopplat till ditt konto.' },
  mfa: { title: 'Bekräfta att det är du', sub: 'Välj en av dina registrerade metoder.' },
};

interface LoginFormProps {
  redirect: string;
}

export function LoginForm({ redirect }: LoginFormProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaMethods, setMfaMethods] = useState<MfaMethod[]>([]);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailState, setEmailState] = useState<SubmitState>('idle');
  const [passwordState, setPasswordState] = useState<SubmitState>('idle');
  const [exiting, setExiting] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (step === 'password') {
      const t = setTimeout(() => passwordInputRef.current?.focus(), 280);
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

  function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    setEmailError(null);
    if (!email || !email.includes('@')) {
      setEmailError('Ange en giltig e-postadress.');
      setEmailState('error');
      setTimeout(() => setEmailState('idle'), 450);
      return;
    }
    setStep('password');
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordState('loading');
    try {
      const result = await login({ email, password, rememberMe });
      if (result.status === 'mfa_required') {
        setMfaMethods(result.methods);
        setPasswordState('idle');
        setStep('mfa');
        return;
      }
      setPasswordState('success');
      setTimeout(handleSuccessRedirect, 240);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Nätverksfel. Försök igen.');
      setPasswordState('error');
      setTimeout(() => setPasswordState('idle'), 450);
    }
  }

  function handleMfaSuccess() {
    setTimeout(handleSuccessRedirect, 240);
  }

  const header = HEADLINES[step];

  return (
    <TooltipProvider delayDuration={150}>
      <main className="flex flex-1 flex-col items-center justify-center bg-white px-10 py-14 sm:px-14">
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

              <header className="mb-8 min-h-[74px]">
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
                {step === 'email' ? (
                  <motion.form
                    key="email-step"
                    onSubmit={handleEmailSubmit}
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex flex-col gap-4"
                  >
                    <div>
                      <FloatingInput
                        label="E-postadress"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        error={Boolean(emailError)}
                      />
                      <InlineError message={emailError} />
                    </div>

                    <SubmitButton state={emailState}>Fortsätt</SubmitButton>

                    {process.env.NODE_ENV !== 'production' ? (
                      <div className="mt-2 border-t border-gray-100 pt-5 text-center">
                        <a
                          href={devLoginUrl(redirect)}
                          className="text-xs text-gray-400 underline decoration-dotted underline-offset-4 transition-colors hover:text-gray-600"
                        >
                          Dev: logga in utan konto →
                        </a>
                      </div>
                    ) : null}
                  </motion.form>
                ) : step === 'password' ? (
                  <motion.form
                    key="password-step"
                    onSubmit={handlePasswordSubmit}
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex flex-col gap-4"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setPasswordError(null);
                      }}
                      className="-mt-1 flex w-fit items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-gray-600"
                    >
                      <ArrowLeft size={12} weight="bold" />
                      <span>{email}</span>
                    </button>

                    <div>
                      <FloatingInput
                        ref={passwordInputRef}
                        label="Lösenord"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        error={Boolean(passwordError)}
                        trailing={
                          <PasswordVisibilityToggle
                            visible={showPassword}
                            onToggle={() => setShowPassword((v) => !v)}
                          />
                        }
                      />
                      <InlineError message={passwordError} />
                    </div>

                    <RememberDeviceSwitch
                      checked={rememberMe}
                      onCheckedChange={setRememberMe}
                    />

                    <SubmitButton state={passwordState}>Logga in</SubmitButton>
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
                      onBack={() => setStep('password')}
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
