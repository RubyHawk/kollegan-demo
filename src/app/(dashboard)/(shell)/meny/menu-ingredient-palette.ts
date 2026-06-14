/**
 * Tap-first ingredient palette for the visual dish builder.
 *
 * Restaurant staff build a dish by tapping emoji tiles instead of typing into
 * boxes. Each entry carries a sensible default unit so adding is one tap.
 */

export interface PaletteIngredient {
  emoji: string;
  name: string;
  unit?: string;
}

export interface PaletteGroup {
  label: string;
  items: PaletteIngredient[];
}

export const INGREDIENT_PALETTE: PaletteGroup[] = [
  {
    label: 'Bröd & bas',
    items: [
      { emoji: '🥖', name: 'Baguette', unit: 'st' },
      { emoji: '🍞', name: 'Surdeg', unit: 'skiva' },
      { emoji: '🥯', name: 'Bagel', unit: 'st' },
      { emoji: '🌯', name: 'Wrap', unit: 'st' },
      { emoji: '🥙', name: 'Pitabröd', unit: 'st' },
      { emoji: '🍚', name: 'Ris', unit: 'dl' },
      { emoji: '🍝', name: 'Pasta', unit: 'g' },
      { emoji: '🥗', name: 'Sallad', unit: 'dl' },
    ],
  },
  {
    label: 'Protein',
    items: [
      { emoji: '🥓', name: 'Bacon', unit: 'g' },
      { emoji: '🍗', name: 'Kyckling', unit: 'g' },
      { emoji: '🥩', name: 'Nötkött', unit: 'g' },
      { emoji: '🧆', name: 'Falafel', unit: 'st' },
      { emoji: '🐟', name: 'Lax', unit: 'g' },
      { emoji: '🐟', name: 'Tonfisk', unit: 'g' },
      { emoji: '🍤', name: 'Räkor', unit: 'g' },
      { emoji: '🥚', name: 'Ägg', unit: 'st' },
      { emoji: '🌭', name: 'Korv', unit: 'st' },
    ],
  },
  {
    label: 'Ost',
    items: [
      { emoji: '🧀', name: 'Cheddar', unit: 'skiva' },
      { emoji: '🧀', name: 'Halloumi', unit: 'g' },
      { emoji: '🧀', name: 'Mozzarella', unit: 'g' },
      { emoji: '🧀', name: 'Fetaost', unit: 'g' },
      { emoji: '🧀', name: 'Parmesan', unit: 'g' },
      { emoji: '🧀', name: 'Brie', unit: 'skiva' },
    ],
  },
  {
    label: 'Grönt',
    items: [
      { emoji: '🥬', name: 'Sallad', unit: 'blad' },
      { emoji: '🍅', name: 'Tomat', unit: 'skiva' },
      { emoji: '🥒', name: 'Gurka', unit: 'skiva' },
      { emoji: '🧅', name: 'Rödlök', unit: 'ring' },
      { emoji: '🫑', name: 'Paprika', unit: 'g' },
      { emoji: '🥑', name: 'Avokado', unit: 'st' },
      { emoji: '🌽', name: 'Majs', unit: 'dl' },
      { emoji: '🍄', name: 'Svamp', unit: 'g' },
      { emoji: '🫒', name: 'Oliver', unit: 'st' },
      { emoji: '🌶️', name: 'Jalapeño', unit: 'st' },
      { emoji: '🥕', name: 'Morot', unit: 'g' },
      { emoji: '🥑', name: 'Guacamole', unit: 'msk' },
    ],
  },
  {
    label: 'Såser & krydda',
    items: [
      { emoji: '🫙', name: 'Hummus', unit: 'msk' },
      { emoji: '🥫', name: 'Pesto', unit: 'msk' },
      { emoji: '🧄', name: 'Aioli', unit: 'msk' },
      { emoji: '🍯', name: 'Honung', unit: 'tsk' },
      { emoji: '🌿', name: 'Basilika', unit: 'nypa' },
      { emoji: '🧂', name: 'Salt & peppar', unit: 'nypa' },
      { emoji: '🫒', name: 'Olivolja', unit: 'msk' },
      { emoji: '🌶️', name: 'Sriracha', unit: 'tsk' },
      { emoji: '🥜', name: 'Jordnötssås', unit: 'msk' },
    ],
  },
  {
    label: 'Tillbehör',
    items: [
      { emoji: '🍟', name: 'Pommes', unit: 'g' },
      { emoji: '🥔', name: 'Klyftpotatis', unit: 'g' },
      { emoji: '🧅', name: 'Rostad lök', unit: 'msk' },
      { emoji: '🥜', name: 'Nötter', unit: 'g' },
      { emoji: '🫛', name: 'Edamame', unit: 'dl' },
      { emoji: '🍋', name: 'Citron', unit: 'klyfta' },
    ],
  },
];

/** Tappable unit chips shown when adjusting an ingredient. */
export const COMMON_UNITS = ['g', 'hg', 'dl', 'cl', 'msk', 'tsk', 'st', 'skiva', 'klick', 'nypa'];

const NAME_EMOJI = new Map<string, string>(
  INGREDIENT_PALETTE.flatMap((group) => group.items.map((item) => [item.name.toLowerCase(), item.emoji] as const)),
);

/** Best-effort emoji for a free-typed ingredient name; falls back to a plate. */
export function guessEmoji(name: string): string {
  return NAME_EMOJI.get(name.trim().toLowerCase()) ?? '🍽️';
}
