/**
 * One-time backfill: attaches all existing Soleria data (offers, templates,
 * products, product categories) to the Soleria company record.
 *
 * Run on the VPS via SSH:
 *   npx tsx prisma/seed/backfill-soleria-company.ts
 *   npx tsx prisma/seed/backfill-soleria-company.ts --dry-run   # preview only
 *
 * Safe to re-run: only touches records where companyId IS NULL.
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const ORG_SLUG         = 'soleria';
const COMPANY_NAME     = 'Soleria';
const isDryRun         = process.argv.includes('--dry-run');

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma  = new PrismaClient({ adapter });

  try {
    // 1. Find the Soleria organisation
    const org = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } });
    if (!org) {
      console.error(`ERROR: Organisation with slug "${ORG_SLUG}" not found. Check ORG_SLUG constant.`);
      process.exit(1);
    }
    console.log(`Org: ${org.name} (${org.id})`);

    // 2. Find or create the Soleria company within that org
    let company = await prisma.company.findFirst({
      where: { organizationId: org.id, name: COMPANY_NAME, deletedAt: null },
    });

    if (!company) {
      // List all companies in the org so the user can verify/pick the right one
      const allCompanies = await prisma.company.findMany({
        where: { organizationId: org.id, deletedAt: null },
      });
      if (allCompanies.length === 0) {
        console.log(`No companies found in org "${ORG_SLUG}". Creating "${COMPANY_NAME}"...`);
        if (!isDryRun) {
          // Find a user to be createdBy (the first admin)
          const adminUser = await prisma.user.findFirst({
            where: { organizationId: org.id, isActive: true, deletedAt: null },
            select: { id: true, email: true },
          });
          if (!adminUser) {
            console.error('ERROR: No active user found in org to set as createdBy.');
            process.exit(1);
          }
          company = await prisma.company.create({
            data: {
              organizationId: org.id,
              name: COMPANY_NAME,
              createdBy: adminUser.id,
            },
          });
          console.log(`Created company: ${company.name} (${company.id}) — createdBy ${adminUser.email}`);
        } else {
          console.log(`[DRY RUN] Would create company "${COMPANY_NAME}"`);
          return;
        }
      } else if (allCompanies.length === 1) {
        company = allCompanies[0];
        console.log(`Using only company found: ${company!.name} (${company!.id})`);
      } else {
        console.log('Multiple companies found in org:');
        allCompanies.forEach((c) => console.log(`  - ${c.name} (${c.id})`));
        console.error(`ERROR: No company named "${COMPANY_NAME}" found. Set COMPANY_NAME constant to the correct name.`);
        process.exit(1);
      }
    } else {
      console.log(`Company: ${company.name} (${company.id})`);
    }

    const companyId = company!.id;

    // 3. Count affected records
    const [offersCount, templatesCount, productsCount, categoriesCount] = await Promise.all([
      prisma.offer.count({
        where: { organizationId: org.id, companyId: null, deletedAt: null },
      }),
      prisma.offerTemplate.count({
        where: { organizationId: org.id, companyId: null, deletedAt: null },
      }),
      prisma.offerProduct.count({
        where: { organizationId: org.id, companyId: null, deletedAt: null },
      }),
      prisma.productCategory.count({
        where: { organizationId: org.id, companyId: null, deletedAt: null },
      }),
    ]);

    console.log('\nRecords with companyId = NULL (will be backfilled):');
    console.log(`  off_offers:             ${offersCount}`);
    console.log(`  off_templates:          ${templatesCount}`);
    console.log(`  off_products:           ${productsCount}`);
    console.log(`  off_product_categories: ${categoriesCount}`);
    console.log(`  Total:                  ${offersCount + templatesCount + productsCount + categoriesCount}`);

    if (isDryRun) {
      console.log('\n[DRY RUN] No changes made. Remove --dry-run to apply.');
      return;
    }

    // 4. Backfill — idempotent: only updates where companyId IS NULL
    const [offerResult, templateResult, productResult, categoryResult] = await Promise.all([
      prisma.offer.updateMany({
        where: { organizationId: org.id, companyId: null },
        data:  { companyId },
      }),
      prisma.offerTemplate.updateMany({
        where: { organizationId: org.id, companyId: null },
        data:  { companyId },
      }),
      prisma.offerProduct.updateMany({
        where: { organizationId: org.id, companyId: null },
        data:  { companyId },
      }),
      prisma.productCategory.updateMany({
        where: { organizationId: org.id, companyId: null },
        data:  { companyId },
      }),
    ]);

    console.log('\nBackfill complete:');
    console.log(`  off_offers:             ${offerResult.count} updated`);
    console.log(`  off_templates:          ${templateResult.count} updated`);
    console.log(`  off_products:           ${productResult.count} updated`);
    console.log(`  off_product_categories: ${categoryResult.count} updated`);

    // 5. Verification — confirm no NULL companyIds remain
    const [remaining] = await Promise.all([
      prisma.offer.count({
        where: { organizationId: org.id, companyId: null, deletedAt: null },
      }),
    ]);
    if (remaining > 0) {
      console.warn(`\nWARNING: ${remaining} offers still have companyId = NULL after backfill. Investigate.`);
    } else {
      console.log('\nVerification passed: no remaining NULL companyIds in off_offers.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
