import { prisma } from '@platform/database/prisma';

export interface OfferOrganizationProfile {
  id: string;
  name: string;
  senderEmail?: string;
  senderName?: string;
  emailHeaderConfig?: string;
  notificationRecipients?: string;
}

export interface OfferResponsibleUser {
  name: string;
  email: string;
}

export interface OfferNotificationRecipient {
  id: string;
  email: string;
  tags: string[];
}

function parseNotificationRecipients(serialized?: string | null): OfferNotificationRecipient[] {
  if (!serialized) return [];

  try {
    const raw = JSON.parse(serialized);
    if (!Array.isArray(raw)) return [];

    return raw.flatMap((candidate) => {
      if (!candidate || typeof candidate !== 'object') return [];

      const value = candidate as {
        id?: string;
        email?: string;
        tags?: string[];
      };

      if (!value.id || !value.email || !Array.isArray(value.tags)) return [];

      return [{
        id: value.id,
        email: value.email,
        tags: value.tags.filter((tag): tag is string => typeof tag === 'string'),
      }];
    });
  } catch {
    return [];
  }
}

export const offerBrandingRepository = {
  async findOrganizationProfile(organizationId: string): Promise<OfferOrganizationProfile | null> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        senderEmail: true,
        senderName: true,
        emailHeaderConfig: true,
        notificationRecipients: true,
      },
    });

    if (!org) return null;

    return {
      id: org.id,
      name: org.name,
      senderEmail: org.senderEmail ?? undefined,
      senderName: org.senderName ?? undefined,
      emailHeaderConfig: org.emailHeaderConfig ?? undefined,
      notificationRecipients: org.notificationRecipients ?? undefined,
    };
  },

  async findResponsibleUser(userId: string): Promise<OfferResponsibleUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) return null;

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
    return {
      name,
      email: user.email,
    };
  },

  async findUserEmail(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email ?? null;
  },

  async findUserOrganizationId(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    return user?.organizationId ?? null;
  },

  async listNotificationRecipients(organizationId: string): Promise<OfferNotificationRecipient[]> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { notificationRecipients: true },
    });
    return parseNotificationRecipients(org?.notificationRecipients);
  },
};
