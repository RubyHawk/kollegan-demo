'use client';

import { motion } from 'framer-motion';
import { BRAND_NAME } from '@shared/branding';
import { AuthBrandMark } from './AuthBrandMark';
import { AuthHeadline } from './AuthHeadline';
import { AuthSidebarBackground } from './AuthSidebarBackground';
import { InstalledAreaCard } from './InstalledAreaCard';
import { LiveInstallationsTicker } from './LiveInstallationsTicker';
import { EASE_OUT_SOFT } from './motion';

export function AuthSidebar() {
  return (
    <aside className="relative hidden w-[520px] shrink-0 overflow-hidden lg:flex lg:flex-col lg:p-9">
      <AuthSidebarBackground />

      <motion.div
        className="relative z-10 flex items-center gap-2.5"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4, ease: EASE_OUT_SOFT }}
      >
        <AuthBrandMark size={28} />
        <span
          className="text-[17px] font-semibold tracking-tight"
          style={{ color: 'var(--auth-text-on-dark)' }}
        >
          {BRAND_NAME}
        </span>
      </motion.div>

      <div className="relative z-10 mt-10">
        <AuthHeadline />
      </div>

      <div className="relative z-10 mt-auto flex flex-col gap-3 pt-10">
        <InstalledAreaCard />
        <LiveInstallationsTicker />
      </div>
    </aside>
  );
}
