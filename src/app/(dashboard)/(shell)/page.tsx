import Link from 'next/link';
import { getSessionUser } from '@platform/auth/session';
import { prisma } from '@platform/database/prisma';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSEK(amount: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(amount);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short' });
}

function greeting(name: string | null) {
  const h = new Date().getHours();
  const prefix = h < 12 ? 'God morgon' : h < 18 ? 'God eftermiddag' : 'God kväll';
  return name ? `${prefix}, ${name}` : prefix;
}

const STATUS_LABEL: Record<string, string> = {
  draft:    'Utkast',
  sent:     'Skickad',
  viewed:   'Visad',
  accepted: 'Accepterad',
  declined: 'Avvisad',
  expired:  'Utgången',
};

const STATUS_STYLE: Record<string, string> = {
  draft:    'bg-[var(--status-draft-bg)]    text-[var(--status-draft-text)]',
  sent:     'bg-[var(--status-sent-bg)]     text-[var(--status-sent-text)]',
  viewed:   'bg-[var(--status-viewed-bg)]   text-[var(--status-viewed-text)]',
  accepted: 'bg-[var(--status-accepted-bg)] text-[var(--status-accepted-text)]',
  declined: 'bg-[var(--status-declined-bg)] text-[var(--status-declined-text)]',
  expired:  'bg-[var(--status-expired-bg)]  text-[var(--status-expired-text)]',
};

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getDashboardData(orgId: string) {
  const [counts, recentOffers, valueRows] = await Promise.all([
    // Status counts
    prisma.offer.groupBy({
      by: ['status'],
      where: { organizationId: orgId, deletedAt: null },
      _count: { id: true },
    }),

    // Recent 8 offers
    prisma.offer.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true, title: true, status: true, offerNumber: true,
        recipientName: true, recipientCompany: true,
        totalIncVat: true, createdAt: true, sentAt: true,
        validUntil: true,
      },
    }),

    // Value aggregates by status
    prisma.offer.groupBy({
      by: ['status'],
      where: { organizationId: orgId, deletedAt: null },
      _sum: { totalIncVat: true },
    }),
  ]);

  const countMap: Record<string, number> = { draft: 0, sent: 0, viewed: 0, accepted: 0, declined: 0, expired: 0 };
  let total = 0;
  for (const r of counts) { countMap[r.status] = r._count.id; total += r._count.id; }

  const valueMap: Record<string, number> = {};
  for (const r of valueRows) { valueMap[r.status] = r._sum.totalIncVat ?? 0; }

  const acceptedValue  = valueMap['accepted'] ?? 0;
  const pipelineValue  = (valueMap['sent'] ?? 0) + (valueMap['viewed'] ?? 0);
  const closedTotal    = (countMap['accepted'] ?? 0) + (countMap['declined'] ?? 0);
  const acceptanceRate = closedTotal > 0 ? Math.round((countMap['accepted'] / closedTotal) * 100) : null;

  // Offers expiring within 7 days (sent or viewed)
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const expiringSoon = await prisma.offer.count({
    where: {
      organizationId: orgId,
      deletedAt: null,
      status: { in: ['sent', 'viewed'] },
      validUntil: { lte: in7days },
    },
  });

  return { countMap, total, recentOffers, acceptedValue, pipelineValue, acceptanceRate, expiringSoon };
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-5 flex flex-col gap-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent ?? 'text-[var(--text-primary)]'}`}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
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

  const {
    countMap, total, recentOffers,
    acceptedValue, pipelineValue, acceptanceRate, expiringSoon,
  } = await getDashboardData(orgId);

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">
            {greeting(displayName)}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Här är en överblick över dina offerter.
          </p>
        </div>
        <Link
          href="/offerter/ny"
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Ny offert
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Accepterat värde"
          value={acceptedValue > 0 ? fmtSEK(acceptedValue) : '—'}
          sub={countMap['accepted'] ? `${countMap['accepted']} accepterade` : 'Inga accepterade ännu'}
          accent="text-[var(--status-accepted-text)]"
        />
        <StatCard
          label="Pipeline"
          value={pipelineValue > 0 ? fmtSEK(pipelineValue) : '—'}
          sub={`${(countMap['sent'] ?? 0) + (countMap['viewed'] ?? 0)} aktiva offerter`}
        />
        <StatCard
          label="Acceptansgrad"
          value={acceptanceRate !== null ? `${acceptanceRate}%` : '—'}
          sub={acceptanceRate !== null ? 'Av avslutade offerter' : 'Inga avslutade ännu'}
          accent={acceptanceRate !== null && acceptanceRate >= 50 ? 'text-[var(--status-accepted-text)]' : undefined}
        />
        <StatCard
          label="Utgår snart"
          value={String(expiringSoon)}
          sub="Inom 7 dagar"
          accent={expiringSoon > 0 ? 'text-[var(--status-declined-text)]' : undefined}
        />
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent offers — takes 2/3 width */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Senaste offerter</h2>
            <Link href="/offerter" className="text-xs text-[var(--accent)] hover:underline font-medium">
              Visa alla →
            </Link>
          </div>

          {recentOffers.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--text-muted)]">
              Inga offerter ännu.{' '}
              <Link href="/offerter/ny" className="text-[var(--accent)] hover:underline">Skapa din första →</Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recentOffers.map((offer) => (
                <Link
                  key={offer.id}
                  href={`/offerter?id=${offer.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--surface-hover)] transition-colors group"
                >
                  {/* Number */}
                  <span className="text-xs font-mono text-[var(--text-muted)] w-10 shrink-0">
                    {offer.offerNumber ? `#${offer.offerNumber}` : '—'}
                  </span>

                  {/* Title + recipient */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                      {offer.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {offer.recipientName}{offer.recipientCompany ? ` · ${offer.recipientCompany}` : ''}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[offer.status] ?? ''}`}>
                    {STATUS_LABEL[offer.status] ?? offer.status}
                  </span>

                  {/* Value */}
                  <span className="shrink-0 text-sm font-semibold text-[var(--text-primary)] tabular-nums w-28 text-right">
                    {fmtSEK(offer.totalIncVat)}
                  </span>

                  {/* Date */}
                  <span className="shrink-0 text-xs text-[var(--text-muted)] w-12 text-right">
                    {fmtDate(offer.createdAt.toString())}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Status breakdown */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Status</h2>
            <div className="space-y-2.5">
              {(['draft','sent','viewed','accepted','declined','expired'] as const).map((s) => {
                const count = countMap[s] ?? 0;
                const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[s]}`}>
                        {STATUS_LABEL[s]}
                      </span>
                      <span className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">{count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-[var(--surface-alt)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]/30 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-4">{total} offerter totalt</p>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Genvägar</h2>
            <div className="flex flex-col gap-1.5">
              {[
                { href: '/offerter/ny', label: 'Ny offert',         icon: 'M12 5v14M5 12h14' },
                { href: '/offerter',    label: 'Alla offerter',      icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
                { href: '/mallar',      label: 'Mallar',             icon: 'M4 4h16v4H4zM4 12h16M4 16h16M4 20h10' },
                { href: '/produkter',  label: 'Produktbibliotek',   icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--text-muted)]">
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
