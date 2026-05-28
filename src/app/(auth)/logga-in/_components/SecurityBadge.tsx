'use client';

import { ShieldCheck } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { EASE_OUT_SOFT } from './motion';

export function SecurityBadge() {
  return (
    <motion.div
      className="relative z-10 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium"
      style={{
        background: 'oklch(1 0 0 / 0.06)',
        borderColor: 'var(--auth-border-hairline)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        color: 'var(--auth-text-on-dark-muted)',
        width: 'fit-content',
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.64, duration: 0.34, ease: EASE_OUT_SOFT }}
    >
      <ShieldCheck
        size={14}
        weight="duotone"
        style={{ color: 'oklch(0.85 0.10 145)' }}
      />
      Skyddad med flerfaktorinloggning
    </motion.div>
  );
}
