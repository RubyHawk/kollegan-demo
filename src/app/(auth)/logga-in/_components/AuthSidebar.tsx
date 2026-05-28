'use client';

import { motion } from 'framer-motion';
import { BRAND_NAME } from '@shared/branding';
import { AuthBrandMark } from './AuthBrandMark';
import { AuthHeadline } from './AuthHeadline';
import { AuthSidebarBackground } from './AuthSidebarBackground';
import { SecurityBadge } from './SecurityBadge';
import { EASE_OUT_SOFT } from './motion';

export function AuthSidebar() {
  return (
    <aside className="relative hidden w-[420px] shrink-0 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10">
      <AuthSidebarBackground />

      <motion.div
        className="relative z-10 flex items-center gap-2.5"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.12, duration: 0.4, ease: EASE_OUT_SOFT }}
      >
        <AuthBrandMark size={32} />
        <span
          className="text-[18px] font-semibold tracking-tight"
          style={{ color: 'var(--auth-text-on-dark)' }}
        >
          {BRAND_NAME}
        </span>
      </motion.div>

      <AuthHeadline />

      <SecurityBadge />
    </aside>
  );
}
