export interface OpeningHours {
  default?: string;
  weekdays?: string;
  weekends?: string;
}

export interface MenuHighlight {
  name: string;
  price: number;
}

export type RestaurantService = 'frukost' | 'lunch' | 'middag' | 'bar' | 'rumsservice';

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisineType: string;
  openingHours: OpeningHours;
  services: RestaurantService[];
  menuHighlights: MenuHighlight[];
  isActive: boolean;
}

export type ActivityCategory = 'wellness' | 'fitness' | 'transport' | 'konferens' | 'kultur' | 'övrigt';

export interface HotelActivity {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  openingHours: OpeningHours;
  price: string;
  bookingRequired: boolean;
  isActive: boolean;
}

export type AmenityType = 'kiosk' | 'parkering' | 'service' | 'övrigt';

export interface Amenity {
  id: string;
  name: string;
  type: AmenityType;
  description: string;
  openingHours: OpeningHours;
  pricing: string;
  isActive: boolean;
}
