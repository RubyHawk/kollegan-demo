'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { AuthBrandMark } from './AuthBrandMark';
import { LoginConsoleFooter } from './LoginConsoleFooter';
import { LoginConsoleHeader } from './LoginConsoleHeader';
import { EASE_OUT_SOFT } from './motion';

interface LoginAccessConsoleProps {
  mode: 'login' | 'mfa';
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function LoginAccessConsole({
  mode,
  title,
  subtitle,
  children,
}: LoginAccessConsoleProps) {
  return (
    <motion.section
      className="auth-console"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.42, ease: EASE_OUT_SOFT }}
    >
      <div className="auth-console__wash" aria-hidden="true" />

      <div className="auth-console__topbar">
        <div className="auth-console__brand">
          <span className="auth-console__brand-mark">
            <AuthBrandMark size={34} />
          </span>
          <span>
            <strong>Soleria</strong>
            <small>Intern arbetsyta</small>
          </span>
        </div>
        <span className="auth-console__sun-anchor">
          <AuthBrandMark size={20} />
          <span>
            <strong>Solfilm</strong>
            <small>redo</small>
          </span>
        </span>
      </div>

      <div className="auth-console__panel">
        <LoginConsoleHeader mode={mode} title={title} subtitle={subtitle} />
        <div className="auth-console__content">{children}</div>
      </div>

      <LoginConsoleFooter />
    </motion.section>
  );
}
