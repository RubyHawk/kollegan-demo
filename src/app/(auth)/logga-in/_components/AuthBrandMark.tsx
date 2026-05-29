'use client';

import { motion } from 'framer-motion';
import { EASE_OUT_SOFT } from './motion';

interface AuthBrandMarkProps {
  size?: number;
}

const drawTransition = { duration: 0.9, delay: 0.12, ease: EASE_OUT_SOFT };

const ringStroke = 'oklch(0.92 0.04 92 / 0.78)';
const accentStroke = 'oklch(0.83 0.14 82)';
const innerFill = 'oklch(1 0 0 / 0.04)';

const ringTicks: Array<[number, number, number, number]> = [
  [64, 10, 64, 22],
  [64, 106, 64, 118],
  [10, 64, 22, 64],
  [106, 64, 118, 64],
  [25.82, 25.82, 34.31, 34.31],
  [93.69, 93.69, 102.18, 102.18],
  [102.18, 25.82, 93.69, 34.31],
  [34.31, 93.69, 25.82, 102.18],
];

const ringTicksInner: Array<[number, number, number, number]> = [
  [64, 20, 64, 26],
  [64, 102, 64, 108],
  [20, 64, 26, 64],
  [102, 64, 108, 64],
];

export function AuthBrandMark({ size = 32 }: AuthBrandMarkProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      aria-hidden="true"
      initial="hidden"
      animate="visible"
    >
      <g stroke={ringStroke} strokeLinecap="round" strokeWidth={6}>
        {ringTicks.map(([x1, y1, x2, y2], i) => (
          <motion.line
            key={`tick-outer-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            variants={{
              hidden: { pathLength: 0, opacity: 0 },
              visible: { pathLength: 1, opacity: 1, transition: drawTransition },
            }}
          />
        ))}
        {ringTicksInner.map(([x1, y1, x2, y2], i) => (
          <motion.line
            key={`tick-inner-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            variants={{
              hidden: { pathLength: 0, opacity: 0 },
              visible: { pathLength: 1, opacity: 1, transition: drawTransition },
            }}
          />
        ))}
      </g>

      <motion.circle
        cx={64}
        cy={64}
        r={36}
        fill={innerFill}
        stroke={ringStroke}
        strokeWidth={7}
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 1, transition: drawTransition },
        }}
      />

      <motion.circle
        cx={64}
        cy={64}
        r={28}
        fill={accentStroke}
        fillOpacity={0.16}
        stroke={accentStroke}
        strokeWidth={1.5}
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 1, transition: drawTransition },
        }}
      />

      <g stroke={accentStroke} strokeLinecap="round" strokeWidth={5}>
        <motion.line
          x1={64}
          y1={38}
          x2={64}
          y2={90}
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { pathLength: 1, opacity: 1, transition: drawTransition },
          }}
        />
        <motion.line
          x1={38}
          y1={64}
          x2={90}
          y2={64}
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { pathLength: 1, opacity: 1, transition: drawTransition },
          }}
        />
      </g>
    </motion.svg>
  );
}
