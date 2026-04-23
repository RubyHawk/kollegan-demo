import { prisma } from '@platform/database/prisma';
import type { SharedFeatureFlagLike } from '@shared/lib/feature-flags';

export const offerRendererVariantRepository = {
  async findRendererFlag(
    organizationId: string,
    environment: string,
  ): Promise<SharedFeatureFlagLike | null> {
    const flag = await prisma.featureFlag.findFirst({
      where: {
        organizationId,
        key: 'public-offer-v2',
        environment,
        deletedAt: null,
      },
      select: {
        key: true,
        enabled: true,
        rolloutMode: true,
        rolloutScope: true,
        expiresAt: true,
        environment: true,
      },
    });

    if (!flag) return null;

    return {
      key: flag.key,
      enabled: flag.enabled,
      rolloutMode: flag.rolloutMode,
      rolloutScope: (flag.rolloutScope ?? {}) as SharedFeatureFlagLike['rolloutScope'],
      expiresAt: flag.expiresAt ? flag.expiresAt.toISOString() : null,
      environment: flag.environment,
    };
  },
};
