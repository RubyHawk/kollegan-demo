'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { PortalBrand } from '@modules/generic/branding';
import { AuthBrandMark } from './AuthBrandMark';
import { LoginConsoleFooter } from './LoginConsoleFooter';
import { LoginConsoleHeader } from './LoginConsoleHeader';
import { TenantBrandMark } from './TenantBrandMark';
import { EASE_OUT_SOFT } from './motion';

interface LoginAccessConsoleProps {
  mode: 'login' | 'mfa';
  brand: PortalBrand;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function LoginAccessConsole({
  mode,
  brand,
  title,
  subtitle,
  children,
}: LoginAccessConsoleProps) {
  const isPlatform = brand.key === 'platform';

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
            {isPlatform ? <AuthBrandMark size={34} /> : <TenantBrandMark name={brand.name} size={34} />}
          </span>
          <span>
            <strong>{brand.name}</strong>
            <small>{brand.workspaceLabel}</small>
          </span>
        </div>
        {isPlatform ? (
          <span className="auth-console__sun-anchor">
            <AuthBrandMark size={20} />
            <span>
              <strong>Solfilm</strong>
              <small>redo</small>
            </span>
          </span>
        ) : null}
      </div>

      <div className="auth-console__panel">
        <LoginConsoleHeader mode={mode} title={title} subtitle={subtitle} />
        <div className="auth-console__content">{children}</div>
      </div>

      <LoginConsoleFooter note={brand.accessNote} />
    </motion.section>
  );
}
