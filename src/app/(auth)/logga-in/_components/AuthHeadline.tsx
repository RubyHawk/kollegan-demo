'use client';

import { motion } from 'framer-motion';
import { EASE_OUT_SOFT, wordChild, wordContainer } from './motion';

const line1Words = ['Verksamheten.'];
const line2WordsBefore = ['Ett'];
const accentWord = 'verktyg';

export function AuthHeadline() {
  return (
    <div className="max-w-[340px]">
      <motion.h2
        className="font-[family-name:var(--font-instrument-serif)] text-[40px] leading-[1.05] tracking-[-0.02em] text-[color:var(--auth-text-on-dark)]"
        initial="hidden"
        animate="visible"
        variants={wordContainer}
      >
        <span className="block">
          {line1Words.map((word) => (
            <motion.span key={word} variants={wordChild} className="inline-block">
              {word}
            </motion.span>
          ))}
        </span>
        <span className="mt-1 block">
          {line2WordsBefore.map((word) => (
            <motion.span key={word} variants={wordChild} className="inline-block">
              {word}
              {' '}
            </motion.span>
          ))}
          <motion.span
            variants={wordChild}
            className="inline-block italic"
            style={{ color: 'var(--auth-accent-soft)' }}
          >
            {accentWord}
          </motion.span>
          <motion.span variants={wordChild} className="inline-block">
            .
          </motion.span>
        </span>
      </motion.h2>

      <motion.p
        className="mt-4 max-w-[300px] text-[13px] leading-[1.6] text-[color:var(--auth-text-on-dark-muted)]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48, duration: 0.38, ease: EASE_OUT_SOFT }}
      >
        Kunder, projekt, lager och offerter — i samma flöde.
      </motion.p>
    </div>
  );
}
