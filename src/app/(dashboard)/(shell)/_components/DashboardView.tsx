'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { OfferActivityPoint, ProjectStats, RecentOffer } from '@modules/generic/dashboard';
import {
  Counter,
  DashboardClock,
  KpiItem,
  OffersPaginated,
  ProjectStatsCard,
  StatusDistributionCard,
  TrendCard,
  fadeIn,
  fadeUp,
  stagger,
} from './dashboard-view-parts';
import WeatherWidget from './WeatherWidget';

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

export default function DashboardView({
  greetingText, greetingSub, dateLabel,
  acceptedValue, pipelineValue, acceptanceRate, expiringSoon,
  total, countMap, recentOffers, activityData, projectStats,
}: DashboardViewProps) {
  const activePipeline = (countMap.sent ?? 0) + (countMap.viewed ?? 0);

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-3 sm:px-6 sm:py-4">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">

        {/* ── Hero: greeting + embedded KPIs ─────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="overflow-hidden rounded-[24px] border border-[var(--border)] shadow-[0_16px_40px_rgba(0,0,0,0.09)]"
          style={{ background: 'linear-gradient(145deg, color-mix(in srgb, var(--surface-0) 92%, var(--accent) 8%), var(--surface-0))' }}
        >
          {/* Greeting row */}
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface-0))] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                  {dateLabel}
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Översikt
                </span>
              </div>
              <DashboardClock/>
              <h1 className="mt-2 font-heading text-[22px] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[26px]">
                {greetingText}
              </h1>
              <p className="mt-1.5 text-[13px] leading-5 text-[var(--text-secondary)]">{greetingSub}</p>
            </div>

            {/* CTA */}
            <div className="flex shrink-0 flex-col items-end gap-3 pt-0.5">
              <Link
                href="/offerter/ny"
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition-all hover:opacity-95 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, #e06b45 80%), color-mix(in srgb, var(--accent) 8%, #a34729 92%))' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                Ny offert
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-0 border-t border-[var(--border)]"/>

          {/* KPI strip */}
          <div className="grid grid-cols-2 divide-x divide-y divide-[var(--border)] xl:grid-cols-4 xl:divide-y-0">
            <KpiItem
              label="Pipeline"
              value={pipelineValue > 0 ? <Counter to={pipelineValue} suffix=" kr"/> : <span className="text-[var(--text-muted)]">—</span>}
              sub={`${activePipeline} aktiva offert${activePipeline===1?'':'er'}`}
              tone="linear-gradient(135deg,#1e5fb8,#1d8cff)"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
            />
            <KpiItem
              label="Accepterat värde"
              value={acceptedValue > 0 ? <Counter to={acceptedValue} suffix=" kr"/> : <span className="text-[var(--text-muted)]">—</span>}
              sub={countMap.accepted ? `${countMap.accepted} affär${countMap.accepted===1?'':'er'} vunna` : 'Inga accepterade offerter ännu'}
              tone="linear-gradient(135deg,#0d7d4f,#19a266)"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            />
            <KpiItem
              label="Vinstgrad"
              value={acceptanceRate !== null ? <><Counter to={acceptanceRate}/><span className="ml-0.5 text-base">%</span></> : <span className="text-[var(--text-muted)]">—</span>}
              sub={acceptanceRate !== null ? 'Andel accepterade av avslutade' : 'Visas när du har avslutade offerter'}
              tone="linear-gradient(135deg,#8a4f00,#d6851a)"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>}
            />
            <KpiItem
              label="Utgår snart"
              value={<Counter to={expiringSoon}/>}
              sub={expiringSoon > 0 ? `Offert${expiringSoon===1?'':'er'} löper ut inom 7 dagar` : 'Ingen offert behöver följas upp'}
              tone={expiringSoon > 0 ? 'linear-gradient(135deg,#c5543f,#ee7b5b)' : 'linear-gradient(135deg,#5f5a4d,#7f796c)'}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            />
          </div>
        </motion.div>

        {/* ── Main grid ──────────────────────────────────────────────── */}
        <motion.div variants={stagger} className="grid gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(460px,1fr)]">

          {/* Offers */}
          <motion.div
            variants={fadeUp}
            className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface-0)] shadow-[0_14px_36px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-3.5">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Senaste offerter</h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {recentOffers.length === 0
                    ? 'Här dyker dina senaste offerter upp när du kommit igång.'
                    : `${recentOffers.length} offerter — bläddra med pilarna nedan.`}
                </p>
              </div>
              <Link href="/offerter" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline">
                Visa alla
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>

            {recentOffers.length === 0 ? (
              <motion.div variants={fadeIn} className="flex min-h-[240px] flex-col items-center justify-center px-6 py-8 text-center">
                <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-1),var(--surface-0))] px-8 py-7 shadow-[0_16px_40px_rgba(0,0,0,0.07)]">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--accent-subtle)] text-[var(--accent)]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
                    </svg>
                  </div>
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-[var(--text-primary)]">Inga offerter än</h3>
                  <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-[var(--text-secondary)]">
                    Skapa din första offert för att börja fylla översikten med verklig aktivitet.
                  </p>
                  <Link href="/offerter/ny"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,0,0,0.13)] transition-all hover:opacity-95 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, #e06b45 80%), color-mix(in srgb, var(--accent) 8%, #a34729 92%))' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    Skapa första offerten
                  </Link>
                </div>
              </motion.div>
            ) : (
              <OffersPaginated offers={recentOffers}/>
            )}
          </motion.div>

          {/* Right sidebar */}
          <div className="space-y-3">
            <WeatherWidget />
            <ProjectStatsCard stats={projectStats}/>
            <StatusDistributionCard countMap={countMap} total={total}/>
            <TrendCard activityData={activityData}/>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
