'use client';

import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { CaretUp } from '@phosphor-icons/react';
import { EASE_OUT_SOFT } from './motion';

const INITIAL_TOTAL = 127384;

export function InstalledAreaCard() {
  const value = useMotionValue(INITIAL_TOTAL - 2400);
  const display = useTransform(value, (v) => Math.round(v).toLocaleString('sv-SE'));
  const [target, setTarget] = useState(INITIAL_TOTAL);

  useEffect(() => {
    const controls = animate(value, INITIAL_TOTAL, {
      duration: 1.8,
      ease: 'easeOut',
      delay: 0.92,
    });
    return controls.stop;
  }, [value]);

  useEffect(() => {
    const id = setInterval(() => {
      setTarget((t) => t + Math.floor(Math.random() * 28) + 8);
    }, 7200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const controls = animate(value, target, { duration: 2.4, ease: 'easeOut' });
    return controls.stop;
  }, [target, value]);

  return (
    <motion.div
      className="relative w-full overflow-hidden rounded-2xl border p-5"
      style={{
        background: 'oklch(1 0 0 / 0.04)',
        borderColor: 'var(--auth-border-hairline)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.72, duration: 0.5, ease: EASE_OUT_SOFT }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-medium uppercase tracking-[0.16em]"
          style={{ color: 'var(--auth-text-on-dark-muted)' }}
        >
          Monterad solfilm totalt
        </span>
        <span
          className="flex items-center gap-1 text-[11px]"
          style={{ color: 'oklch(0.85 0.10 145)' }}
        >
          <CaretUp size={10} weight="bold" />
          <span>+234 m² i veckan</span>
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <motion.span
          className="font-[family-name:var(--font-instrument-serif)] text-[36px] leading-none tracking-[-0.02em] tabular-nums"
          style={{ color: 'var(--auth-text-on-dark)' }}
        >
          {display}
        </motion.span>
        <span
          className="text-[14px]"
          style={{ color: 'var(--auth-text-on-dark-muted)' }}
        >
          m²
        </span>
      </div>

      <div
        className="mt-1.5 text-[11px]"
        style={{ color: 'var(--auth-text-on-dark-muted)' }}
      >
        över 2 184 fönster sedan 2019 · 47 städer
      </div>
    </motion.div>
  );
}
