'use client';

import { motion } from 'framer-motion';

interface ProductErrorBannerProps {
  error: string;
  onRetry: () => void;
}

export function ProductErrorBanner({ error, onRetry }: ProductErrorBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex items-center justify-between gap-3 rounded-[var(--ui-radius-panel)] border border-[var(--ui-danger-bg)] bg-[var(--ui-danger-bg)] px-4 py-3 text-sm text-[var(--ui-danger-text)]"
    >
      <span>{error}</span>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-[var(--ui-radius-control)] border border-[color-mix(in_srgb,var(--ui-danger-text)_25%,transparent)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[color-mix(in_srgb,var(--ui-danger-text)_8%,transparent)]"
      >
        Försök igen
      </button>
    </motion.div>
  );
}
