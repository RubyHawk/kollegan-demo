'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { ClockIcon, XCircleIcon } from '@shared/ui/icons';

import type { PageState } from '../_types/public-offer.types';
import { PdfBadgePill } from './pdf-badge-pill';

type TerminalState = Extract<PageState, 'expired' | 'error' | 'accepted' | 'declined'>;

type TerminalConfig = {
  icon: ReactNode;
  title: string;
  sub: string;
};

const TERMINAL_CONFIG: Record<TerminalState, TerminalConfig> = {
  expired: {
    icon: <ClockIcon size={40} className="text-slate-400" />,
    title: 'Länken har gått ut',
    sub: 'Kontakta ansvarig kontakt för att få en ny länk till offerten.',
  },
  error: {
    icon: <XCircleIcon size={40} className="text-red-400" />,
    title: 'Offerten hittades inte',
    sub: 'Kontrollera länken och försök igen.',
  },
  accepted: {
    icon: null,
    title: 'Offert signerad',
    sub: 'Tack! Din underskrift är registrerad och ansvarig kontakt har nu fått besked.',
  },
  declined: {
    icon: null,
    title: 'Offert avvisad',
    sub: 'Din avvisning är registrerad och ansvarig kontakt har nu fått besked.',
  },
};

function SuccessCheckmark() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
      className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <motion.circle
          cx="20"
          cy="20"
          r="18"
          stroke="#16a34a"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        <motion.path
          d="M12 20l5 5 11-11"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        />
      </svg>
    </motion.div>
  );
}

function DeclineMark() {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.08 }}
      className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 shadow-[0_0_0_10px_rgba(254,226,226,0.55)]"
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <motion.circle
          cx="20"
          cy="20"
          r="18"
          stroke="#dc2626"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.12 }}
        />
        <motion.path
          d="M14 14l12 12M26 14L14 26"
          stroke="#dc2626"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, delay: 0.42 }}
        />
      </svg>
    </motion.div>
  );
}

export function PublicOfferLoadingScreen() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-slate-400"
      >
        Laddar offert...
      </motion.div>
    </div>
  );
}

export function PublicOfferSigningScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[80vh] flex-col items-center justify-center gap-4"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-800"
      />
      <p className="text-sm text-slate-500">Signerar offert...</p>
    </motion.div>
  );
}

export function PublicOfferTerminalScreen({
  state,
  hasGeneratedDocument,
  downloading,
  onDownloadPdf,
}: {
  state: TerminalState;
  hasGeneratedDocument: boolean;
  downloading: boolean;
  onDownloadPdf: () => void;
}) {
  const cfg = TERMINAL_CONFIG[state];
  const isDeclinedState = state === 'declined';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex min-h-[80vh] items-center justify-center px-6"
      >
        <div className={`w-full max-w-md rounded-2xl border p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.06)] ${isDeclinedState ? 'border-red-200/80 bg-gradient-to-b from-red-50/90 to-white' : 'border-slate-200/60 bg-white'}`}>
          {state === 'accepted' ? (
            <SuccessCheckmark />
          ) : state === 'declined' ? (
            <DeclineMark />
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
              className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${isDeclinedState ? 'bg-red-50' : 'bg-slate-50'}`}
            >
              {cfg.icon}
            </motion.div>
          )}
          <h1 className={`mb-2 text-xl font-bold ${isDeclinedState ? 'text-red-700' : 'text-slate-900'}`}>{cfg.title}</h1>
          <p className={`text-sm leading-relaxed ${isDeclinedState ? 'text-red-700/80' : 'text-slate-500'}`}>{cfg.sub}</p>

          {state === 'accepted' && hasGeneratedDocument && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <button
                onClick={onDownloadPdf}
                disabled={downloading}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md active:scale-[0.97] disabled:opacity-50"
              >
                {downloading ? 'Laddar ner...' : 'Ladda ner som PDF'}
                <PdfBadgePill />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
