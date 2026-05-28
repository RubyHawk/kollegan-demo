'use client';

import { motion } from 'framer-motion';
import { CaretUp, FileText } from '@phosphor-icons/react';
import { EASE_OUT_SOFT } from './motion';

const bars = [
  { label: 'Dec', value: 38 },
  { label: 'Jan', value: 46 },
  { label: 'Feb', value: 41 },
  { label: 'Mar', value: 62 },
  { label: 'Apr', value: 71 },
  { label: 'Maj', value: 94 },
];

type Stage = 'signed' | 'review' | 'sent';

const activity: { name: string; stage: Stage; amount: string; ago: string }[] = [
  { name: 'Acme Sweden AB',     stage: 'signed', amount: '346 000', ago: '2 min' },
  { name: 'Volvo Construction', stage: 'review', amount: '287 400', ago: '18 min' },
  { name: 'Nordic Industries',  stage: 'sent',   amount: '124 800', ago: '1 h' },
];

const STAGE_LABEL: Record<Stage, string> = {
  signed: 'Signerad',
  review: 'Granskning',
  sent: 'Skickad',
};

const STAGE_DOT: Record<Stage, string> = {
  signed: 'var(--auth-success)',
  review: 'var(--auth-accent-soft)',
  sent: 'oklch(1 0 0 / 0.35)',
};

export function PipelineMockup() {
  return (
    <motion.div
      className="relative z-10 w-full overflow-hidden rounded-2xl border p-5"
      style={{
        background: 'oklch(1 0 0 / 0.035)',
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
          Aktiv pipeline
        </span>
        <span
          className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em]"
          style={{ color: 'oklch(0.85 0.10 145)' }}
        >
          <span className="relative inline-flex h-1.5 w-1.5">
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: 'oklch(0.85 0.10 145)' }}
              animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.4, 1] }}
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

      <div className="mt-3 flex items-baseline gap-2">
        <span
          className="font-[family-name:var(--font-instrument-serif)] text-[30px] leading-none tracking-[-0.02em]"
          style={{ color: 'var(--auth-text-on-dark)' }}
        >
          847 200 kr
        </span>
      </div>

      <div
        className="mt-1.5 flex items-center gap-1 text-[11px]"
        style={{ color: 'oklch(0.85 0.10 145)' }}
      >
        <CaretUp size={10} weight="bold" />
        <span>+12,4% mot förra perioden</span>
      </div>

      <div className="mt-4 flex h-14 items-end gap-1.5">
        {bars.map((bar, i) => {
          const isLast = i === bars.length - 1;
          return (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-full w-full items-end">
                <motion.div
                  className="w-full rounded-[2px]"
                  style={{
                    background: isLast
                      ? 'var(--auth-accent-soft)'
                      : 'oklch(1 0 0 / 0.16)',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${bar.value}%` }}
                  transition={{
                    delay: 0.92 + i * 0.06,
                    duration: 0.5,
                    ease: EASE_OUT_SOFT,
                  }}
                />
              </div>
              <span
                className="text-[9px] tracking-wide"
                style={{
                  color: isLast
                    ? 'var(--auth-text-on-dark)'
                    : 'var(--auth-text-on-dark-muted)',
                }}
              >
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="my-4 h-px"
        style={{ background: 'var(--auth-border-hairline)' }}
      />

      <div className="flex flex-col gap-2.5">
        {activity.map((row, i) => (
          <motion.div
            key={row.name}
            className="flex items-center justify-between gap-3"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 1.22 + i * 0.08,
              duration: 0.34,
              ease: EASE_OUT_SOFT,
            }}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                style={{
                  background: 'oklch(1 0 0 / 0.06)',
                  color: 'var(--auth-text-on-dark-muted)',
                }}
              >
                <FileText size={12} weight="regular" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span
                  className="truncate text-[12px] font-medium leading-tight"
                  style={{ color: 'var(--auth-text-on-dark)' }}
                >
                  {row.name}
                </span>
                <span
                  className="flex items-center gap-1.5 text-[10px] leading-tight"
                  style={{ color: 'var(--auth-text-on-dark-muted)' }}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: STAGE_DOT[row.stage] }}
                  />
                  <span>{STAGE_LABEL[row.stage]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{row.ago} sedan</span>
                </span>
              </div>
            </div>
            <span
              className="shrink-0 text-[11px] tabular-nums"
              style={{ color: 'var(--auth-text-on-dark-muted)' }}
            >
              {row.amount} kr
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
