export interface PublicSiteSettingsView {
  siteName: string;
  heroTitle: string;
  heroSubtitle: string | null;
  about: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  reservationEmail: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface RestaurantMenuItemView {
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
}

export interface RestaurantMenuCategoryView {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  items: RestaurantMenuItemView[];
}

export interface RestaurantOpeningHourView {
  id: string;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
  label: string | null;
}

export interface RestaurantEventView {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
}

export interface PublicRestaurantSite {
  organizationId: string;
  organizationName: string;
  settings: PublicSiteSettingsView;
  categories: RestaurantMenuCategoryView[];
  openingHours: RestaurantOpeningHourView[];
  events: RestaurantEventView[];
}

export interface CreateMenuCategoryInput {
  name: string;
  description?: string | null;
  sortOrder?: number;
}

export interface CreateMenuItemInput {
  categoryId: string;
  name: string;
  description?: string | null;
  priceCents?: number | null;
  currency?: string;
  imageUrl?: string | null;
  allergens?: string[];
  tags?: string[];
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface UpsertOpeningHourInput {
  dayOfWeek: number;
  opensAt?: string | null;
  closesAt?: string | null;
  isClosed?: boolean;
  label?: string | null;
}

export interface CreateReservationRequestInput {
  guestName: string;
  guestEmail?: string | null;
  guestPhone?: string | null;
  partySize: number;
  requestedAt: string;
  message?: string | null;
}
