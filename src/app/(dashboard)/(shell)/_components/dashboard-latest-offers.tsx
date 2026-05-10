'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { OfferProjectSummary, ProjectStage, RecentOffer } from '@modules/generic/dashboard';
import { cn } from '@shared/lib/utils';
import { DashboardCard, fadeIn } from './dashboard-view-parts';

const VISIBLE_OFFERS = 7;

const PROJECT_STAGE_META: Record<ProjectStage, { label: string; color: string; bg: string }> = {
  details: { label: 'Uppgifter', color: 'var(--text-secondary)', bg: 'var(--surface-2)' },
  ordered: { label: 'Beställt', color: 'var(--status-sent-text)', bg: 'var(--status-sent-bg)' },
  arrived: { label: 'Ankommet', color: 'var(--status-viewed-text)', bg: 'var(--status-viewed-bg)' },
  in_progress: { label: 'Pågår', color: 'var(--accent)', bg: 'var(--accent-subtle)' },
  completed: { label: 'Klart', color: 'var(--status-accepted-text)', bg: 'var(--status-accepted-bg)' },
};

const SIGNAL_META: Record<string, { label: string; helper: string; color: string; bg: string; border: string }> = {
  accepted: {
    label: 'Vunnen',
    helper: 'Redo för projekt',
    color: 'var(--status-accepted-text)',
    bg: 'var(--status-accepted-bg)',
    border: 'color-mix(in srgb, var(--status-accepted-text) 24%, var(--border))',
  },
  viewed: {
    label: 'Varm',
    helper: 'Kund har öppnat',
    color: 'var(--status-viewed-text)',
    bg: 'var(--status-viewed-bg)',
    border: 'color-mix(in srgb, var(--status-viewed-text) 24%, var(--border))',
  },
  sent: {
    label: 'Väntar',
    helper: 'Följ upp snart',
    color: 'var(--status-sent-text)',
    bg: 'var(--status-sent-bg)',
    border: 'color-mix(in srgb, var(--status-sent-text) 24%, var(--border))',
  },
  expired: {
    label: 'Åtgärd',
    helper: 'Utgången',
    color: 'var(--status-expired-text)',
    bg: 'var(--status-expired-bg)',
    border: 'color-mix(in srgb, var(--status-expired-text) 24%, var(--border))',
  },
  declined: {
    label: 'Tappad',
    helper: 'Avvisad',
    color: 'var(--status-declined-text)',
    bg: 'var(--status-declined-bg)',
    border: 'color-mix(in srgb, var(--status-declined-text) 24%, var(--border))',
  },
  draft: {
    label: 'Utkast',
    helper: 'Inte skickad',
    color: 'var(--status-draft-text)',
    bg: 'var(--status-draft-bg)',
    border: 'var(--status-draft-border)',
  },
};

const currencyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  maximumFractionDigits: 0,
});

function fmtSEK(value: number) {
  return currencyFormatter.format(value);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short' });
}

function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="8" y="3" width="8" height="4" rx="1.5" />
      <path d="M8 12h8M8 16h5" />
    </svg>
  );
}

function getOfferSignal(offer: RecentOffer) {
  return SIGNAL_META[offer.status] ?? SIGNAL_META.draft;
}

function SignalBadge({ offer }: { offer: RecentOffer }) {
  const signal = getOfferSignal(offer);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: signal.bg, color: signal.color, borderColor: signal.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: signal.color }} />
      {signal.label}
    </span>
  );
}

