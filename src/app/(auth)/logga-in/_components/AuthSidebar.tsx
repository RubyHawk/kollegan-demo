'use client';

import { motion } from 'framer-motion';
import type { PortalBrand } from '@modules/generic/branding';
import { LoginMotionScene } from './LoginMotionScene';
import { TenantBrandScene } from './TenantBrandScene';
import { EASE_OUT_SOFT } from './motion';

interface AuthSidebarProps {
  brand: PortalBrand;
}

export function AuthSidebar({ brand }: AuthSidebarProps) {
  return (
    <aside className="auth-sidebar">
      <motion.div
        className="auth-sidebar-inner"
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.12, duration: 0.55, ease: EASE_OUT_SOFT }}
      >
        {brand.key === 'platform' ? <LoginMotionScene /> : <TenantBrandScene brand={brand} />}
      </motion.div>
    </aside>
  );
}
