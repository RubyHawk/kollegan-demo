export const DEMO_HOTEL_SEED_ENDPOINT = '/api/demos/hotel/seed';
export const DEMO_HOTEL_SEED_TAG = 'Demo:SeedStaff';
export const DEMO_HOTEL_SEED_SALT_ROUNDS = 12;

export const DEMO_HOTEL_STAFF = [
  { email: 'receptionist@demo-hotel.com', password: 'demo1234', role: 'receptionist' },
  { email: 'manager@demo-hotel.com', password: 'demo1234', role: 'manager' },
  { email: 'admin@demo-hotel.com', password: 'demo1234', role: 'admin' },
] as const;

export type DemoHotelStaff = (typeof DEMO_HOTEL_STAFF)[number];

export type SeededHotelStaffUser = {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  status: 'created' | 'updated';
};

export type SeedHotelStaffResult = {
  summary: {
    created: number;
    updated: number;
    total: number;
  };
  users: Array<{
    id: string;
    email: string;
    role: string;
    createdAt: string | Date;
    status: 'created' | 'updated';
  }>;
  credentials: Array<{
    email: string;
    password: string;
    role: string;
  }>;
};
