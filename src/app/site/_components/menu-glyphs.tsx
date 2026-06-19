// Filled, illustrated food glyphs for the dark MENYN band.
// Cream body via currentColor; interior detail lines use the band ink color
// so they read as cut-outs. Kept deliberately flat/geometric to match the
// hand-illustrated reference rather than thin outline icons.

const INK = 'var(--fp-ink)';

type MenuGlyphProps = {
  iconKey: string;
};

export function MenuGlyph({ iconKey }: MenuGlyphProps) {
  const common = {
    viewBox: '0 0 48 48',
    width: 44,
    height: 44,
    fill: 'none',
    'aria-hidden': true,
  } as const;

  if (iconKey === 'pizza') {
    return (
      <svg {...common}>
        <path d="M24 7 L9 37 Q24 43 39 37 Z" fill="currentColor" />
        <circle cx="24" cy="21" r="2.6" fill={INK} />
        <circle cx="18.5" cy="30" r="2.3" fill={INK} />
        <circle cx="29.5" cy="30" r="2.3" fill={INK} />
      </svg>
    );
  }

  if (iconKey === 'subs') {
    return (
      <svg {...common}>
        <rect x="6" y="17" width="36" height="14" rx="7" fill="currentColor" />
        <path
          d="M10 24 l3.2 -2.4 3.2 2.4 3.2 -2.4 3.2 2.4 3.2 -2.4 3.2 2.4 3.2 -2.4 3.2 2.4"
          stroke={INK}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  if (iconKey === 'kebab') {
    return (
      <svg {...common}>
        <path d="M13 14 q11 -6 22 0 L24.8 39 a1 1 0 0 1 -1.6 0 Z" fill="currentColor" />
        <path d="M15.5 20 h17 M17.5 26.5 h13 M19.5 33 h9" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (iconKey === 'panini') {
    return (
      <svg {...common}>
        <rect x="7" y="16" width="34" height="16" rx="8" fill="currentColor" />
        <path d="M13 24 l6 -6 M20 26 l8 -8 M27 26 l8 -8 M34 24 l4 -4" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (iconKey === 'salad') {
    return (
      <svg {...common}>
        <path d="M9 23 h30 l-3 12 a3 3 0 0 1 -3 2.6 H15 a3 3 0 0 1 -3 -2.6 Z" fill="currentColor" />
        <circle cx="18" cy="18.5" r="4.6" fill="currentColor" />
        <circle cx="26" cy="15" r="5.2" fill="currentColor" />
        <circle cx="33" cy="19" r="4.2" fill="currentColor" />
        <path d="M15 30 h18 M18 35 h12" stroke={INK} strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (iconKey === 'sides' || iconKey === 'drinks') {
    return (
      <svg {...common}>
        <rect x="16.5" y="9" width="3" height="15" rx="1.5" fill="currentColor" />
        <rect x="22" y="6" width="3" height="18" rx="1.5" fill="currentColor" />
        <rect x="27.5" y="9" width="3" height="15" rx="1.5" fill="currentColor" />
        <path d="M14 22 h20 l-2 16 a2 2 0 0 1 -2 1.8 H18 a2 2 0 0 1 -2 -1.8 Z" fill="currentColor" />
        <path d="M20 25 v13 M24 25 v14 M28 25 v13" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="24" cy="24" r="15" fill="currentColor" />
    </svg>
  );
}
