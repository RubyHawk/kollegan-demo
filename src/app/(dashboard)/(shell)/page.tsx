import { getSessionUser } from '@platform/auth/session';
import { prisma } from '@platform/database/prisma';
import DashboardView from './_components/DashboardView';
import type { RecentOffer, MonthBucket } from './_components/DashboardView';

// ─── Swedish-timezone greeting ────────────────────────────────────────────────

function makeGreeting(name: string | null) {
  const hour = parseInt(
    new Intl.DateTimeFormat('sv', { hour: 'numeric', hour12: false, timeZone: 'Europe/Stockholm' })
      .format(new Date()),
    10,
  );
  const prefix =
    hour < 5  ? 'God natt' :
    hour < 12 ? 'God morgon' :
    hour < 17 ? 'God eftermiddag' :
    hour < 22 ? 'God kväll' :
                'God natt';
  return name ? `${prefix}, ${name}` : prefix;
}

function makeDateLabel() {
  return new Date().toLocaleDateString('sv-SE', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'Europe/Stockholm',
  });
}

// ─── Data layer ───────────────────────────────────────────────────────────────

async function getDashboardData(orgId: string) {
  // How far back for monthly chart
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [counts, recentRaw, valueRows, monthlyRaw] = await Promise.all([
    prisma.offer.groupBy({
      by: ['status'],
      where: { organizationId: orgId, deletedAt: null },
      _count: { id: true },
    }),

    prisma.offer.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true, title: true, status: true, offerNumber: true,
        recipientName: true, recipientCompany: true,
        totalIncVat: true, createdAt: true, sentAt: true, validUntil: true,
      },
    }),

    prisma.offer.groupBy({
      by: ['status'],
      where: { organizationId: orgId, deletedAt: null },
      _sum: { totalIncVat: true },
    }),

    prisma.offer.findMany({
      where: { organizationId: orgId, deletedAt: null, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true },
    }),
  ]);

  // Status counts
  const countMap: Record<string, number> = { draft: 0, sent: 0, viewed: 0, accepted: 0, declined: 0, expired: 0 };
  let total = 0;
  for (const r of counts) { countMap[r.status] = r._count.id; total += r._count.id; }

  // Value aggregates
  const valueMap: Record<string, number> = {};
  for (const r of valueRows) { valueMap[r.status] = Number(r._sum.totalIncVat ?? 0); }

  const acceptedValue  = valueMap['accepted'] ?? 0;
  const pipelineValue  = (valueMap['sent'] ?? 0) + (valueMap['viewed'] ?? 0);
  const closedTotal    = (countMap['accepted'] ?? 0) + (countMap['declined'] ?? 0);
  const acceptanceRate = closedTotal > 0 ? Math.round((countMap['accepted'] / closedTotal) * 100) : null;

  // Expiring within 7 days
  const in7days      = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const expiringSoon = await prisma.offer.count({
    where: { organizationId: orgId, deletedAt: null, status: { in: ['sent', 'viewed'] }, validUntil: { lte: in7days } },
  });

  // Build 6-month buckets
  const now = new Date();
  const monthlyData: MonthBucket[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleDateString('sv-SE', { month: 'short', timeZone: 'Europe/Stockholm' }),
      count: 0,
      accepted: 0,
    };
  });

  for (const o of monthlyRaw) {
    const d         = new Date(o.createdAt);
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    const idx       = 5 - monthsAgo;
    if (idx >= 0 && idx <= 5) {
      monthlyData[idx].count++;
      if (o.status === 'accepted') monthlyData[idx].accepted++;
    }
  }

  // Serialize for client (Decimal → number, Date → string)
  const recentOffers: RecentOffer[] = recentRaw.map(o => ({
    id:               o.id,
    title:            o.title,
    status:           o.status,
    offerNumber:      o.offerNumber,
    recipientName:    o.recipientName,
    recipientCompany: o.recipientCompany,
    totalIncVat:      Number(o.totalIncVat ?? 0),
    createdAt:        o.createdAt.toISOString(),
    sentAt:           o.sentAt?.toISOString() ?? null,
    validUntil:       o.validUntil?.toISOString() ?? null,
  }));

  return { countMap, total, recentOffers, acceptedValue, pipelineValue, acceptanceRate, expiringSoon, monthlyData };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const orgId = await prisma.user
    .findUnique({ where: { id: user.id }, select: { organizationId: true } })
    .then(u => u?.organizationId ?? '');

  if (!orgId) {
    return (
      <div className="px-8 py-10 text-sm text-[var(--text-muted)]">
        Ingen organisation kopplad till ditt konto.
      </div>
    );
  }

  const data = await getDashboardData(orgId);

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;

  return (
    <DashboardView
      greetingText={makeGreeting(displayName)}
      dateLabel={makeDateLabel()}
      {...data}
    />
  );
}
