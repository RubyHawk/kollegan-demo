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

export interface MenuItemIngredient {
  emoji: string | null;
  name: string;
  quantity: string | null;
  unit: string | null;
  note: string | null;
}

export interface MenuItemIngredientInput {
  emoji?: string | null;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  note?: string | null;
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
  ingredients: MenuItemIngredient[];
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

export interface RestaurantEventManagementView extends RestaurantEventView {
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RestaurantReservationStatus = 'new' | 'confirmed' | 'declined' | 'cancelled';

export interface RestaurantReservationRequestView {
  id: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  partySize: number;
  requestedAt: string;
  message: string | null;
  status: RestaurantReservationStatus;
  handledBy: string | null;
  handledAt: string | null;
  createdAt: string;
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
  ingredients?: MenuItemIngredientInput[];
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface UpdateMenuCategoryInput {
  name?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateMenuItemInput {
  categoryId?: string;
  name?: string;
  description?: string | null;
  priceCents?: number | null;
  currency?: string;
  imageUrl?: string | null;
  allergens?: string[];
  tags?: string[];
  ingredients?: MenuItemIngredientInput[];
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

export interface ListReservationRequestsInput {
  status?: RestaurantReservationStatus;
  from?: string;
  to?: string;
}

export interface UpdateReservationRequestInput {
  status: RestaurantReservationStatus;
}

export interface UpdatePublicSiteSettingsInput {
  siteName?: string;
  heroTitle?: string;
  heroSubtitle?: string | null;
  about?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  reservationEmail?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface CreateRestaurantEventInput {
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  isPublished?: boolean;
}

export interface UpdateRestaurantEventInput {
  title?: string;
  description?: string | null;
  startsAt?: string;
  endsAt?: string | null;
  isPublished?: boolean;
}
