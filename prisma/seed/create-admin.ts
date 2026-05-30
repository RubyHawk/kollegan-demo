/**
 * One-time script: creates the malek@soleria.se admin account.
 *
 * Run on the VPS:
 *   npx tsx prisma/seed/create-admin.ts
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import bcrypt from 'bcryptjs';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const EMAIL    = 'malek@soleria.se';
const PASSWORD = 'malek123';
const ORG_NAME = 'Soleria';
const ORG_SLUG = 'soleria';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma  = new PrismaClient({ adapter });

  // 1. Upsert organisation
  let org = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: ORG_NAME, slug: ORG_SLUG, plan: 'starter' },
    });
    console.log('Created organisation:', org.id);
  } else {
    console.log('Using existing organisation:', org.id);
  }

  // 2. Check user doesn't already exist
  const existing = await prisma.user.findFirst({ where: { email: EMAIL, deletedAt: null } });
  if (existing) {
    console.log('User already exists:', existing.id);
    await prisma.$disconnect();
    return;
  }

  // 3. Create user
  const passwordHash      = await bcrypt.hash(PASSWORD, 12);
  const mfaGraceExpiresAt = new Date();
  mfaGraceExpiresAt.setFullYear(mfaGraceExpiresAt.getFullYear() + 2);
  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash,
      userType: 'staff',
      organizationId: org.id,
      mfaGraceExpiresAt,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log('Created user:', user.id, user.email);

  // 4. Assign admin role
  const adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
  if (adminRole) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: adminRole.id, organizationId: org.id, grantedBy: user.id },
    });
    console.log('Assigned admin role');
  } else {
    console.warn('No admin role found in DB — run prisma db seed first.');
  }

  await prisma.$disconnect();
  console.log('Done. Login with:', EMAIL, '/', PASSWORD);
}

main().catch((e) => { console.error(e); process.exit(1); });
