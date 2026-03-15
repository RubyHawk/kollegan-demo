/**
 * Compliance control registry seed.
 * Populates cmp_controls with the ISO 27001:2022 Annex A technological
 * controls that are auto-evidenceable from the platform infrastructure.
 *
 * Run via: prisma db seed  (or DATABASE_URL=... npx ts-node prisma/seed/compliance.seed.ts)
 */

import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ISO_27001_CONTROLS } from '../../src/modules/supporting/compliance/domain/control-registry';

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

const prisma = createClient();

export async function seedComplianceControls(): Promise<void> {
  console.log('Seeding ISO 27001 compliance controls...');

  for (const control of ISO_27001_CONTROLS) {
    await prisma.complianceControl.upsert({
      where:  { controlId: control.controlId },
      update: {
        name:         control.name,
        description:  control.description,
        category:     control.category,
        evidenceType: control.evidenceType,
      },
      create: {
        controlId:    control.controlId,
        name:         control.name,
        description:  control.description,
        category:     control.category,
        evidenceType: control.evidenceType,
        isActive:     true,
      },
    });
  }

  console.log(`Seeded ${ISO_27001_CONTROLS.length} compliance controls.`);
}

// Run when called directly
if (require.main === module) {
  seedComplianceControls()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
