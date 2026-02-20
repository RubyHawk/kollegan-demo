/* ──────────────────────────────────────────────────────────────
   roomMeta.ts — Static room metadata (client-safe, no server imports)
   ────────────────────────────────────────────────────────────── */

export interface AmenityDef {
  key: 'wifi' | 'tv' | 'minibar' | 'safe' | 'bathtub' | 'workspace';
  label: string;
}

export interface RoomMeta {
  price: number;
  size: number;
  view: string;
  bedType: string;
  description: string;
  fullDescription: string;
  amenities: AmenityDef[];
}

const AMENITIES: Record<AmenityDef['key'], AmenityDef> = {
  wifi:      { key: 'wifi',      label: 'Gratis WiFi' },
  tv:        { key: 'tv',        label: 'Smart TV' },
  minibar:   { key: 'minibar',   label: 'Minibar' },
  safe:      { key: 'safe',      label: 'Kassaskåp' },
  bathtub:   { key: 'bathtub',   label: 'Badkar' },
  workspace: { key: 'workspace', label: 'Skrivbord' },
};

const W = AMENITIES;

/* Per-room metadata (keyed by room ID) */
const ROOM_META: Record<string, RoomMeta> = {
  '101': {
    price: 1495, size: 22, view: 'Trädgårdsvy', bedType: 'Enkelsäng',
    description: 'Ljust och stilrent enkeltrum',
    fullDescription: 'Ett ljust och stilrent rum med utsikt mot hotellets välskötta trädgård. Perfekt för den ensamma resenären som söker komfort och ro.',
    amenities: [W.wifi, W.tv, W.safe],
  },
  '102': {
    price: 1495, size: 22, view: 'Gatuvy', bedType: 'Enkelsäng',
    description: 'Ljust och stilrent enkeltrum',
    fullDescription: 'Ett ombonat enkeltrum med gatuvyer över det pulserande Stockholm. Stilrent inrett med fokus på komfort.',
    amenities: [W.wifi, W.tv, W.safe],
  },
  '103': {
    price: 2495, size: 32, view: 'Stadsvy', bedType: 'Dubbelsäng',
    description: 'Rymligt dubbelrum med stadsvy',
    fullDescription: 'Ett rymligt dubbelrum med en imponerande utsikt över Stockholms silhuett. Perfekt för par eller den resenär som vill ha lite extra utrymme.',
    amenities: [W.wifi, W.tv, W.minibar, W.safe],
  },
  '104': {
    price: 2495, size: 32, view: 'Trädgårdsvy', bedType: 'Dubbelsäng',
    description: 'Rymligt dubbelrum med trädgårdsvy',
    fullDescription: 'Ett lugnt och rymligt dubbelrum med utsikt mot den grönskande trädgården. En oas av ro mitt i staden.',
    amenities: [W.wifi, W.tv, W.minibar, W.safe],
  },
  '201': {
    price: 1495, size: 22, view: 'Trädgårdsvy', bedType: 'Enkelsäng',
    description: 'Ljust enkeltrum på plan 2',
    fullDescription: 'Välutrustat enkeltrum med utsikt mot trädgården. Beläget på plan 2 med lättillgänglighet till alla hotellets faciliteter.',
    amenities: [W.wifi, W.tv, W.safe],
  },
  '202': {
    price: 1495, size: 22, view: 'Gatuvy', bedType: 'Enkelsäng',
    description: 'Enkeltrum med stadsvibbar',
    fullDescription: 'Ett modernt enkeltrum med utsikt mot stadens liv och rörelse. Stilrent inrett för den moderna resenären.',
    amenities: [W.wifi, W.tv, W.safe],
  },
  '203': {
    price: 2495, size: 32, view: 'Stadsvy', bedType: 'Dubbelsäng',
    description: 'Dubbelrum med panoramautsikt',
    fullDescription: 'Njut av en fantastisk utsikt över Stockholm från detta stilfulla dubbelrum. Högt beläget för maximalt ljusinsläpp.',
    amenities: [W.wifi, W.tv, W.minibar, W.safe],
  },
  '204': {
    price: 2495, size: 32, view: 'Trädgårdsvy', bedType: 'Dubbelsäng',
    description: 'Lugnt dubbelrum, plan 2',
    fullDescription: 'Ett tyst och ombonat dubbelrum med utsikt mot den lugna trädgården. Perfekt för ett avkopplande storstadsbesök.',
    amenities: [W.wifi, W.tv, W.minibar, W.safe],
  },
  '205': {
    price: 3995, size: 55, view: 'Panoramavy', bedType: 'Kingsize-säng',
    description: 'Exklusiv svit med panoramautsikt',
    fullDescription: 'Vår magnifika plan 2-svit med en svindlande panoramautsikt över Stockholm. Separat vardagsrum, lyxigt badrum med badkar och personlig service.',
    amenities: [W.wifi, W.tv, W.minibar, W.safe, W.bathtub, W.workspace],
  },
  '301': {
    price: 2495, size: 35, view: 'Stadsvy', bedType: 'Dubbelsäng',
    description: 'Dubbelrum i toppläge, plan 3',
    fullDescription: 'Högt beläget dubbelrum med fantastisk utsikt. Det bästa av dubbelrum — rymligt, ljust och med en av hotellets finaste vyer.',
    amenities: [W.wifi, W.tv, W.minibar, W.safe],
  },
  '302': {
    price: 3995, size: 55, view: 'Toppvåningsvy', bedType: 'Kingsize-säng',
    description: 'Exklusiv toppvåningssvit',
    fullDescription: 'En exklusiv svit på hotellets toppvåning. Kingsize-säng, lyxigt badrum med fristående badkar och en oöverträffad utsikt över hela Stockholm.',
    amenities: [W.wifi, W.tv, W.minibar, W.safe, W.bathtub, W.workspace],
  },
  '303': {
    price: 3995, size: 60, view: 'Panoramavy 360°', bedType: 'Kingsize-säng',
    description: 'Premiumsvit med 360° panorama',
    fullDescription: 'Hotellets mest exklusiva svit med en enastående 360-graders utsikt. Stilfullt inredda rum, privat terrass och alla bekvämligheter du kan önska dig.',
    amenities: [W.wifi, W.tv, W.minibar, W.safe, W.bathtub, W.workspace],
  },
};

