import { logger } from '@platform/logging/logger';
import { productsRepository } from '../infrastructure/products.repository';
import type { Offer } from '../domain/offer.entity';

const TAG = 'OfferProductUnits';

function normalizeProductLookupValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('sv-SE');
}

function buildProductFamilyLookupValue(value: string): string {
  return normalizeProductLookupValue(
    value
      .replace(/\d+/g, ' ')
      .replace(/[^a-zA-ZåäöÅÄÖ\s]/g, ' ')
      .replace(/\s+/g, ' '),
  );
}

function getLineItemProductCandidates(description: string): string[] {
  const value = description.trim();
  if (!value) return [];

  const separator = [' — ', ' – ', ' - '].find((candidate) => value.includes(candidate));
  const title = separator ? value.split(separator)[0]?.trim() ?? '' : value;

  return Array.from(new Set([value, title].filter(Boolean).map(normalizeProductLookupValue)));
}

export function applyProductUnitsToOffer(offer: Offer, products: Array<{ name: string; unit?: string }>): Offer {
  if (!offer.lineItems.length || !products.length) return offer;

  const unitByName = new Map<string, string>();
  const unitByFamily = new Map<string, string | null>();
  products.forEach((product) => {
    const unit = product.unit?.trim();
    if (!unit) return;
    const key = normalizeProductLookupValue(product.name);
    if (!unitByName.has(key)) unitByName.set(key, unit);

    const familyKey = buildProductFamilyLookupValue(product.name);
    if (!familyKey) return;

    if (!unitByFamily.has(familyKey)) {
      unitByFamily.set(familyKey, unit);
      return;
    }

    if (unitByFamily.get(familyKey) !== unit) {
      unitByFamily.set(familyKey, null);
    }
  });

  if (!unitByName.size) return offer;

  let didChange = false;
  const lineItems = offer.lineItems.map((item) => {
    if (item.unit?.trim()) return item;

    const matchedUnit = getLineItemProductCandidates(item.description)
      .map((candidate) => unitByName.get(candidate))
      .find((candidate): candidate is string => Boolean(candidate))
      ?? getLineItemProductCandidates(item.description)
        .map((candidate) => unitByFamily.get(buildProductFamilyLookupValue(candidate)) ?? undefined)
        .find((candidate): candidate is string => Boolean(candidate));

    if (!matchedUnit) return item;
    didChange = true;
    return { ...item, unit: matchedUnit };
  });

  return didChange ? { ...offer, lineItems } : offer;
}

export async function enrichOfferLineItemUnits(offer: Offer): Promise<Offer> {
  if (!offer.lineItems.length) return offer;

  try {
    const products = await productsRepository.list(
      offer.organizationId,
      undefined,
      undefined,
      true,
      offer.companyId,
    );
    return applyProductUnitsToOffer(offer, products);
  } catch (err) {
    logger.warn(TAG, 'Failed to resolve product units for offer line items', { err, offerId: offer.id });
    return offer;
  }
}
