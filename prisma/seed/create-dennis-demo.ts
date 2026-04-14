import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const EMAIL = 'dennis@soleria.se';
const PASSWORD = 'dennis123';
const FIRST_NAME = 'Dennis';
const LAST_NAME = 'Demo';
const ORG_NAME = 'Soleria Demo';
const ORG_SLUG = 'soleria-demo';
const COMPANY_NAME = 'Soleria Demo';

const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run');
const allowExistingUser = args.has('--allow-existing-user');
const resetPassword = args.has('--reset-password');

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
          plan: 'demo',
          orgType: 'internal',
        },
      });
      console.log('Created demo organisation:', org.id);
    } else {
      console.log('Using demo organisation:', org.id);
    }

    const existing = await prisma.user.findFirst({
      where: { email: EMAIL, deletedAt: null },
      select: {
        id: true,
        email: true,
        organizationId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (existing && !allowExistingUser) {
      console.error(
        [
          `A user with email ${EMAIL} already exists (${existing.id}).`,
          'No changes were made.',
          'Run with --dry-run to inspect what would happen, or --allow-existing-user to safely isolate and reuse that account in the dedicated demo organization.',
        ].join(' '),
      );
      return;
    }

    const role = await prisma.role.findFirst({
      where: { name: { in: ['admin', 'user'] } },
      orderBy: { name: 'asc' },
    });

    const targetCompany = await prisma.company.findFirst({
      where: {
        organizationId: org.id,
        name: COMPANY_NAME,
        deletedAt: null,
      },
      select: { id: true, name: true },
    });

    const currentRoles = existing
      ? await prisma.userRole.findMany({
          where: { userId: existing.id },
          select: { organizationId: true, roleId: true },
        })
      : [];

    const currentMemberships = existing
      ? await prisma.companyMember.findMany({
          where: { userId: existing.id },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                organizationId: true,
              },
            },
          },
        })
      : [];

    const activeSessions = existing
      ? await prisma.session.count({
          where: {
            userId: existing.id,
            revokedAt: null,
          },
        })
      : 0;

    if (isDryRun) {
      console.log('Dry run summary:');
      console.log(`- Demo org: ${org.slug} (${org.id})`);
      console.log(
        existing
          ? `- User: would reuse ${existing.email} (${existing.id}) and move it into the demo org`
          : `- User: would create ${EMAIL} in the demo org`,
      );
      console.log(
        targetCompany
          ? `- Demo company: would reuse ${targetCompany.name} (${targetCompany.id})`
          : `- Demo company: would create ${COMPANY_NAME}`,
      );
      console.log(
        role
          ? `- Role: would assign ${role.name} in the demo org`
          : '- Role: no admin/user role found, login may still work but admin UI may stay limited',
      );
      console.log(`- Existing role assignments to replace: ${currentRoles.length}`);
      console.log(`- Existing company memberships to replace: ${currentMemberships.length}`);
      console.log(`- Active sessions to revoke: ${activeSessions}`);
      console.log(`- Password reset requested: ${resetPassword ? 'yes' : 'no'}`);
      console.log('Dry run only. No changes were made.');
      return;
    }

    const passwordHash = resetPassword || !existing ? await bcrypt.hash(PASSWORD, 12) : null;
    const mfaGraceExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            organizationId: org.id,
            firstName: existing.firstName || FIRST_NAME,
            lastName: existing.lastName || LAST_NAME,
            userType: 'staff',
            emailVerified: true,
            emailVerifiedAt: new Date(),
            isActive: true,
            mfaGraceExpiresAt,
            ...(passwordHash ? { passwordHash } : {}),
          },
        })
      : await prisma.user.create({
          data: {
            email: EMAIL,
            passwordHash: passwordHash!,
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

    console.log(existing ? `Updated existing user: ${user.id}` : `Created user: ${user.id}`);

    const company =
      targetCompany ??
      (await prisma.company.create({
        data: {
          organizationId: org.id,
          name: COMPANY_NAME,
          createdBy: user.id,
          notes: 'Isolated demo company for school presentations and safe walkthroughs.',
        },
      }));

    if (!targetCompany) {
      console.log('Created demo company:', company.id);
    } else {
      console.log('Using demo company:', company.id);
    }

    await prisma.userRole.deleteMany({
      where: { userId: user.id },
    });

    if (role) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          organizationId: org.id,
          grantedBy: user.id,
        },
      });
      console.log(`Assigned ${role.name} role in demo org`);
    } else {
      console.warn('No admin/user role found in DB. Skipped org role assignment.');
    }

    await prisma.companyMember.deleteMany({
      where: { userId: user.id },
    });

    await prisma.companyMember.create({
      data: {
        companyId: company.id,
        userId: user.id,
        role: 'admin',
        grantedBy: user.id,
      },
    });
    console.log('Assigned demo company membership');

    const revokedSessions = await prisma.session.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    console.log(`Revoked active sessions: ${revokedSessions.count}`);

    console.log('Dennis is now isolated from prior company data.');
    console.log('Login with:', EMAIL, '/', PASSWORD);
    if (!resetPassword && existing) {
      console.log('Password was left unchanged. Re-run with --reset-password if you want to force dennis123.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
