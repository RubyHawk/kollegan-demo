import { summarizeOfferPricing } from '@modules/supporting/offers/domain/pricing';
import type { OfferPriceDisplayMode, LineItem, Offer } from '../_store/types';

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(n);
}

export function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function pricingSummary(items: LineItem[], mode: OfferPriceDisplayMode) {
  const validItems = items.filter((item) => item.description.trim() && item.quantity > 0);
  return summarizeOfferPricing(validItems, mode);
}

export function linePriceLabel(vatRate: number) {
  return vatRate > 0 ? 'inkl. moms' : 'exkl. moms';
}

export function publicUrl(token: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/offerter/publik/${token}`;
}

export function fmtOfferNumber(offer: Offer): string {
  if (!offer.offerNumber) return offer.id.slice(0, 8).toUpperCase();
  const year = new Date(offer.createdAt).getFullYear();
  return `${year}-${String(offer.offerNumber).padStart(3, '0')}`;
}

/** Returns true if a reminder can be sent (no reminder yet, or cooldown of 3 days has passed) */
export function canRemind(offer: Offer): boolean {
  if (offer.status !== 'sent' && offer.status !== 'viewed') return false;
  if (!offer.reminderSentAt) return true;
  return Date.now() - new Date(offer.reminderSentAt).getTime() >= 3 * 24 * 60 * 60 * 1000;
}
