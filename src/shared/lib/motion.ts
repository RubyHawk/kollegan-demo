/**
 * Unified motion profiles — use these everywhere instead of ad-hoc values.
 * Velocity-based springs feel more physical than duration-based transitions.
 */

/** Standard spring — card lifts, tab pills, list items */
export const SPRING_STANDARD = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 28,
  mass: 0.8,
};

/** Snappy spring — icon hover, button press, small micro-interactions */
export const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 32,
  mass: 0.6,
};

/** Bezier ease for CSS-driven transitions (no Framer Motion) */
export const EASE_SPRING = [0.16, 1, 0.3, 1] as const;

/** Tab switching — wait mode (exit fully before enter) */
export const TAB_TRANSITION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
  transition: { duration: 0.2, ease: EASE_SPRING },
};

/** Stagger container — apply to the grid/list wrapper */
export const STAGGER_CONTAINER = {
  initial: 'initial',
  animate: 'animate',
  variants: {
    initial: {},
    animate: { transition: { staggerChildren: 0.04 } },
  },
};

/** Stagger item — apply to each card/row inside STAGGER_CONTAINER */
export const STAGGER_ITEM = {
  variants: {
    initial: { opacity: 0, y: 12, scale: 0.97 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { ...SPRING_STANDARD },
    },
  },
};