function ProjectStageBadge({ project }: { project: OfferProjectSummary | null }) {
  if (!project) return null;
  const meta = PROJECT_STAGE_META[project.stage];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: meta.bg, color: meta.color, borderColor: `color-mix(in srgb, ${meta.color} 22%, var(--border))` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

function OfferRecipient({ offer }: { offer: RecentOffer }) {
  return (
    <span className="truncate">
      {[offer.recipientName, offer.recipientCompany].filter(Boolean).join(' · ') || 'Ingen mottagare'}
    </span>
  );
}

export function LatestOffersCard({
  offers,
  total,
  acceptedCount,
  expiringSoon,
  acceptanceRate,
}: {
  offers: RecentOffer[];
  total: number;
  acceptedCount: number;
  expiringSoon: number;
  acceptanceRate: number | null;
}) {
  const visibleOffers = offers.slice(0, VISIBLE_OFFERS);
  const visibleExpired = visibleOffers.filter((offer) => offer.status === 'expired').length;
  const visibleWarm = visibleOffers.filter((offer) => offer.status === 'viewed').length;
  const visibleWon = visibleOffers.filter((offer) => offer.status === 'accepted').length;

  return (
    <DashboardCard
      title="Senaste offerter"
      description={offers.length > 0 ? `${visibleOffers.length} prioriterade av ${total} offerter` : 'Dina senaste offerter visas här när de finns.'}
      action={(
        <Link href="/offerter" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent-subtle)]">
          Visa alla
          <ArrowIcon />
        </Link>
      )}
      className="h-fit"
    >
      {offers.length === 0 ? (
        <motion.div variants={fadeIn} className="flex min-h-[220px] items-center justify-center px-5 py-8">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]">
              <EmptyIcon />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Inga offerter ännu</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
              Skapa första offerten för att fylla dashboarden med aktuell pipeline och aktivitet.
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-px border-b border-[var(--border-light)] bg-[var(--border-light)]">
            {[
              { label: 'Åtgärd', value: visibleExpired, helper: 'utgångna' },
              { label: 'Varmt', value: visibleWarm, helper: 'visade' },
              { label: 'Vunnet', value: visibleWon, helper: 'accepterade' },
            ].map((item) => (
              <div key={item.label} className="bg-[var(--surface-1)] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{item.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">{item.value.toLocaleString('sv-SE')}</p>
                <p className="text-[11px] text-[var(--text-secondary)]">{item.helper}</p>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-[var(--surface-1)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-3 py-2.5">Offert</th>
                  <th className="px-3 py-2.5">Kund</th>
                  <th className="px-3 py-2.5">Signal</th>
                  <th className="px-3 py-2.5 text-right">Belopp</th>
                  <th className="px-4 py-2.5 text-right">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {visibleOffers.map((offer) => {
                  const signal = getOfferSignal(offer);

                  return (
                    <tr
                      key={offer.id}
                      className={cn(
                        'group border-l-2 border-l-transparent transition-colors hover:bg-[var(--surface-1)]',
                        offer.status === 'expired' && 'border-l-[var(--status-expired-text)] bg-[color-mix(in_srgb,var(--status-expired-bg)_32%,var(--surface-0))]',
                        offer.status === 'accepted' && 'border-l-[var(--status-accepted-text)] bg-[color-mix(in_srgb,var(--status-accepted-bg)_28%,var(--surface-0))]',
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                        <Link href={`/offerter/${offer.id}`} className="block">
                          {offer.offerNumber ? `#${offer.offerNumber}` : '-'}
                        </Link>
                      </td>
                      <td className="max-w-[230px] px-3 py-3">
                        <Link href={`/offerter/${offer.id}`} className="block min-w-0">
                          <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{offer.title}</span>
                          <span className="mt-1 block"><ProjectStageBadge project={offer.project} /></span>
                        </Link>
                      </td>
                      <td className="max-w-[190px] px-3 py-3 text-xs text-[var(--text-secondary)]">
                        <Link href={`/offerter/${offer.id}`} className="block truncate">
                          <OfferRecipient offer={offer} />
                        </Link>
                      </td>
                      <td className="w-[150px] px-3 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <SignalBadge offer={offer} />
                          <span className="whitespace-nowrap text-[11px] text-[var(--text-muted)]">{signal.helper}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                        {fmtSEK(offer.totalIncVat)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[var(--text-muted)]">{fmtDate(offer.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[var(--border-light)] md:hidden">
            {visibleOffers.map((offer) => {
              const signal = getOfferSignal(offer);

              return (
                <Link
                  key={offer.id}
                  href={`/offerter/${offer.id}`}
                  className={cn(
                    'block border-l-2 border-l-transparent px-4 py-3 transition-colors hover:bg-[var(--surface-1)]',
                    offer.status === 'expired' && 'border-l-[var(--status-expired-text)] bg-[color-mix(in_srgb,var(--status-expired-bg)_32%,var(--surface-0))]',
                    offer.status === 'accepted' && 'border-l-[var(--status-accepted-text)] bg-[color-mix(in_srgb,var(--status-accepted-bg)_28%,var(--surface-0))]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{offer.title}</p>
                      <p className="mt-1 truncate text-xs text-[var(--text-secondary)]"><OfferRecipient offer={offer} /></p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{fmtSEK(offer.totalIncVat)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">{offer.offerNumber ? `#${offer.offerNumber}` : '-'}</span>
                    <SignalBadge offer={offer} />
                    <ProjectStageBadge project={offer.project} />
                    <span className="ml-auto text-xs text-[var(--text-muted)]">{fmtDate(offer.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">{signal.helper}</p>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-[var(--border-light)] bg-[var(--border-light)] sm:grid-cols-4">
            {[
              ['Totalt', total.toLocaleString('sv-SE')],
              ['Accepterade', acceptedCount.toLocaleString('sv-SE')],
              ['Utgående', expiringSoon.toLocaleString('sv-SE')],
              ['Vinstgrad', acceptanceRate !== null ? `${acceptanceRate}%` : '-'],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--surface-1)] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardCard>
  );
}
