/**
 * Identity service — organization management business logic.
 *
 * No Prisma here. No HTTP here.
 * Delegates all persistence to identityRepository.
 */

import { logger } from '@platform/logging/logger';
import type { CreateOrgInput, Organization } from '../domain/organization.entity';
import { identityRepository } from '../infrastructure/identity.repository';

const TAG = 'IdentityService';

export const identityService = {
  async getOrg(id: string): Promise<Organization | null> {
    return identityRepository.findOrgById(id);
  },

  async getOrgBySlug(slug: string): Promise<Organization | null> {
    return identityRepository.findOrgBySlug(slug);
  },

  async createOrg(input: CreateOrgInput): Promise<Organization> {
    const existing = await identityRepository.findOrgBySlug(input.slug);
    if (existing) {
      throw new Error(`Organization with slug "${input.slug}" already exists.`);
    }
    const org = await identityRepository.createOrg(input);
    logger.info(TAG, `Organization created: ${org.slug}`, { orgId: org.id });
    return org;
  },

  async listOrgs(): Promise<Organization[]> {
    return identityRepository.listOrgs();
  },

  async updateOrgEmailSettings(
    orgId: string,
    settings: { senderEmail?: string | null; senderName?: string | null; emailHeaderConfig?: string | null },
  ): Promise<Organization> {
    const org = await identityRepository.updateOrg(orgId, settings);
    logger.info(TAG, `Org email settings updated`, { orgId });
    return org;
  },

  async updateOrgThemeSettings(
    orgId: string,
    settings: {
      themeMode?: string | null;
      themeAccent?: string | null;
      themeFontFamily?: string | null;
      themeFontSize?: string | null;
    },
  ): Promise<Organization> {
    const org = await identityRepository.updateOrg(orgId, settings);
    logger.info(TAG, `Org theme settings updated`, { orgId });
    return org;
  },

  async updateOrgNotificationRecipients(
    orgId: string,
    notificationRecipients: string,
  ): Promise<Organization> {
    const org = await identityRepository.updateOrg(orgId, { notificationRecipients });
    logger.info(TAG, `Org notification recipients updated`, { orgId });
    return org;
  },

  /**
   * Returns the demo organization, creating it if it doesn't exist.
   * Used by the demo seed endpoint and development tooling.
   */
  async getOrCreateDemoOrg(): Promise<Organization> {
    const org = await identityRepository.upsertOrg({
      name: 'Grand Hotel Soleria (Demo)',
      slug: 'demo',
      plan: 'demo',
    });
    logger.info(TAG, `Demo org ready: ${org.id}`);
    return org;
  },
};
