/**
 * VPS-level script: assigns the super_admin role to Fadi and Malek.
 *
 * This is an infrastructure-level operation — NOT an app feature.
 * Never expose super_admin assignment through the app API or UI.
 *
 * Run on the VPS via SSH:
 *   npx tsx prisma/seed/assign-super-admins.ts
 *
 * Safe to re-run: all operations are idempotent.
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const SUPER_ADMINS = ['fadi@soleria.se', 'malek@soleria.se'];
const SUPER_ADMIN_ROLE = 'super_admin';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Ensure super_admin role exists
    let role = await prisma.role.findUnique({ where: { name: SUPER_ADMIN_ROLE } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: SUPER_ADMIN_ROLE,
          displayName: 'Super Admin',
          description: 'System-level administrator — VPS assignment only, never through the app UI.',
          isSystem: true,
        },
      });
      console.log('Created super_admin role:', role.id);
    } else {
      console.log('super_admin role exists:', role.id);
    }

    // 2. Assign super_admin to each user
    for (const email of SUPER_ADMINS) {
      const user = await prisma.user.findFirst({
        where: { email, deletedAt: null },
        select: { id: true, email: true, organizationId: true },
      });

      if (!user) {
        console.error(`ERROR: User not found: ${email} — skipping. Check the email address.`);
        continue;
      }

      if (!user.organizationId) {
        console.error(`ERROR: ${email} has no organizationId — cannot assign role. Fix their org first.`);
        continue;
      }

      // Upsert: create if not exists, do nothing if already assigned
      await prisma.userRole.upsert({
        where: {
          userId_roleId_organizationId: {
            userId: user.id,
            roleId: role.id,
            organizationId: user.organizationId,
          },
        },
        update: {}, // no-op if already exists
        create: {
          userId: user.id,
          roleId: role.id,
          organizationId: user.organizationId,
          grantedBy: user.id,
        },
      });

      console.log(`Assigned super_admin to ${email} (userId=${user.id}, orgId=${user.organizationId})`);
    }

    console.log('\nDone. Both users now have the super_admin role.');
    console.log('Their existing sessions will get the new role on next token refresh (up to 2h).');
    console.log('To force immediate effect, revoke their sessions in the DB:');
    console.log("  DELETE FROM usr_sessions WHERE \"userId\" IN (SELECT id FROM usr_users WHERE email = ANY(ARRAY['fadi@soleria.se','malek@soleria.se']));");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
