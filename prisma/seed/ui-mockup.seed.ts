/**
 * UI mockup seed — populates the local stub database with realistic fake data
 * so the dashboard renders with full content for screenshot/demo purposes.
 *
 * Safety guard: aborts if DATABASE_URL does not point at localhost or "stub".
 * Run: npx tsx prisma/seed/ui-mockup.seed.ts
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// ── Safety guard ──────────────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL ?? '';
if (!dbUrl.includes('localhost') && !dbUrl.includes('stub') && !dbUrl.includes('127.0.0.1')) {
  console.error('ERROR: DATABASE_URL does not look like a local/dev database. Aborting.');
  console.error('Only run this seed against a local stub database.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}
// Stockholm summer = UTC+2, so 10:00 local = 08:00 UTC
function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setUTCHours(hour - 2, minute, 0, 0);
  return d;
}
function incVat(exVat: number) {
  return Math.round(exVat * 1.25);
}

async function main() {
  // ── Find org + user ─────────────────────────────────────────────────────────
  const user = await prisma.user.findFirst({ where: { deletedAt: null } });
  if (!user) {
    console.error('No user found. Run create-admin.ts first.');
    process.exit(1);
  }
  const orgId = user.organizationId!;
  const userId = user.id;
  console.log(`Seeding org ${orgId} as user ${user.email}`);

  // ── Customers (3 — linked to accepted offers / projects) ──────────────────
  const [cust1, cust2, cust3] = await Promise.all([
    prisma.customer.upsert({
      where: { organizationId_email: { organizationId: orgId, email: 'anna@nordhem.se' } },
      create: { organizationId: orgId, name: 'Anna Lindqvist', email: 'anna@nordhem.se', company: 'Nordhem Fastigheter AB', city: 'Stockholm' },
      update: {},
    }),
    prisma.customer.upsert({
      where: { organizationId_email: { organizationId: orgId, email: 'erik@carlssonsoener.se' } },
      create: { organizationId: orgId, name: 'Erik Carlsson', email: 'erik@carlssonsoener.se', company: 'Carlsson & Söner Bygg', city: 'Göteborg' },
      update: {},
    }),
    prisma.customer.upsert({
      where: { organizationId_email: { organizationId: orgId, email: 'johan@uppsalatak.se' } },
      create: { organizationId: orgId, name: 'Johan Lindgren', email: 'johan@uppsalatak.se', company: 'Uppsala Tak AB', city: 'Uppsala' },
      update: {},
    }),
  ]);

  // ── Offers ──────────────────────────────────────────────────────────────────
  // Helper to avoid unique constraint conflicts on offerNumber
  async function createOffer(data: Parameters<typeof prisma.offer.create>[0]['data']) {
    return prisma.offer.upsert({
      where: { publicToken: data.publicToken as string },
      create: data as Parameters<typeof prisma.offer.create>[0]['data'],
      update: {},
    });
  }

  // 1. Accepted — Nordhem Fastigheter AB — 245k — has project
  const o1 = await createOffer({
    organizationId: orgId, createdBy: userId, publicToken: 'mock-o1',
    title: 'Takrenovering Järva industripark',
    status: 'accepted',
    recipientName: 'Anna Lindqvist', recipientEmail: 'anna@nordhem.se', recipientCompany: 'Nordhem Fastigheter AB',
    customerId: cust1.id,
    offerNumber: 1,
    totalExVat: 245000, totalIncVat: incVat(245000),
    validUntil: daysAgo(5),
    createdAt: daysAgo(33), sentAt: daysAgo(30), viewedAt: daysAgo(28), acceptedAt: daysAgo(15),
  } as never);

  // 2. Accepted — Carlsson & Söner — 185k — NO project (triggers action item)
  const o2 = await createOffer({
    organizationId: orgId, createdBy: userId, publicToken: 'mock-o2',
    title: 'Fasadrenovering Linnégatan 14',
    status: 'accepted',
    recipientName: 'Erik Carlsson', recipientEmail: 'erik@carlssonsoener.se', recipientCompany: 'Carlsson & Söner Bygg',
    customerId: cust2.id,
    offerNumber: 2,
    totalExVat: 185000, totalIncVat: incVat(185000),
    validUntil: daysAgo(2),
    createdAt: daysAgo(25), sentAt: daysAgo(22), viewedAt: daysAgo(20), acceptedAt: daysAgo(10),
  } as never);

  // 3. Viewed — BRF Solhöjden — 320k — expires tomorrow (warning action item)
  const o3 = await createOffer({
    organizationId: orgId, createdBy: userId, publicToken: 'mock-o3',
    title: 'Solpaneler + takbyte kvarter Solhöjden',
    status: 'viewed',
    recipientName: 'Lars Eriksson', recipientEmail: 'lars@brf-solhojden.se', recipientCompany: 'BRF Solhöjden',
    offerNumber: 3,
    totalExVat: 320000, totalIncVat: incVat(320000),
    validUntil: daysFromNow(1),
    createdAt: daysAgo(12), sentAt: daysAgo(9), viewedAt: daysAgo(5),
  } as never);

  // 4. Viewed — Göteborgs Fasad — 148k — viewed 4d ago, no reminder (needs follow-up)
  const o4 = await createOffer({
    organizationId: orgId, createdBy: userId, publicToken: 'mock-o4',
    title: 'Ventilation & fasadtätning Kungsportsavenyn',
    status: 'viewed',
    recipientName: 'Mikael Persson', recipientEmail: 'mikael@gfab.se', recipientCompany: 'Göteborgs Fasad AB',
    offerNumber: 4,
    totalExVat: 148000, totalIncVat: incVat(148000),
    validUntil: daysFromNow(8),
    createdAt: daysAgo(10), sentAt: daysAgo(8), viewedAt: daysAgo(4),
  } as never);

  // 5. Sent — Lindqvist Bygg — 92k — sent 6d ago, no reminder (needs follow-up)
  const o5 = await createOffer({
    organizationId: orgId, createdBy: userId, publicToken: 'mock-o5',
    title: 'Markarbeten Odensalavägen etapp 2',
    status: 'sent',
    recipientName: 'Sara Lindqvist', recipientEmail: 'sara@lindqvistbygg.se', recipientCompany: 'Lindqvist Bygg AB',
    offerNumber: 5,
    totalExVat: 92000, totalIncVat: incVat(92000),
    validUntil: daysFromNow(14),
    createdAt: daysAgo(8), sentAt: daysAgo(6),
  } as never);

  // 6. Sent — Malmö Takvård — 75k — OVERDUE (danger action item)
  const o6 = await createOffer({
    organizationId: orgId, createdBy: userId, publicToken: 'mock-o6',
    title: 'Takinspektioner & akutlagningar Rosengård',
    status: 'sent',
    recipientName: 'Patrik Holm', recipientEmail: 'patrik@malmotak.se', recipientCompany: 'Malmö Takvård AB',
    offerNumber: 6,
    totalExVat: 75000, totalIncVat: incVat(75000),
    validUntil: daysAgo(3),
    createdAt: daysAgo(16), sentAt: daysAgo(14),
  } as never);

  // 7. Accepted — Uppsala Tak — 178k — has project
  const o7 = await createOffer({
    organizationId: orgId, createdBy: userId, publicToken: 'mock-o7',
    title: 'Takläggning Kåbovägen villakvarter',
    status: 'accepted',
    recipientName: 'Johan Lindgren', recipientEmail: 'johan@uppsalatak.se', recipientCompany: 'Uppsala Tak AB',
    customerId: cust3.id,
    offerNumber: 7,
    totalExVat: 178000, totalIncVat: incVat(178000),
    validUntil: daysAgo(1),
    createdAt: daysAgo(20), sentAt: daysAgo(18), viewedAt: daysAgo(16), acceptedAt: daysAgo(12),
  } as never);

  // 8. Draft — stale (updated 2d ago) → warning action item
  const o8 = await createOffer({
    organizationId: orgId, createdBy: userId, publicToken: 'mock-o8',
    title: 'Fönsterbyte IVL Svenska Miljöinstitutet',
    status: 'draft',
    recipientName: 'Kristina Berg', recipientEmail: 'kristina@ivl.se', recipientCompany: 'IVL Svenska Miljöinstitutet',
    totalExVat: 67000, totalIncVat: incVat(67000),
    validUntil: daysFromNow(30),
    createdAt: daysAgo(3), updatedAt: daysAgo(2),
  } as never);

  // 9. Declined — Stenby Villor — 55k
  await createOffer({
    organizationId: orgId, createdBy: userId, publicToken: 'mock-o9',
    title: 'Poolinstallation Stenbyvägen 22',
    status: 'declined',
    recipientName: 'Karin Stenby', recipientEmail: 'karin@stenbyvillor.se', recipientCompany: 'Stenby Villor',
    offerNumber: 9,
    totalExVat: 55000, totalIncVat: incVat(55000),
    validUntil: daysAgo(10),
    createdAt: daysAgo(28), sentAt: daysAgo(25), declinedAt: daysAgo(20),
  } as never);

  // 10. Viewed — Haglund Fastigheter — 420k — high value, expires in 8d
  await createOffer({
    organizationId: orgId, createdBy: userId, publicToken: 'mock-o10',
    title: 'Stambyte & renovering Haglundsgatan 8–14',
    status: 'viewed',
    recipientName: 'Marcus Haglund', recipientEmail: 'marcus@haglund.se', recipientCompany: 'Haglund Fastigheter AB',
    offerNumber: 10,
    totalExVat: 420000, totalIncVat: incVat(420000),
    validUntil: daysFromNow(8),
    createdAt: daysAgo(18), sentAt: daysAgo(15), viewedAt: daysAgo(12),
  } as never);

  // ── Projects ─────────────────────────────────────────────────────────────────
  async function upsertProject(offerId: string, data: object) {
    const existing = await prisma.project.findUnique({ where: { organizationId_offerId: { organizationId: orgId, offerId } } });
    if (existing) return existing;
    return prisma.project.create({ data: { organizationId: orgId, createdBy: userId, offerId, ...data } as never });
  }

  // Project 1: Nordhem — in_progress
  await upsertProject(o1.id, {
    customerId: cust1.id,
    name: 'Nordhem Fastigheter — Takrenovering Järva',
    stage: 'in_progress',
    totalExVat: o1.totalExVat,
    totalIncVat: o1.totalIncVat,
    offerNumber: 1,
    offerAcceptedAt: daysAgo(15),
    siteAddress: 'Järva Industripark 12',
    siteCity: 'Stockholm',
    wishedInstallDate: daysFromNow(21),
    createdAt: daysAgo(14),
  });

  // Project 2: Uppsala Tak — details (ready for handoff)
  await upsertProject(o7.id, {
    customerId: cust3.id,
    name: 'Uppsala Tak — Kåbovägen Takläggning',
    stage: 'details',
    totalExVat: o7.totalExVat,
    totalIncVat: o7.totalIncVat,
    offerNumber: 7,
    offerAcceptedAt: daysAgo(12),
    siteAddress: 'Kåbovägen 41',
    siteCity: 'Uppsala',
    wishedInstallDate: daysFromNow(14),
    createdAt: daysAgo(11),
  });

  // ── Meetings (today) ──────────────────────────────────────────────────────
  async function upsertMeeting(title: string, scheduledAt: Date, endedAt: Date) {
    const existing = await prisma.meeting.findFirst({ where: { organizationId: orgId, title, scheduledAt } });
    if (existing) return;
    await prisma.meeting.create({
      data: {
        organizationId: orgId,
        createdBy: userId,
        title,
        status: 'scheduled',
        scheduledAt,
        endedAt,
      },
    });
  }

  await upsertMeeting(
    'Uppföljning Nordhem Solpaneler',
    todayAt(10, 0),
    todayAt(11, 0),
  );
  await upsertMeeting(
    'Planeringsmöte BRF Solhöjden',
    todayAt(14, 30),
    todayAt(15, 30),
  );

  console.log('✓ Customers: 3');
  console.log('✓ Offers: 10 (accepted×3, viewed×3, sent×2, draft×1, declined×1)');
  console.log('✓ Projects: 2 (in_progress, details)');
  console.log('✓ Meetings: 2 (today)');
  console.log('Done. Restart the Next.js dev server and refresh the dashboard.');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
