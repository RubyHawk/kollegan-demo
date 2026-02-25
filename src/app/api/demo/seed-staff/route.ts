import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // required: bcrypt uses Node.js crypto

// ─── Constants ────────────────────────────────────────────────────────────────

const TAG         = 'Demo:SeedStaff';
const SALT_ROUNDS = 12; // OWASP-recommended minimum for bcrypt
const ENDPOINT    = '/api/demo/seed-staff';

// One user per role so every access level is immediately testable.
const DEMO_STAFF = [
  { email: 'receptionist@demo-hotel.com', password: 'demo1234', role: 'receptionist' },
  { email: 'manager@demo-hotel.com',      password: 'demo1234', role: 'manager'      },
  { email: 'admin@demo-hotel.com',        password: 'demo1234', role: 'admin'        },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type DemoStaff = (typeof DEMO_STAFF)[number];

type SeededUser = {
  id:        string;
  email:     string;
  role:      string;
  createdAt: Date;
  status:    'created' | 'updated';
};

// ─── RFC 7807 Problem Details helper ─────────────────────────────────────────
// https://www.rfc-editor.org/rfc/rfc7807

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `${ENDPOINT}/errors/${title.toLowerCase().replace(/\s+/g, '-')}`, title, status, detail, instance: ENDPOINT },
    { status, headers: { 'Content-Type': 'application/problem+json' } }
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedOne(staff: DemoStaff, passwordHash: string): Promise<SeededUser> {
  // Check existence first to return an accurate 'created' vs 'updated' status.
  const existing = await prisma.staffUser.findUnique({
    where:  { email: staff.email },
    select: { id: true },
  });

  const user = await prisma.staffUser.upsert({
    where:  { email: staff.email },
    update: { passwordHash, role: staff.role },
    create: { email: staff.email, passwordHash, role: staff.role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return { ...user, status: existing ? 'updated' : 'created' };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

/**
 * POST /api/demo/seed-staff
 *
 * Idempotent — safe to call multiple times.
 * Creates (or resets) one demo staff user per role for local DB testing.
 *
 * Success  → 201 Created  (first seed)  |  200 OK (idempotent re-run)
 * Errors   → RFC 7807 Problem Details (application/problem+json)
 */
export async function POST(req: NextRequest) {
  // Rate-limit: max 5 calls per minute per IP
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rl = await checkRateLimit(`seed-staff:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    logger.warn(TAG, 'Rate limit exceeded', { ip });
    return problem(429, 'Too Many Requests', 'Maximum 5 seed requests per minute per IP address.');
  }

  logger.info(TAG, 'Seeding demo staff users', { ip, count: DEMO_STAFF.length });

  // Hash all passwords in parallel BEFORE any DB work so we never hold
  // a connection open during CPU-bound bcrypt computation.
  let staffWithHashes: Array<DemoStaff & { passwordHash: string }>;
  try {
    staffWithHashes = await Promise.all(
      DEMO_STAFF.map(async (staff) => ({
        ...staff,
        passwordHash: await bcrypt.hash(staff.password, SALT_ROUNDS),
      }))
    );
  } catch (err) {
    logger.error(TAG, 'Password hashing failed', err);
    return problem(500, 'Internal Server Error', 'Password hashing failed unexpectedly.');
  }

  let results: SeededUser[];
  try {
    results = await Promise.all(
      staffWithHashes.map((staff) => seedOne(staff, staff.passwordHash))
    );
  } catch (err) {
    logger.error(TAG, 'Database operation failed', err);
    return problem(
      500,
      'Database Error',
      'Failed to upsert staff users. Verify DATABASE_URL is set and the migration has been applied.'
    );
  }

  const created = results.filter((u) => u.status === 'created').length;
  const updated = results.filter((u) => u.status === 'updated').length;
  const timestamp = new Date().toISOString();

  logger.info(TAG, 'Seed complete', { created, updated });

  return NextResponse.json(
    {
      data: {
        summary:     { created, updated, total: results.length },
        users:       results.map(({ id, email, role, createdAt, status }) => ({
          id,
          email,
          role,
          createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
          status,
        })),
        // Plaintext credentials — intentional in this demo-seed context only.
        credentials: DEMO_STAFF.map(({ email, password, role }) => ({ email, password, role })),
      },
      meta: {
        timestamp,
        operation: 'seed_staff_users',
      },
    },
    { status: created > 0 ? 201 : 200 }
  );
}
