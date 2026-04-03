'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { EASE_SPRING } from '@shared/lib/motion';
import { SectionCard } from '../_components/shared';
import { CONNECTIONS } from './_data';

export default function AnslutningarPage() {
  const [connections, setConnections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(CONNECTIONS.map((c) => [c.id, false])),
  );
  const [connecting, setConnecting] = useState<string | null>(null);

  function toggle(id: string) {
    if (connecting) return;
    if (connections[id]) {
      setConnections((prev) => ({ ...prev, [id]: false }));
      return;
    }
    setConnecting(id);
    setTimeout(() => {
      setConnections((prev) => ({ ...prev, [id]: true }));
      setConnecting(null);
    }, 900);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Integrationer" description="Anslut Soleria till de verktyg du redan använder.">
        <div className="flex flex-col divide-y divide-[var(--border-light)]">
          {CONNECTIONS.map((integration, idx) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: idx * 0.04, ease: EASE_SPRING }}
              className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-center shrink-0">
                {integration.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{integration.name}</p>
                  {integration.badge && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-semibold">
                      {integration.badge}
                    </span>
                  )}
                  {connections[integration.id] && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                      <span className="w-1 h-1 rounded-full bg-current" />
                      Ansluten
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{integration.description}</p>
              </div>
              <button
                onClick={() => toggle(integration.id)}
                disabled={connecting === integration.id}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 shrink-0',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40',
                  connecting === integration.id
                    ? 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface-alt)] cursor-wait'
                    : connections[integration.id]
                    ? 'border-red-300/60 dark:border-red-700/40 text-red-500 hover:bg-red-500/5 hover:border-red-400/60'
                    : 'border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)]/5 hover:border-[var(--accent)]/60',
                )}
              >
                {connecting === integration.id ? 'Ansluter…' : connections[integration.id] ? 'Koppla från' : 'Anslut'}
              </button>
            </motion.div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
