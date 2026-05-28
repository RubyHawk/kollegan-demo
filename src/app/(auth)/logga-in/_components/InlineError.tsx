'use client';

import { Warning } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE_OUT_SOFT } from './motion';

export function InlineError({ message }: { message: string | null }) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.div
          key="err"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: EASE_OUT_SOFT }}
          className="overflow-hidden"
        >
          <p
            className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-[1.4]"
            style={{ color: 'var(--status-danger-text)' }}
            role="alert"
          >
            <Warning size={14} weight="fill" className="mt-[2px] shrink-0" />
            <span>{message}</span>
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
