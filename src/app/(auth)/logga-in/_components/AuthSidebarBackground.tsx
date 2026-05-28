'use client';

import { motion } from 'framer-motion';

const ringStroke = 'var(--auth-border-hairline)';

export function AuthSidebarBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: 'var(--auth-bg-base)' }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 30% 35%, var(--auth-bg-layer-1) 0%, transparent 70%)',
        }}
      />

      <div
        className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2"
        style={{ width: 520, height: 520 }}
      >
        <motion.svg
          viewBox="0 0 520 520"
          width={520}
          height={520}
          aria-hidden="true"
          animate={{ rotate: 360 }}
          transition={{ duration: 240, repeat: Infinity, ease: 'linear' }}
          className="auth-crosshair-rotor"
        >
          <g stroke={ringStroke} strokeWidth={1} fill="none">
            <circle cx={260} cy={260} r={120} />
            <circle cx={260} cy={260} r={200} />
            <circle cx={260} cy={260} r={260} />
            <line x1={0} y1={260} x2={520} y2={260} />
            <line x1={260} y1={0} x2={260} y2={520} />
            <line x1={260} y1={0} x2={260} y2={14} strokeWidth={1.5} />
            <line x1={260} y1={506} x2={260} y2={520} strokeWidth={1.5} />
            <line x1={0} y1={260} x2={14} y2={260} strokeWidth={1.5} />
            <line x1={506} y1={260} x2={520} y2={260} strokeWidth={1.5} />
          </g>
        </motion.svg>
      </div>

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/auth/noise.png)',
          backgroundRepeat: 'repeat',
          opacity: 0.04,
          mixBlendMode: 'overlay',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent 55%, var(--auth-bg-layer-2) 100%)',
        }}
      />
    </div>
  );
}
