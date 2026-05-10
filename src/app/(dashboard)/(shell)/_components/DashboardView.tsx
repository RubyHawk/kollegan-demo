'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { OfferActivityPoint, ProjectStats, RecentOffer } from '@modules/generic/dashboard';
import { Button } from '@shared/ui/button';
import {
  Counter,
  DashboardClock,
  MetricCard,
  ProjectStatsCard,
  StatusDistributionCard,
  TrendCard,
  fadeUp,
  stagger,
} from './dashboard-view-parts';
import { LatestOffersCard } from './dashboard-latest-offers';

export interface DashboardViewProps {
  greetingText: string;
  greetingSub: string;
  dateLabel: string;
  acceptedValue: number;
  pipelineValue: number;
  acceptanceRate: number | null;
  expiringSoon: number;
  total: number;
  countMap: Record<string, number>;
  recentOffers: RecentOffer[];
  activityData: OfferActivityPoint[];
  projectStats: ProjectStats;
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PipelineIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h5l3-8 5 16 3-8h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

function makeFocusInsight({
  activePipeline,
  acceptedCount,
  expiredCount,
  expiringSoon,
  viewedCount,
  sentCount,
}: {
  activePipeline: number;
  acceptedCount: number;
  expiredCount: number;
  expiringSoon: number;
  viewedCount: number;
  sentCount: number;
}) {
  if (expiringSoon > 0) {
    return {
      label: 'Fokus idag',
      title: `${expiringSoon} offerter behöver följas upp`,
      detail: 'Prioritera de datumstyrda affärerna innan de tappar tempo.',
    };
  }

  if (expiredCount > 0) {
    return {
      label: 'Rensa pipeline',
      title: `${expiredCount} utgångna offerter ligger kvar`,
      detail: 'Städa eller återaktivera dem så översikten visar rätt läge.',
    };
  }

  if (viewedCount > 0) {
    return {
      label: 'Varm pipeline',
      title: `${viewedCount} visade offerter väntar på nästa steg`,
      detail: 'Bra läge att ringa, justera eller få accept.',
    };
  }

  if (sentCount > 0 || activePipeline > 0) {
    return {
      label: 'Aktiv pipeline',
      title: `${activePipeline} offerter är ute hos kund`,
      detail: 'Följ status och håll nästa kontakt nära till hands.',
    };
  }

  if (acceptedCount > 0) {
    return {
      label: 'Lugnt läge',
      title: `${acceptedCount} vunna affärer i historiken`,
      detail: 'Ingen aktiv pipeline just nu. Skapa nästa offert när ny affär dyker upp.',
    };
  }

  return {
    label: 'Kom igång',
    title: 'Skapa första offerten',
    detail: 'Dashboarden blir smartare när det finns pipeline, accept och projektdata.',
  };
}

export default function DashboardView({
  greetingText,
  greetingSub,
  dateLabel,
  acceptedValue,
  pipelineValue,
  acceptanceRate,
  expiringSoon,
  total,
  countMap,
  recentOffers,
  activityData,
  projectStats,
}: DashboardViewProps) {
  const activePipeline = (countMap.sent ?? 0) + (countMap.viewed ?? 0);
  const acceptedCount = countMap.accepted ?? 0;
  const sentCount = countMap.sent ?? 0;
  const viewedCount = countMap.viewed ?? 0;
  const expiredCount = countMap.expired ?? 0;
  const focusInsight = makeFocusInsight({
    activePipeline,
    acceptedCount,
    expiredCount,
    expiringSoon,
    viewedCount,
    sentCount,
  });

  return (
    <div className="min-h-full bg-[var(--page-bg)]">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-[1360px] space-y-4 px-4 py-4 sm:px-6 lg:space-y-5 lg:py-5"
      >
        <motion.header
          variants={fadeUp}
          className="flex flex-col gap-4 rounded-xl border border-[var(--border-light)] bg-[var(--surface-0)] px-4 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.05)] sm:px-5 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                {dateLabel}
              </span>
              <DashboardClock />
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
              {greetingText}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-[var(--text-secondary)]">{greetingSub}</p>
          </div>

          <Button asChild size="sm" className="h-9 w-full shadow-[0_8px_18px_rgba(15,23,42,0.12)] sm:w-auto">
            <Link href="/offerter/ny">
              <PlusIcon />
              Ny offert
            </Link>
          </Button>
        </motion.header>

        <motion.section variants={stagger} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            featured
            icon={<CheckIcon />}
            label="Accepterat värde"
            value={acceptedValue > 0 ? <Counter to={acceptedValue} suffix=" kr" /> : '0 kr'}
            sub={acceptedCount > 0 ? `${acceptedCount} vunna affärer` : 'Inga accepterade ännu'}
            tone="success"
          />
          <MetricCard
            icon={<PipelineIcon />}
            label="Pipeline"
            value={pipelineValue > 0 ? <Counter to={pipelineValue} suffix=" kr" /> : '0 kr'}
            sub={`${activePipeline} aktiva offerter`}
            tone={activePipeline > 0 ? 'accent' : 'neutral'}
          />
          <MetricCard
            icon={<ChartIcon />}
            label="Vinstgrad"
            value={acceptanceRate !== null ? <><Counter to={acceptanceRate} /><span className="text-base">%</span></> : '0%'}
            sub={acceptanceRate !== null ? 'Av avslutade offerter' : 'Visas efter avslut'}
            tone="warning"
          />
          <MetricCard
            icon={<ClockIcon />}
            label="Utgår snart"
            value={<Counter to={expiringSoon} />}
            sub={expiringSoon > 0 ? 'Behöver följas upp inom 7 dagar' : 'Inga akuta datum'}
            tone={expiringSoon > 0 ? 'danger' : 'neutral'}
          />
        </motion.section>

        <motion.section
          variants={fadeUp}
          className="grid gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--surface-0)] p-3 shadow-[0_10px_26px_rgba(15,23,42,0.045)] lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.8fr))]"
        >
          <div className="flex items-start gap-3 rounded-lg bg-[var(--surface-1)] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]">
              <FocusIcon />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{focusInsight.label}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{focusInsight.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--text-secondary)]">{focusInsight.detail}</p>
            </div>
          </div>
          {[
            { label: 'Skickade', value: sentCount, helper: 'väntar svar' },
            { label: 'Visade', value: viewedCount, helper: 'varma affärer' },
            { label: 'Utgångna', value: expiredCount, helper: 'bör städas' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-[var(--border-light)] bg-[var(--surface-0)] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">{item.value.toLocaleString('sv-SE')}</p>
              <p className="text-xs text-[var(--text-secondary)]">{item.helper}</p>
            </div>
          ))}
        </motion.section>

        <motion.div variants={stagger} className="grid gap-4 xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-8">
            <LatestOffersCard
              offers={recentOffers}
              total={total}
              acceptedCount={acceptedCount}
              expiringSoon={expiringSoon}
              acceptanceRate={acceptanceRate}
            />
          </div>

          <aside className="min-w-0 space-y-4 xl:col-span-4">
            <ProjectStatsCard stats={projectStats} />
            <StatusDistributionCard countMap={countMap} total={total} />
            <TrendCard activityData={activityData} />
          </aside>
        </motion.div>
      </motion.div>
    </div>
  );
}
