'use client';

import { Eye, EyeSlash } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  visible: boolean;
  onToggle: () => void;
}

export function PasswordVisibilityToggle({ visible, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Dölj lösenord' : 'Visa lösenord'}
      className="auth-password-toggle"
    >
      <AnimatePresence initial={false} mode="wait">
        {visible ? (
          <motion.span
            key="eye-slash"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="inline-flex"
          >
            <EyeSlash size={16} />
          </motion.span>
        ) : (
          <motion.span
            key="eye"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="inline-flex"
          >
            <Eye size={16} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
