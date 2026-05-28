'use client';

import { Check } from '@phosphor-icons/react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { EASE_OUT_SOFT } from './motion';

export type SubmitState = 'idle' | 'loading' | 'success' | 'error';

interface SubmitButtonProps {
  state: SubmitState;
  children: ReactNode;
  loadingLabel?: string;
  disabled?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function SubmitButton({
  state,
  children,
  loadingLabel = 'Loggar in...',
  disabled,
  type = 'submit',
  onClick,
}: SubmitButtonProps) {
  const controls = useAnimationControls();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const widthLocked = useRef(false);

  useLayoutEffect(() => {
    if (buttonRef.current && !widthLocked.current && state === 'idle') {
      const width = buttonRef.current.offsetWidth;
      if (width > 0) {
        buttonRef.current.style.minWidth = `${width}px`;
        widthLocked.current = true;
      }
    }
  }, [state]);

  useEffect(() => {
    if (state === 'error') {
      void controls.start({
        x: [0, -6, 6, -4, 4, -2, 0],
        transition: { duration: 0.4, ease: 'easeInOut' },
      });
    }
  }, [state, controls]);

  const isInteractive = state === 'idle';
  const background = state === 'success' ? 'var(--auth-success)' : 'var(--auth-accent)';

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      disabled={disabled || state === 'loading' || state === 'success'}
      animate={controls}
      className="auth-submit-button group"
      style={{
        background,
        transitionTimingFunction: 'var(--ease-out-soft)',
        opacity: state === 'loading' ? 0.9 : 1,
        cursor: state === 'loading' ? 'wait' : undefined,
      }}
      whileHover={isInteractive ? { y: -1 } : undefined}
      whileTap={isInteractive ? { y: 0 } : undefined}
    >
      <span className="auth-submit-button__sheen" aria-hidden="true" />
      <AnimatePresence initial={false} mode="wait">
        {state === 'success' ? (
          <motion.span
            key="success"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: EASE_OUT_SOFT }}
            className="inline-flex items-center gap-2"
          >
            <Check size={18} weight="bold" />
          </motion.span>
        ) : state === 'loading' ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT_SOFT }}
            className="inline-flex items-center gap-2"
          >
            <Spinner />
            <span>{loadingLabel}</span>
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT_SOFT }}
            className="inline-flex items-center gap-2"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
