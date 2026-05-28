'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Buildings, House, Storefront } from '@phosphor-icons/react';
import { EASE_OUT_SOFT } from './motion';

type EntryType = 'villa' | 'brf' | 'kontor' | 'restaurang';

const POOL: { type: EntryType; name: string; city: string; area: number; film: string }[] = [
  { type: 'brf',        name: 'Brf Vintergatan',     city: 'Göteborg',     area: 248, film: 'Privacy Frost' },
  { type: 'villa',      name: 'Villa Karlström',     city: 'Saltsjöbaden', area:  64, film: 'Solar Bronze 35' },
  { type: 'kontor',     name: 'Polhem AB',           city: 'Uppsala',      area: 184, film: 'Premium Black' },
  { type: 'villa',      name: 'Villa Bergström',     city: 'Lidingö',      area:  92, film: 'Anti-Glare HD' },
  { type: 'brf',        name: 'Brf Sjöutsikt',       city: 'Nacka',        area: 156, film: 'Solar Bronze 35' },
  { type: 'restaurang', name: 'Solgården',           city: 'Malmö',        area:  86, film: 'Solar Silver 20' },
  { type: 'kontor',     name: 'Sundbyberg Tech',     city: 'Sundbyberg',   area: 412, film: 'Energy Pro 70' },
  { type: 'villa',      name: 'Villa Nordin',        city: 'Djursholm',    area:  48, film: 'UV-Skydd Plus' },
  { type: 'brf',        name: 'Brf Solbacken',       city: 'Solna',        area: 192, film: 'Privacy Frost' },
  { type: 'kontor',     name: 'Hagströms Arkitekt',  city: 'Stockholm',    area: 138, film: 'Energy Pro 70' },
];

const ICONS = { villa: House, brf: Buildings, kontor: Briefcase, restaurang: Storefront };
const AGOS = ['nyss', '6 min sedan', '23 min sedan'];

export function LiveInstallationsTicker() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setOffset((o) => (o + 1) % POOL.length), 4200);
    return () => clearInterval(id);
  }, []);

  const items = [0, 1, 2].map((i) => {
    const idx = (offset + i) % POOL.length;
    return { ...POOL[idx], slot: i, ago: AGOS[i] };
  });

  return (
    <motion.div
      className="relative w-full overflow-hidden rounded-2xl border p-5"
      style={{
        background: 'oklch(1 0 0 / 0.035)',
        borderColor: 'var(--auth-border-hairline)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.88, duration: 0.5, ease: EASE_OUT_SOFT }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className="text-[10px] font-medium uppercase tracking-[0.16em]"
          style={{ color: 'var(--auth-text-on-dark-muted)' }}
        >
          Senaste installationer
        </span>
        <span
          className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em]"
          style={{ color: 'oklch(0.85 0.10 145)' }}
        >
          <span className="relative inline-flex h-1.5 w-1.5">
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: 'oklch(0.85 0.10 145)' }}
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.6, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span
              className="relative inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: 'oklch(0.85 0.10 145)' }}
            />
          </span>
          Live
        </span>
      </div>

      <div className="relative" style={{ minHeight: 156 }}>
        <AnimatePresence mode="wait">
          <motion.ul
            key={offset}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
              exit: { opacity: 0, transition: { duration: 0.2 } },
            }}
            className="flex flex-col gap-3"
          >
            {items.map((item) => {
              const Icon = ICONS[item.type];
              return (
                <motion.li
                  key={item.slot}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: EASE_OUT_SOFT } },
                    exit: { opacity: 0, y: -4 },
                  }}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: 'oklch(1 0 0 / 0.06)',
                        color: 'var(--auth-text-on-dark-muted)',
                      }}
                    >
                      <Icon size={14} weight="regular" />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span
                        className="truncate text-[12.5px] font-medium leading-tight"
                        style={{ color: 'var(--auth-text-on-dark)' }}
                      >
                        {item.name}
                      </span>
                      <span
                        className="mt-0.5 flex items-center gap-1.5 text-[10.5px] leading-tight"
                        style={{ color: 'var(--auth-text-on-dark-muted)' }}
                      >
                        <span>{item.city}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.film}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span
                      className="text-[12px] font-medium tabular-nums"
                      style={{ color: 'var(--auth-text-on-dark)' }}
                    >
                      {item.area} m²
                    </span>
                    <span
                      className="mt-0.5 text-[10px]"
                      style={{ color: 'var(--auth-text-on-dark-muted)' }}
                    >
                      {item.ago}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
