const DAY_MS = 86_400_000;

export function computeOfferValidUntil(base: Date | string, validityDays: number): Date {
  const start = new Date(base);
  const next = new Date(start);
  next.setDate(next.getDate() + Math.max(1, validityDays) - 1);
  return next;
}

export function deriveValidityDays(
  base: Date | string,
  validUntil: Date | string,
): number {
  const start = new Date(base);
  const end = new Date(validUntil);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / DAY_MS) + 1);
}
