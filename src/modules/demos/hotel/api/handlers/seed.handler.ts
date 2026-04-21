import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@platform/cache/rate-limiter';
import { logger } from '@platform/logging/logger';
import {
  DEMO_HOTEL_SEED_ENDPOINT,
  DEMO_HOTEL_SEED_TAG,
  DEMO_HOTEL_STAFF,
} from '../../domain/seed.entity';
import {
  HotelSeedHashingError,
  HotelSeedRepositoryError,
  seedHotelStaffUsers,
} from '../../application/seed.service';

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    {
      type: `${DEMO_HOTEL_SEED_ENDPOINT}/errors/${title.toLowerCase().replace(/\s+/g, '-')}`,
      title,
      status,
      detail,
      instance: DEMO_HOTEL_SEED_ENDPOINT,
    },
    { status, headers: { 'Content-Type': 'application/problem+json' } }
  );
}

/**
 * POST /api/demos/hotel/seed
 *
 * Idempotent. Creates or resets one demo staff user per role for local DB testing.
 */
export async function handleSeedHotelDemo(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rl = await checkRateLimit(`seed-staff:${ip}`, 5, 60_000);

  if (!rl.allowed) {
    logger.warn(DEMO_HOTEL_SEED_TAG, 'Rate limit exceeded', { ip });
    return problem(429, 'Too Many Requests', 'Maximum 5 seed requests per minute per IP address.');
  }

  logger.info(DEMO_HOTEL_SEED_TAG, 'Seeding demo staff users', {
    ip,
    count: DEMO_HOTEL_STAFF.length,
  });

  try {
    const data = await seedHotelStaffUsers();
    const timestamp = new Date().toISOString();

    logger.info(DEMO_HOTEL_SEED_TAG, 'Seed complete', {
      created: data.summary.created,
      updated: data.summary.updated,
    });

    return NextResponse.json(
      {
        data,
        meta: {
          timestamp,
          operation: 'seed_staff_users',
        },
      },
      { status: data.summary.created > 0 ? 201 : 200 }
    );
  } catch (error) {
    if (error instanceof HotelSeedHashingError) {
      logger.error(DEMO_HOTEL_SEED_TAG, 'Password hashing failed', error.cause);
      return problem(500, 'Internal Server Error', error.message);
    }

    if (error instanceof HotelSeedRepositoryError) {
      logger.error(DEMO_HOTEL_SEED_TAG, 'Database operation failed', error.cause);
      return problem(500, 'Database Error', error.message);
    }

    logger.error(DEMO_HOTEL_SEED_TAG, 'Unexpected seed failure', error);
    return problem(500, 'Internal Server Error', 'Unexpected seed failure.');
  }
}
