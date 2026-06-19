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
  ingredientId: string | null;
  emoji: string | null;
  name: string;
  quantity: string | null;
  unit: string | null;
  note: string | null;
}

export interface MenuItemIngredientInput {
  ingredientId?: string | null;
  emoji?: string | null;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  note?: string | null;
}

export interface MenuItemVariant {
  id: string | null;
  name: string;
  priceCents: number;
  isDefault: boolean;
  isAvailable: boolean;
  sortOrder: number;
}

export interface MenuItemVariantInput {
  id?: string | null;
  name: string;
  priceCents: number;
  isDefault?: boolean;
  isAvailable?: boolean;
  sortOrder?: number;
}

function priceTagId(label: string): string {
  const slug = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `price-tag-${slug || 'variant'}`;
}

function priceTagAmount(value: string): number | null {
  const amount = Number(value.replace(/:-$/, '').replace(',', '.'));
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

export function deriveMenuVariantsFromPriceTags(tags: readonly string[]): MenuItemVariant[] {
  const variants: MenuItemVariant[] = [];

  for (const tag of tags) {
    const match = tag.trim().match(/^(.+?)\s+(\d+(?:[,.]\d{1,2})?)(?::[-–]?)?$/);
    const name = match?.[1]?.trim();
    const priceCents = match?.[2] ? priceTagAmount(match[2]) : null;
    if (!name || priceCents === null) continue;

    variants.push({
      id: priceTagId(name),
      name,
      priceCents,
      isDefault: variants.length === 0,
      isAvailable: true,
      sortOrder: variants.length,
    });
  }

  return variants;
}

export interface MenuItemModifierOption {
  id: string | null;
  name: string;
  priceDeltaCents: number;
  isAvailable: boolean;
  sortOrder: number;
}

export interface MenuItemModifierOptionInput {
  id?: string | null;
  name: string;
  priceDeltaCents?: number;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface MenuItemModifierGroup {
  id: string | null;
  name: string;
  minSelected: number;
  maxSelected: number;
  required: boolean;
  sortOrder: number;
  options: MenuItemModifierOption[];
}

export interface MenuItemModifierGroupInput {
  id?: string | null;
  name: string;
  minSelected?: number;
  maxSelected?: number;
  required?: boolean;
  sortOrder?: number;
  options?: MenuItemModifierOptionInput[];
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
  variants?: MenuItemVariant[];
  modifierGroups?: MenuItemModifierGroup[];
  kitchenStation?: string | null;
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
  variants?: MenuItemVariantInput[];
  modifierGroups?: MenuItemModifierGroupInput[];
  kitchenStation?: string | null;
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
  variants?: MenuItemVariantInput[];
  modifierGroups?: MenuItemModifierGroupInput[];
  kitchenStation?: string | null;
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
