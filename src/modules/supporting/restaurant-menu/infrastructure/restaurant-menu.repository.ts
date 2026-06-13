import { prisma } from '@platform/database/prisma';
import type {
  CreateMenuCategoryInput,
  CreateMenuItemInput,
  CreateRestaurantEventInput,
  CreateReservationRequestInput,
  ListReservationRequestsInput,
  PublicRestaurantSite,
  PublicSiteSettingsView,
  RestaurantEventManagementView,
  RestaurantMenuCategoryView,
  RestaurantMenuItemView,
  RestaurantOpeningHourView,
  RestaurantReservationRequestView,
  UpdateMenuCategoryInput,
  UpdateMenuItemInput,
  UpdatePublicSiteSettingsInput,
  UpdateRestaurantEventInput,
  UpdateReservationRequestInput,
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

type ReservationRow = {
  id: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  partySize: number;
  requestedAt: Date;
  message: string | null;
  status: string;
  handledBy: string | null;
  handledAt: Date | null;
  createdAt: Date;
};

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function mapReservation(row: ReservationRow): RestaurantReservationRequestView {
  return {
    id: row.id,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    guestPhone: row.guestPhone,
    partySize: row.partySize,
    requestedAt: row.requestedAt.toISOString(),
    message: row.message,
    status: row.status as RestaurantReservationRequestView['status'],
    handledBy: row.handledBy,
    handledAt: row.handledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapEvent(row: EventRow): RestaurantEventManagementView {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function fallbackSettings(name: string): PublicSiteSettingsView {
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

  async getPublicSiteSettings(organizationId: string): Promise<PublicSiteSettingsView | null> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, publicSiteSettings: true },
    });
    if (!org) return null;
    return org.publicSiteSettings ?? fallbackSettings(org.name);
  },

  async upsertPublicSiteSettings(
    organizationId: string,
    input: UpdatePublicSiteSettingsInput,
  ): Promise<PublicSiteSettingsView | null> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, publicSiteSettings: true },
    });
    if (!org) return null;

    const existing = org.publicSiteSettings ?? fallbackSettings(org.name);
    return prisma.publicSiteSettings.upsert({
      where: { organizationId },
      create: {
        organizationId,
        siteName: input.siteName ?? existing.siteName,
        heroTitle: input.heroTitle ?? existing.heroTitle,
        heroSubtitle: input.heroSubtitle ?? existing.heroSubtitle,
        about: input.about ?? existing.about,
        phone: input.phone ?? existing.phone,
        email: input.email ?? existing.email,
        addressLine1: input.addressLine1 ?? existing.addressLine1,
        addressLine2: input.addressLine2 ?? existing.addressLine2,
        postalCode: input.postalCode ?? existing.postalCode,
        city: input.city ?? existing.city,
        country: input.country ?? existing.country ?? 'SE',
        reservationEmail: input.reservationEmail ?? existing.reservationEmail,
        seoTitle: input.seoTitle ?? existing.seoTitle,
        seoDescription: input.seoDescription ?? existing.seoDescription,
      },
      update: {
        ...(input.siteName !== undefined ? { siteName: input.siteName } : {}),
        ...(input.heroTitle !== undefined ? { heroTitle: input.heroTitle } : {}),
        ...(input.heroSubtitle !== undefined ? { heroSubtitle: input.heroSubtitle } : {}),
        ...(input.about !== undefined ? { about: input.about } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.addressLine1 !== undefined ? { addressLine1: input.addressLine1 } : {}),
        ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2 } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.reservationEmail !== undefined ? { reservationEmail: input.reservationEmail } : {}),
        ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
        ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      },
      select: {
        siteName: true,
        heroTitle: true,
        heroSubtitle: true,
        about: true,
        phone: true,
        email: true,
        addressLine1: true,
        addressLine2: true,
        postalCode: true,
        city: true,
        country: true,
        reservationEmail: true,
        seoTitle: true,
        seoDescription: true,
      },
    });
  },

  async listEvents(organizationId: string): Promise<RestaurantEventManagementView[]> {
    const rows = await prisma.restaurantEvent.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return rows.map((row) => mapEvent(row as EventRow));
  },

  async createEvent(
    organizationId: string,
    actorId: string,
    input: CreateRestaurantEventInput,
  ): Promise<RestaurantEventManagementView> {
    const row = await prisma.restaurantEvent.create({
      data: {
        organizationId,
        title: input.title,
        description: input.description ?? null,
        startsAt: new Date(input.startsAt),
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        isPublished: input.isPublished ?? false,
        createdBy: actorId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return mapEvent(row as EventRow);
  },

  async updateEvent(
    organizationId: string,
    eventId: string,
    input: UpdateRestaurantEventInput,
  ): Promise<RestaurantEventManagementView | null> {
    const existing = await prisma.restaurantEvent.findFirst({
      where: { id: eventId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.restaurantEvent.update({
      where: { id: eventId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.startsAt !== undefined ? { startsAt: new Date(input.startsAt) } : {}),
        ...(input.endsAt !== undefined ? { endsAt: input.endsAt ? new Date(input.endsAt) : null } : {}),
        ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return mapEvent(row as EventRow);
  },

  async softDeleteEvent(organizationId: string, eventId: string): Promise<boolean> {
    const result = await prisma.restaurantEvent.updateMany({
      where: { id: eventId, organizationId, deletedAt: null },
      data: { deletedAt: new Date(), isPublished: false },
    });
    return result.count === 1;
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

  async updateCategory(
    organizationId: string,
    categoryId: string,
    input: UpdateMenuCategoryInput,
  ): Promise<RestaurantMenuCategoryView | null> {
    const existing = await prisma.restaurantMenuCategory.findFirst({
      where: { id: categoryId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.restaurantMenuCategory.update({
      where: { id: categoryId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
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
    return mapCategory(row as CategoryRow);
  },

  // Soft delete: the category is hidden and its items are tombstoned together so
  // neither the portal list nor the cached public site surfaces orphaned rows.
  async softDeleteCategory(organizationId: string, categoryId: string): Promise<boolean> {
    const result = await prisma.restaurantMenuCategory.updateMany({
      where: { id: categoryId, organizationId, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });
    if (result.count !== 1) return false;
    await prisma.restaurantMenuItem.updateMany({
      where: { categoryId, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return true;
  },

  async updateItem(
    organizationId: string,
    itemId: string,
    input: UpdateMenuItemInput,
  ): Promise<RestaurantMenuItemView | null> {
    const existing = await prisma.restaurantMenuItem.findFirst({
      where: { id: itemId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.restaurantMenuItem.update({
      where: { id: itemId },
      data: {
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.priceCents !== undefined ? { priceCents: input.priceCents } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.allergens !== undefined ? { allergens: input.allergens } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
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
    });
    return mapItem(row as CategoryRow['items'][number]);
  },

  async softDeleteItem(organizationId: string, itemId: string): Promise<boolean> {
    const result = await prisma.restaurantMenuItem.updateMany({
      where: { id: itemId, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count === 1;
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

  async listReservationRequests(
    organizationId: string,
    input: ListReservationRequestsInput,
  ): Promise<RestaurantReservationRequestView[]> {
    const rows = await prisma.restaurantReservationRequest.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(input.status ? { status: input.status } : {}),
        ...(input.from || input.to ? {
          requestedAt: {
            ...(input.from ? { gte: new Date(input.from) } : {}),
            ...(input.to ? { lte: new Date(input.to) } : {}),
          },
        } : {}),
      },
      orderBy: [{ requestedAt: 'asc' }, { createdAt: 'asc' }],
      take: 100,
      select: {
        id: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        partySize: true,
        requestedAt: true,
        message: true,
        status: true,
        handledBy: true,
        handledAt: true,
        createdAt: true,
      },
    });
    return rows.map((row) => mapReservation(row as ReservationRow));
  },

  async updateReservationRequest(
    organizationId: string,
    reservationId: string,
    actorId: string,
    input: UpdateReservationRequestInput,
  ): Promise<RestaurantReservationRequestView | null> {
    const existing = await prisma.restaurantReservationRequest.findFirst({
      where: { id: reservationId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.restaurantReservationRequest.update({
      where: { id: reservationId },
      data: {
        status: input.status,
        handledBy: actorId,
        handledAt: new Date(),
      },
      select: {
        id: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        partySize: true,
        requestedAt: true,
        message: true,
        status: true,
        handledBy: true,
        handledAt: true,
        createdAt: true,
      },
    });
    return mapReservation(row as ReservationRow);
  },
};
