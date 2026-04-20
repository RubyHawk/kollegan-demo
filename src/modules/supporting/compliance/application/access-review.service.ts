import type { AccessReviewData } from '../domain/access-review.entity';
import { accessReviewRepository } from '../infrastructure/access-review.repository';

export async function buildAccessReview(organizationId: string | null): Promise<AccessReviewData> {
  const users = await accessReviewRepository.listUsers(organizationId);
  return {
    generatedAt: new Date().toISOString(),
    totalUsers: users.length,
    users,
  };
}
