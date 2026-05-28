'use client';

import { motion } from 'framer-motion';
import { LoginMotionScene } from './LoginMotionScene';
import { EASE_OUT_SOFT } from './motion';

export function AuthSidebar() {
  return (
    <aside className="auth-sidebar">
      <motion.div
        className="auth-sidebar-inner"
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.12, duration: 0.55, ease: EASE_OUT_SOFT }}
      >
        <LoginMotionScene />
      </motion.div>
    </aside>
  );
}
