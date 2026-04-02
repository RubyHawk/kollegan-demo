'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onDone: () => void;
}

// Hold for this long, then signal parent to remove us.
// AnimatePresence will run the exit animation before unmounting.
const HOLD_MS = 2000;

const CARD_SPRING = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 22,
  mass: 0.8,
};

export default function SplashScreen({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, HOLD_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    // ── Overlay — NO entrance animation, covers the page from frame 0 ──
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-gradient-to-br from-stone-950 via-zinc-900 to-stone-900"
      exit={{ opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-indigo-500/[0.04] blur-3xl" />

      {/* Floating particle dots */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="pointer-events-none absolute rounded-full bg-amber-400/20"
          style={{ width: p.size, height: p.size, left: p.x, top: p.y }}
          animate={{ y: [0, -14, 0], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* ── Card — animates in ── */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-7 rounded-3xl border border-white/[0.08] bg-white/[0.04] px-14 py-11 shadow-2xl backdrop-blur-2xl"
        initial={{ opacity: 0, y: 28, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: { ...CARD_SPRING, delay: 0.05 } }}
      >
        {/* Icon */}
        <motion.div
          className="relative"
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { ...CARD_SPRING, delay: 0.18 } }}
        >
          {/* Glow halo */}
          <div className="absolute inset-0 scale-150 rounded-full bg-amber-400/20 blur-2xl" />
          <div className="absolute inset-0 scale-110 rounded-full bg-amber-400/10 blur-xl" />
          {/* Icon badge */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 splash-icon-pulse">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M5 21V7l7-4 7 4v14" />
              <path d="M9 21v-4h6v4" />
              <path d="M9 9h1" />
              <path d="M14 9h1" />
              <path d="M9 13h1" />
              <path d="M14 13h1" />
            </svg>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { ...CARD_SPRING, delay: 0.28 } }}
        >
          <h1 className="font-heading text-[1.75rem] font-bold leading-tight text-white">
            Grand Hotel Soleria
          </h1>
          <p className="mt-1.5 text-[13px] tracking-wide text-white/45">
            Storgatan 1, Stockholm
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="h-px w-6 rounded-full bg-amber-400/30" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
              Reception Management System
            </p>
            <div className="h-px w-6 rounded-full bg-amber-400/30" />
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="w-36 overflow-hidden rounded-full bg-white/[0.08]"
          style={{ height: 2 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.4 } }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400/50 to-amber-400"
            initial={{ width: '0%' }}
            animate={{
              width: '100%',
              transition: { duration: HOLD_MS / 1000 - 0.1, ease: 'easeInOut', delay: 0.35 },
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Pre-computed floating particle positions (avoids hydration mismatch)
const PARTICLES = [
  { id: 0, x: '12%',  y: '22%', size: 3, dur: 4.2, delay: 0    },
  { id: 1, x: '28%',  y: '68%', size: 2, dur: 3.8, delay: 0.7  },
  { id: 2, x: '73%',  y: '18%', size: 4, dur: 5.1, delay: 1.2  },
  { id: 3, x: '85%',  y: '72%', size: 2, dur: 4.5, delay: 0.3  },
  { id: 4, x: '55%',  y: '85%', size: 3, dur: 3.6, delay: 1.8  },
  { id: 5, x: '40%',  y: '12%', size: 2, dur: 4.8, delay: 0.9  },
  { id: 6, x: '92%',  y: '38%', size: 3, dur: 5.3, delay: 0.5  },
  { id: 7, x: '6%',   y: '55%', size: 2, dur: 4.0, delay: 1.5  },
] as const;
