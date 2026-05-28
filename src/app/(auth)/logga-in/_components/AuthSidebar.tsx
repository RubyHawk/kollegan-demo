'use client';

import { motion } from 'framer-motion';
import { BRAND_NAME } from '@shared/branding';
import { AuthBrandMark } from './AuthBrandMark';
import { AuthHeadline } from './AuthHeadline';
import { AuthSidebarBackground } from './AuthSidebarBackground';
import { PipelineMockup } from './PipelineMockup';
import { EASE_OUT_SOFT } from './motion';

export function AuthSidebar() {
  return (
    <aside className="relative hidden w-[460px] shrink-0 overflow-hidden lg:flex lg:flex-col lg:p-10">
      <AuthSidebarBackground />

      <motion.div
        className="relative z-10 flex items-center justify-between gap-3"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.12, duration: 0.4, ease: EASE_OUT_SOFT }}
      >
        <div className="flex items-center gap-2.5">
          <AuthBrandMark size={32} />
          <span
            className="text-[18px] font-semibold tracking-tight"
            style={{ color: 'var(--auth-text-on-dark)' }}
          >
            {BRAND_NAME}
          </span>
        </div>
        <span
          className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em]"
          style={{
            background: 'oklch(1 0 0 / 0.04)',
            borderColor: 'var(--auth-border-hairline)',
            color: 'var(--auth-text-on-dark-muted)',
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: 'oklch(0.85 0.10 145)' }}
          />
          I drift
        </span>
      </motion.div>

      <div className="relative z-10 mt-16 flex-1">
        <AuthHeadline />
      </div>

      <PipelineMockup />
    </aside>
  );
}
