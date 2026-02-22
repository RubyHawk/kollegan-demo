import fs from 'fs';
import path from 'path';
import type { Restaurant, HotelActivity, Amenity } from '@features/hotel-services/types';

const DATA_PATH = path.join(process.cwd(), 'data', 'hotel-services.json');

interface HotelServicesStore {
  restaurants: Restaurant[];
  activities: HotelActivity[];
  amenities: Amenity[];
}

declare global {
  // eslint-disable-next-line no-var
  var __hotelServicesStore: HotelServicesStore | undefined;
}

/* ───── Initial (demo) data ───── */

const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: 'restaurang-kronan',
    name: 'Restaurang Kronan',
    description: 'Skandinavisk fine dining med säsongsbetonade råvaror och smakfulla kreationer av vår köksmästare.',
    cuisineType: 'Skandinavisk fine dining',
    openingHours: { default: 'Mån–Fre 18–22, Lör–Sön 11–14 & 18–22' },
    services: ['middag'],
    menuHighlights: [
      { name: '3-rätters signaturgsmeny', price: 695 },
      { name: 'Vegetarisk meny', price: 595 },
      { name: 'Vinpaket (3 glas)', price: 395 },
    ],
    isActive: true,
  },
  {
    id: 'baren-bistron',
    name: 'Baren & Bistron',
    description: 'Avslappnad bar och bistro med klassiska cocktails, hantverksöl och lätta rätter i en varm atmosfär.',
    cuisineType: 'Bar & bistro',
    openingHours: { default: 'Mån–Sön 12–24' },
    services: ['lunch', 'middag', 'bar'],
    menuHighlights: [
      { name: 'Signaturcocktail "Kronan"', price: 165 },
      { name: 'Dagens rätt (lunch)', price: 185 },
      { name: 'Charkuteriboard', price: 225 },
    ],
    isActive: true,
  },
  {
    id: 'rumsservice',
    name: 'Rumsservice',
    description: 'Beställ mat och dryck direkt till ditt rum — tillgängligt nästan dygnet runt för din bekvämlighet.',
    cuisineType: 'Rumsservice',
    openingHours: { default: 'Dagligen 06–23' },
    services: ['frukost', 'lunch', 'middag', 'rumsservice'],
    menuHighlights: [
      { name: 'Frukostbricka', price: 175 },
      { name: 'Club sandwich', price: 195 },
      { name: 'Flaska vin', price: 395 },
    ],
    isActive: true,
  },
];

const INITIAL_ACTIVITIES: HotelActivity[] = [
  {
    id: 'spa-wellness',
    name: 'Spa & Wellness',
    description: 'Lyxigt spa med pool, bastu, ångbad och ett brett utbud av behandlingar för kropp och själ.',
    category: 'wellness',
    openingHours: { default: 'Dagligen 07–21' },
    price: 'Ingår för svitrumsgäster · Övriga från 195 kr/dag',
    bookingRequired: false,
    isActive: true,
  },
  {
    id: 'gym-fitness',
    name: 'Gym & Fitness',
    description: 'Modernt välutrustat gym med fri vikter, cardiomaskineri och träningsrum. Öppet dygnet runt.',
    category: 'fitness',
    openingHours: { default: 'Dygnet runt' },
    price: 'Kostnadsfritt för hotelgäster',
    bookingRequired: false,
    isActive: true,
  },
  {
    id: 'cykeluthyrning',
    name: 'Cykeluthyrning',
    description: 'Utforska Stockholm på en av våra elcyklar eller standardcyklar. Kartor och rekommenderade rutter ingår.',
    category: 'transport',
    openingHours: { default: 'Dagligen 08–18' },
    price: 'Elcykel 250 kr/dag · Standardcykel 150 kr/dag',
    bookingRequired: false,
    isActive: true,
  },
  {
    id: 'konferensrum',
    name: 'Konferensrum & Möteslokaler',
    description: 'Tre fullt utrustade konferensrum för allt från interna möten till större konferenser. Catering tillgängligt.',
    category: 'konferens',
    openingHours: { default: 'Mån–Fre 07–22, Lör–Sön 08–20' },
    price: 'Litet rum från 1 500 kr/halvdag · Stort rum från 3 500 kr/halvdag',
    bookingRequired: true,
    isActive: true,
  },
  {
    id: 'guided-stadstur',
    name: 'Guided Stadstur',
    description: 'Upplev Stockholms historia och kultur med vår kunniga guide. Turen tar ca 2 timmar och startar i hotellets lobby.',
    category: 'kultur',
    openingHours: { default: 'Dagligen avgångar 10:00 & 14:00' },
    price: '295 kr/person · Barn under 12 år gratis',
    bookingRequired: true,
    isActive: true,
  },
];

