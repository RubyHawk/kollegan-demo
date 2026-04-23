import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@platform/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@modules/supporting/offers/infrastructure/offer-renderer-variant.repository', () => ({
  offerRendererVariantRepository: {
    findRendererFlag: vi.fn(),
  },
}));

import { logger } from '@platform/logging/logger';
import { offerRendererVariantRepository } from '@modules/supporting/offers/infrastructure/offer-renderer-variant.repository';
import { resolvePublicOfferRendererVariant } from '@modules/supporting/offers/application/public-offer-renderer.service';

describe('resolvePublicOfferRendererVariant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns next when the rollout enables the public offer flag', async () => {
    vi.mocked(offerRendererVariantRepository.findRendererFlag).mockResolvedValue({
      key: 'public-offer-v2',
      enabled: true,
      rolloutMode: 'on',
      rolloutScope: {},
      expiresAt: null,
      environment: 'production',
    });

    await expect(resolvePublicOfferRendererVariant({
      id: 'offer_1',
      organizationId: 'org_1',
    })).resolves.toBe('next');
  });

  it('returns legacy when no matching flag exists', async () => {
    vi.mocked(offerRendererVariantRepository.findRendererFlag).mockResolvedValue(null);

    await expect(resolvePublicOfferRendererVariant({
      id: 'offer_1',
      organizationId: 'org_1',
    })).resolves.toBe('legacy');
  });

  it('fails open to legacy and logs when the flag repository throws', async () => {
    vi.mocked(offerRendererVariantRepository.findRendererFlag).mockRejectedValue(new Error('db down'));

    await expect(resolvePublicOfferRendererVariant({
      id: 'offer_1',
      organizationId: 'org_1',
    })).resolves.toBe('legacy');
    expect(logger.warn).toHaveBeenCalledOnce();
  });
});
