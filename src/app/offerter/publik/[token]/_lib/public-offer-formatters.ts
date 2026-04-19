export const SIG_FONTS = [
  { id: 'cursive1', family: "'Segoe Script', 'Bradley Hand', cursive", label: 'Handskrift' },
  { id: 'cursive2', family: "'Brush Script MT', 'Snell Roundhand', cursive", label: 'Elegant' },
  { id: 'serif', family: "'Georgia', 'Times New Roman', serif", label: 'Klassisk' },
  { id: 'mono', family: "'Courier New', monospace", label: 'Maskin' },
] as const;

export type SignatureFontId = typeof SIG_FONTS[number]['id'];

export const SWEDISH_MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'] as const;

export function fmtSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(n);
}

export function fmtQuantityWithUnit(quantity: number, unit?: string) {
  const formattedQuantity = new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: Number.isInteger(quantity) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(quantity) ? 0 : 2,
  }).format(quantity);
  const trimmedUnit = unit?.trim() ?? '';
  const normalizedUnit = trimmedUnit.toLocaleLowerCase('sv-SE');
  const displayUnit = (
    ['m2', 'm^2', 'm²', 'kvm'].includes(normalizedUnit) ? 'm²'
      : ['m3', 'm^3', 'm³'].includes(normalizedUnit) ? 'm³'
        : trimmedUnit || 'st'
  );
  return `${formattedQuantity} ${displayUnit}`;
}

function formatCompactSwedishDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getDate()} ${SWEDISH_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function fmtDate(iso: string) {
  return formatCompactSwedishDate(iso);
}

export function todaySv() {
  return formatCompactSwedishDate(new Date());
}

export function textToSignatureImage(text: string, fontFamily: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 150;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 600, 150);
  ctx.font = `44px ${fontFamily}`;
  ctx.fillStyle = '#0f172a';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 24, 75);
  return canvas.toDataURL('image/png');
}