const INITIAL_AMENITIES: Amenity[] = [
  {
    id: 'hotelbutiken',
    name: 'Hotelbutiken',
    type: 'kiosk',
    description: 'Välsorterad hotelbutik med snacks, drycker, tidningar, souvenirer och toalettartiklar.',
    openingHours: { default: 'Dagligen 07–22' },
    pricing: 'Löpande priser',
    isActive: true,
  },
  {
    id: 'parkering',
    name: 'Hotellets Parkering',
    type: 'parkering',
    description: 'Säker underjordisk parkering direkt under hotellet. Direkttillgång via hiss till alla hotellets våningar.',
    openingHours: { default: 'Dygnet runt' },
    pricing: '350 kr/dygn · Föranmälan rekommenderas',
    isActive: true,
  },
  {
    id: 'valet-parkering',
    name: 'Valet Parkering',
    type: 'service',
    description: 'Lämna bilen direkt vid hotellets entré och låt oss ta hand om resten. Bilen hämtas på önskad tid.',
    openingHours: { default: 'Dagligen 07–23' },
    pricing: '500 kr/dygn',
    isActive: true,
  },
  {
    id: 'bagageförvaring',
    name: 'Bagageförvaring',
    type: 'service',
    description: 'Förvara ditt bagage säkert hos oss — perfekt för tidig ankomst eller sen avresa.',
    openingHours: { default: 'Dygnet runt, reception bemannad 06–23' },
    pricing: 'Kostnadsfritt för hotelgäster',
    isActive: true,
  },
];

/* ───── Store management ───── */

function loadFromDisk(): HotelServicesStore {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    console.warn('[HotelServicesStore] Failed to load from disk, using defaults');
  }
  return {
    restaurants: INITIAL_RESTAURANTS.map((r) => ({ ...r })),
    activities: INITIAL_ACTIVITIES.map((a) => ({ ...a })),
    amenities: INITIAL_AMENITIES.map((a) => ({ ...a })),
  };
}

function getStore(): HotelServicesStore {
  if (!global.__hotelServicesStore) {
    global.__hotelServicesStore = loadFromDisk();
  }
  return global.__hotelServicesStore;
}

function saveToDisk(store: HotelServicesStore): void {
  try {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('[HotelServicesStore] Failed to save to disk:', e);
  }
}

/* ───── Restaurants ───── */

export function getAllRestaurants(): Restaurant[] {
  return getStore().restaurants;
}

export function getRestaurantById(id: string): Restaurant | undefined {
  return getStore().restaurants.find((r) => r.id === id);
}

export function createRestaurant(data: Omit<Restaurant, 'id'>): Restaurant {
  const store = getStore();
  const restaurant: Restaurant = { id: crypto.randomUUID(), ...data };
  store.restaurants.push(restaurant);
  saveToDisk(store);
  return restaurant;
}

export function updateRestaurant(id: string, data: Partial<Omit<Restaurant, 'id'>>): Restaurant | null {
  const store = getStore();
  const idx = store.restaurants.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.restaurants[idx] = { ...store.restaurants[idx], ...data };
  saveToDisk(store);
  return store.restaurants[idx];
}

export function deleteRestaurant(id: string): boolean {
  const store = getStore();
  const before = store.restaurants.length;
  store.restaurants = store.restaurants.filter((r) => r.id !== id);
  if (store.restaurants.length === before) return false;
  saveToDisk(store);
  return true;
}

/* ───── Activities ───── */

export function getAllActivities(): HotelActivity[] {
  return getStore().activities;
}

export function getActivityById(id: string): HotelActivity | undefined {
  return getStore().activities.find((a) => a.id === id);
}

export function createActivity(data: Omit<HotelActivity, 'id'>): HotelActivity {
  const store = getStore();
  const activity: HotelActivity = { id: crypto.randomUUID(), ...data };
  store.activities.push(activity);
  saveToDisk(store);
  return activity;
}

export function updateActivity(id: string, data: Partial<Omit<HotelActivity, 'id'>>): HotelActivity | null {
  const store = getStore();
  const idx = store.activities.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.activities[idx] = { ...store.activities[idx], ...data };
  saveToDisk(store);
  return store.activities[idx];
}

export function deleteActivity(id: string): boolean {
  const store = getStore();
  const before = store.activities.length;
  store.activities = store.activities.filter((a) => a.id !== id);
  if (store.activities.length === before) return false;
  saveToDisk(store);
  return true;
}

/* ───── Amenities ───── */

export function getAllAmenities(): Amenity[] {
  return getStore().amenities;
}

export function getAmenityById(id: string): Amenity | undefined {
  return getStore().amenities.find((a) => a.id === id);
}

export function createAmenity(data: Omit<Amenity, 'id'>): Amenity {
  const store = getStore();
  const amenity: Amenity = { id: crypto.randomUUID(), ...data };
  store.amenities.push(amenity);
  saveToDisk(store);
  return amenity;
}

export function updateAmenity(id: string, data: Partial<Omit<Amenity, 'id'>>): Amenity | null {
  const store = getStore();
  const idx = store.amenities.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.amenities[idx] = { ...store.amenities[idx], ...data };
  saveToDisk(store);
  return store.amenities[idx];
}

export function deleteAmenity(id: string): boolean {
  const store = getStore();
  const before = store.amenities.length;
  store.amenities = store.amenities.filter((a) => a.id !== id);
  if (store.amenities.length === before) return false;
  saveToDisk(store);
  return true;
}

/* ───── Combined snapshot (for Kollegan) ───── */

export function getAllHotelServices(): HotelServicesStore {
  const store = getStore();
  return {
    restaurants: [...store.restaurants],
    activities: [...store.activities],
    amenities: [...store.amenities],
  };
}
