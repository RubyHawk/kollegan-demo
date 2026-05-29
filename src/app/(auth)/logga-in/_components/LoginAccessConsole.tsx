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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.48, ease: EASE_OUT_SOFT }}
    >
      <div className="auth-console__backplate" aria-hidden="true" />
      <div className="auth-console__laminate" aria-hidden="true" />

      <motion.div
        className="auth-console__capsule"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.42, ease: EASE_OUT_SOFT }}
      >
        <AuthBrandMark size={36} />
        <strong>Soleria Workspace</strong>
      </motion.div>

      <div className="auth-console__frame">
        <div className="auth-console__edge" aria-hidden="true" />
        <div className="auth-console__reflection" aria-hidden="true" />
        <div className="auth-console__surface">
          <LoginConsoleHeader mode={mode} title={title} subtitle={subtitle} />

          <div className="auth-console__content">{children}</div>

          <LoginConsoleFooter />
        </div>
      </div>
    </motion.section>
  );
}
