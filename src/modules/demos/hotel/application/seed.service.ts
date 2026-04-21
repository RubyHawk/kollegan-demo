import bcrypt from 'bcryptjs';
import {
  DEMO_HOTEL_SEED_SALT_ROUNDS,
  DEMO_HOTEL_STAFF,
  type DemoHotelStaff,
  type SeededHotelStaffUser,
  type SeedHotelStaffResult,
} from '../domain/seed.entity';
import { seedHotelStaffUser } from '../infrastructure/seed.repository';

export class HotelSeedHashingError extends Error {
  constructor(cause: unknown) {
    super('Password hashing failed unexpectedly.');
    this.name = 'HotelSeedHashingError';
    this.cause = cause;
  }
}

export class HotelSeedRepositoryError extends Error {
  constructor(cause: unknown) {
    super('Failed to upsert staff users. Verify DATABASE_URL is set and the migration has been applied.');
    this.name = 'HotelSeedRepositoryError';
    this.cause = cause;
  }
}

export async function seedHotelStaffUsers(): Promise<SeedHotelStaffResult> {
  let staffWithHashes: Array<DemoHotelStaff & { passwordHash: string }>;

  try {
    staffWithHashes = await Promise.all(
      DEMO_HOTEL_STAFF.map(async (staff) => ({
        ...staff,
        passwordHash: await bcrypt.hash(staff.password, DEMO_HOTEL_SEED_SALT_ROUNDS),
      }))
    );
  } catch (error) {
    throw new HotelSeedHashingError(error);
  }

  let results: SeededHotelStaffUser[];
  try {
    results = await Promise.all(
      staffWithHashes.map((staff) => seedHotelStaffUser(staff, staff.passwordHash))
    );
  } catch (error) {
    throw new HotelSeedRepositoryError(error);
  }

  const created = results.filter((user) => user.status === 'created').length;
  const updated = results.filter((user) => user.status === 'updated').length;

  return {
    summary: { created, updated, total: results.length },
    users: results.map(({ id, email, role, createdAt, status }) => ({
      id,
      email,
      role,
      createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
      status,
    })),
    credentials: DEMO_HOTEL_STAFF.map(({ email, password, role }) => ({ email, password, role })),
  };
}
