import { logger } from '@platform/logging/logger';
import { evaluateSharedFeatureFlagRollout } from '@shared/lib/feature-flags';
import { offerRendererVariantRepository } from '../infrastructure/offer-renderer-variant.repository';
import { OFFERS_SERVICE_TAG } from './offer-service-support';

type PublicOfferVariantSource = {
  id?: unknown;
  organizationId?: unknown;
};

export async function resolvePublicOfferRendererVariant(
  offer: PublicOfferVariantSource,
): Promise<'legacy' | 'next'> {
  const organizationId = typeof offer.organizationId === 'string' ? offer.organizationId : null;
  const offerId = typeof offer.id === 'string' ? offer.id : null;
  if (!organizationId || !offerId) return 'legacy';

  const environment = process.env.NEXT_PUBLIC_APP_ENV ?? 'production';
  try {
    const flag = await offerRendererVariantRepository.findRendererFlag(organizationId, environment);
    if (!flag) return 'legacy';

    const evaluation = evaluateSharedFeatureFlagRollout(flag, {
      organizationId,
      key: flag.key,
      environment,
      contextKey: offerId,
    });

    return evaluation.enabled ? 'next' : 'legacy';
  } catch (err) {
    logger.warn(OFFERS_SERVICE_TAG, 'Failed to resolve public offer renderer variant', { err, offerId });
    return 'legacy';
  }
}
