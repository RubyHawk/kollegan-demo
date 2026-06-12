'use client';

import { motion } from 'framer-motion';
import type { PortalBrand } from '@modules/generic/branding';
import { EASE_OUT_SOFT } from './motion';

interface TenantBrandSceneProps {
  brand: PortalBrand;
}

/**
 * Brand panel for tenant portals (non-platform brands). Replaces the Soleria
 * motion scene with the tenant's own workspace identity.
 */
export function TenantBrandScene({ brand }: TenantBrandSceneProps) {
  return (
    <section className="auth-tenant-scene" data-brand={brand.key}>
      <div className="auth-tenant-scene__glow" aria-hidden="true" />
      <motion.div
        className="auth-tenant-scene__content"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.5, ease: EASE_OUT_SOFT }}
      >
        <p className="auth-tenant-scene__eyebrow">{brand.workspaceLabel}</p>
        <h2 className="auth-tenant-scene__wordmark">{brand.name}</h2>
        <p className="auth-tenant-scene__tagline">{brand.tagline}</p>
        {brand.highlights.length > 0 ? (
          <ul className="auth-tenant-scene__highlights">
            {brand.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        ) : null}
      </motion.div>
    </section>
  );
}
