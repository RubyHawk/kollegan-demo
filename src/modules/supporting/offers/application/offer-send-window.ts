import type { Offer } from '../domain/offer.entity';
import type { OfferBrandingProfile } from './company-branding';
import { generateDocument, generateFallbackDocument } from './document-generator';
import { computeOfferValidUntil } from '../domain/validity';

export function resolveGeneratedDocumentForSend(input: {
  existingGeneratedDocument?: string;
  templateContent?: string;
  sendSnapshot: Offer;
  branding: OfferBrandingProfile;
}): { generatedDocument: string; usesCurrentTemplate: boolean } {
  const storedSnapshot = input.existingGeneratedDocument?.trim();
  if (storedSnapshot) {
    return {
      generatedDocument: input.existingGeneratedDocument!,
      usesCurrentTemplate: false,
    };
  }

  if (input.templateContent) {
    return {
      generatedDocument: generateDocument(input.templateContent, input.sendSnapshot, input.branding),
      usesCurrentTemplate: true,
    };
  }

  return {
    generatedDocument: generateFallbackDocument(input.sendSnapshot, input.branding),
    usesCurrentTemplate: false,
  };
}

export function resolveOfferSendWindow(
  existing: Offer,
  now: Date = new Date(),
): {
  sentAt: Date;
  validUntil: Date;
  publicTokenExpiresAt: Date;
} {
  const hasStoredSnapshot = Boolean(existing.generatedDocument?.trim());

  if (hasStoredSnapshot) {
    const sentAt = existing.sentAt ? new Date(existing.sentAt) : now;
    const validUntil = new Date(existing.validUntil);
    return {
      sentAt,
      validUntil,
      publicTokenExpiresAt: existing.publicTokenExpiresAt
        ? new Date(existing.publicTokenExpiresAt)
        : validUntil,
    };
  }

  const sentAt = now;
  const validUntil = computeOfferValidUntil(sentAt, existing.validityDays ?? 30);
  return {
    sentAt,
    validUntil,
    publicTokenExpiresAt: validUntil,
  };
}
