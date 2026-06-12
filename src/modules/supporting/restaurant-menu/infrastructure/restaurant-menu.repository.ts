import { prisma } from '@platform/database/prisma';
import type {
  CreateMenuCategoryInput,
  CreateMenuItemInput,
  CreateReservationRequestInput,
  PublicRestaurantSite,
  RestaurantMenuCategoryView,
  RestaurantMenuItemView,
  RestaurantOpeningHourView,
  UpsertOpeningHourInput,
} from '../domain/restaurant-menu.entity';

type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  items: Array<{
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
    priceCents: number | null;
    currency: string;
    imageUrl: string | null;
    allergens: string[];
    tags: string[];
    isAvailable: boolean;
    sortOrder: number;
  }>;
};

function mapItem(row: CategoryRow['items'][number]): RestaurantMenuItemView {
  return {
    id: row.id,
    categoryId: row.categoryId,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    currency: row.currency,
    imageUrl: row.imageUrl,
    allergens: row.allergens,
    tags: row.tags,
    isAvailable: row.isAvailable,
    sortOrder: row.sortOrder,
  };
}

function mapCategory(row: CategoryRow): RestaurantMenuCategoryView {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    items: row.items.map(mapItem),
  };
}

function fallbackSettings(name: string) {
  return {
    siteName: name,
    heroTitle: name,
    heroSubtitle: null,
    about: null,
    phone: null,
    email: null,
    addressLine1: null,
    addressLine2: null,
    postalCode: null,
    city: null,
    country: 'SE',
    reservationEmail: null,
    seoTitle: name,
    seoDescription: null,
  };
}

export const restaurantMenuRepository = {
  async getOrganizationBySlug(slug: string): Promise<{ id: string; name: string } | null> {
    return prisma.organization.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });
  },

  async getPublicSite(organizationId: string): Promise<PublicRestaurantSite | null> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        publicSiteSettings: true,
        restaurantMenuCategories: {
          where: { deletedAt: null, isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            description: true,
            sortOrder: true,
            isActive: true,
            items: {
              where: { deletedAt: null, isAvailable: true },
              orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
              select: {
                id: true,
                categoryId: true,
                name: true,
                description: true,
                priceCents: true,
                currency: true,
                imageUrl: true,
                allergens: true,
                tags: true,
                isAvailable: true,
                sortOrder: true,
              },
            },
          },
        },
        restaurantOpeningHours: {
          orderBy: { dayOfWeek: 'asc' },
          select: {
            id: true,
            dayOfWeek: true,
            opensAt: true,
            closesAt: true,
            isClosed: true,
            label: true,
          },
        },
        restaurantEvents: {
          where: { deletedAt: null, isPublished: true, startsAt: { gte: new Date() } },
          orderBy: { startsAt: 'asc' },
          take: 6,
          select: {
            id: true,
            title: true,
            description: true,
            startsAt: true,
            endsAt: true,
          },
        },
      },
    });

    if (!org) return null;

    return {
      organizationId: org.id,
      organizationName: org.name,
      settings: org.publicSiteSettings ?? fallbackSettings(org.name),
      categories: org.restaurantMenuCategories.map((category) => mapCategory(category as CategoryRow)),
      openingHours: org.restaurantOpeningHours.map((hour): RestaurantOpeningHourView => ({
        id: hour.id,
        dayOfWeek: hour.dayOfWeek,
        opensAt: hour.opensAt,
        closesAt: hour.closesAt,
        isClosed: hour.isClosed,
        label: hour.label,
      })),
      events: org.restaurantEvents.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt?.toISOString() ?? null,
      })),
    };
  },

  async listMenu(organizationId: string): Promise<RestaurantMenuCategoryView[]> {
    const rows = await prisma.restaurantMenuCategory.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        sortOrder: true,
        isActive: true,
        items: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            categoryId: true,
            name: true,
            description: true,
            priceCents: true,
            currency: true,
            imageUrl: true,
            allergens: true,
            tags: true,
            isAvailable: true,
            sortOrder: true,
          },
        },
      },
    });

    return rows.map((row) => mapCategory(row as CategoryRow));
  },

  async createCategory(organizationId: string, createdBy: string, input: CreateMenuCategoryInput) {
    return prisma.restaurantMenuCategory.create({
      data: {
        organizationId,
        createdBy,
        name: input.name,
        description: input.description ?? null,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  },

  async createItem(organizationId: string, createdBy: string, input: CreateMenuItemInput) {
    return prisma.restaurantMenuItem.create({
      data: {
        organizationId,
        createdBy,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description ?? null,
        priceCents: input.priceCents ?? null,
        currency: input.currency ?? 'SEK',
        imageUrl: input.imageUrl ?? null,
        allergens: input.allergens ?? [],
        tags: input.tags ?? [],
        isAvailable: input.isAvailable ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  },

  async categoryExistsInOrg(organizationId: string, categoryId: string): Promise<boolean> {
    const category = await prisma.restaurantMenuCategory.findFirst({
      where: { id: categoryId, organizationId, deletedAt: null },
      select: { id: true },
    });
    return Boolean(category);
  },

  async listOpeningHours(organizationId: string): Promise<RestaurantOpeningHourView[]> {
    return prisma.restaurantOpeningHour.findMany({
      where: { organizationId },
      orderBy: { dayOfWeek: 'asc' },
      select: { id: true, dayOfWeek: true, opensAt: true, closesAt: true, isClosed: true, label: true },
    });
  },

  async upsertOpeningHour(organizationId: string, input: UpsertOpeningHourInput) {
    return prisma.restaurantOpeningHour.upsert({
      where: { organizationId_dayOfWeek: { organizationId, dayOfWeek: input.dayOfWeek } },
      create: {
        organizationId,
        dayOfWeek: input.dayOfWeek,
        opensAt: input.opensAt ?? null,
        closesAt: input.closesAt ?? null,
        isClosed: input.isClosed ?? false,
        label: input.label ?? null,
      },
      update: {
        opensAt: input.opensAt ?? null,
        closesAt: input.closesAt ?? null,
        isClosed: input.isClosed ?? false,
        label: input.label ?? null,
      },
    });
  },

  async createReservationRequest(organizationId: string, input: CreateReservationRequestInput) {
    return prisma.restaurantReservationRequest.create({
      data: {
        organizationId,
        guestName: input.guestName,
        guestEmail: input.guestEmail ?? null,
        guestPhone: input.guestPhone ?? null,
        partySize: input.partySize,
        requestedAt: new Date(input.requestedAt),
        message: input.message ?? null,
      },
      select: { id: true, status: true, createdAt: true },
    });
  },
};
