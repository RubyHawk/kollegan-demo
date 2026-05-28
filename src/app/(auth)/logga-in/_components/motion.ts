import type { Variants, Transition } from 'framer-motion';

export const EASE_OUT_SOFT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const baseTransition: Transition = {
  duration: 0.36,
  ease: EASE_OUT_SOFT,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

export const wordContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.24 },
  },
};

export const wordChild: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.36, ease: EASE_OUT_SOFT },
  },
};

export const stepTransition: Transition = {
  duration: 0.28,
  ease: EASE_OUT_SOFT,
};

export const stepVariants: Variants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: stepTransition },
  exit: { opacity: 0, x: -16, transition: stepTransition },
};