/* Type-level fallback (used when room ID is not in the map) */
const ROOM_TYPE_META: Record<string, Omit<RoomMeta, 'view'>> = {
  Enkel: {
    price: 1495, size: 22, bedType: 'Enkelsäng',
    description: 'Ljust och stilrent enkeltrum',
    fullDescription: 'Ett välutrustat enkeltrum med modern design och alla nödvändiga bekvämligheter.',
    amenities: [W.wifi, W.tv, W.safe],
  },
  Dubbel: {
    price: 2495, size: 32, bedType: 'Dubbelsäng',
    description: 'Rymligt dubbelrum',
    fullDescription: 'Ett rymligt och välutrustat dubbelrum med bekväm kingsize-säng och modern design.',
    amenities: [W.wifi, W.tv, W.minibar, W.safe],
  },
  Svit: {
    price: 3995, size: 55, bedType: 'Kingsize-säng',
    description: 'Exklusiv svit',
    fullDescription: 'En exklusiv svit med separat vardagsrum, lyxigt badrum och premium-bekvämligheter.',
    amenities: [W.wifi, W.tv, W.minibar, W.safe, W.bathtub, W.workspace],
  },
};

export function getRoomMeta(roomId: string, roomType: string): RoomMeta {
  if (ROOM_META[roomId]) return ROOM_META[roomId];
  const typeMeta = ROOM_TYPE_META[roomType];
  if (typeMeta) return { ...typeMeta, view: 'Stadsvy' };
  return {
    price: 1495, size: 22, view: 'Stadsvy', bedType: 'Enkelsäng',
    description: 'Hotelrum', fullDescription: 'Komfortabelt hotelrum.',
    amenities: [W.wifi, W.tv],
  };
}

/* SVG icon path data for amenity icons */
export const AMENITY_ICONS: Record<AmenityDef['key'], string> = {
  wifi: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
  tv: 'M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z',
  minibar: 'M8 2h8M9 2v2.5M15 2v2.5M6 4.5h12a1 1 0 0 1 1 1V18a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5.5a1 1 0 0 1 1-1z',
  safe: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  bathtub: 'M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1zM6 12V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v0M18 20v2M6 20v2',
  workspace: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
};
