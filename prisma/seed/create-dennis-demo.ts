import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import bcrypt from 'bcryptjs';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const EMAIL = 'dennis@soleria.se';
const PASSWORD = 'dennis123';
const FIRST_NAME = 'Dennis';
const LAST_NAME = 'Demo';
const ORG_NAME = 'Soleria';
const ORG_SLUG = 'soleria';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    let org = await prisma.organization.findUnique({
      where: { slug: ORG_SLUG },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: ORG_NAME,
          slug: ORG_SLUG,
          plan: 'starter',
          orgType: 'internal',
        },
      });
      console.log('Created organisation:', org.id);
    } else {
      console.log('Using existing organisation:', org.id);
    }

    const existing = await prisma.user.findFirst({
      where: { email: EMAIL, deletedAt: null },
    });

    let user = existing;

    if (!user) {
      const passwordHash = await bcrypt.hash(PASSWORD, 12);
      const mfaGraceExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      user = await prisma.user.create({
        data: {
          email: EMAIL,
          passwordHash,
          firstName: FIRST_NAME,
          lastName: LAST_NAME,
          userType: 'staff',
          organizationId: org.id,
          mfaGraceExpiresAt,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          isActive: true,
        },
      });
      console.log('Created user:', user.id, user.email);
    } else {
      console.log('User already exists:', user.id, user.email);
    }

    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin' },
    });

    if (!adminRole) {
      console.warn('No admin role found in DB. Run the normal seed first.');
      return;
    }

    const existingAdminRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: adminRole.id,
        organizationId: org.id,
      },
    });

    if (!existingAdminRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
          organizationId: org.id,
          grantedBy: user.id,
        },
      });
      console.log('Assigned admin role');
    } else {
      console.log('Admin role already assigned');
    }

    const companies = await prisma.company.findMany({
      where: { organizationId: org.id, deletedAt: null },
      select: { id: true, name: true },
    });

    for (const company of companies) {
      const membership = await prisma.companyMember.findFirst({
        where: {
          companyId: company.id,
          userId: user.id,
        },
      });

      if (!membership) {
        await prisma.companyMember.create({
          data: {
            companyId: company.id,
            userId: user.id,
            role: 'admin',
            grantedBy: user.id,
          },
        });
        console.log(`Added company membership for ${company.name}`);
      }
    }

    console.log('Done. Login with:', EMAIL, '/', PASSWORD);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
