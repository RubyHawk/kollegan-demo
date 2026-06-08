'use client';

import { motion } from 'framer-motion';
import type { DashboardReadModel } from '@modules/generic/dashboard';
import { STAGGER_CONTAINER } from '@shared/lib/motion';
import {
  ActionQueue,
  ActivityFeedPanel,
  OfferTable,
  PipelinePanel,
  ProjectHandoffPanel,
} from './dashboard-cockpit-panels';
import { DashboardAutoRefresh } from './dashboard-auto-refresh';
import { TopCockpitBand } from './dashboard-cockpit-top-band';

export interface DashboardViewProps extends DashboardReadModel {
  greetingText: string;
  greetingSub: string;
  dateLabel: string;
}

export default function DashboardView({
  acceptedValue,
  pipelineValue,
  acceptanceRate,
  pipelineOverview,
  today,
  focusMetrics,
  calendar,
  weather,
  actionItems,
  offerTable,
  projectHandoffs,
  activityFeed,
  kpiTrends,
  projectStats,
}: DashboardViewProps) {
  return (
    <div className="min-h-full bg-[var(--ui-bg)] [--cockpit-border:var(--ui-border-subtle)] [--cockpit-border-soft:var(--ui-surface-subtle)] [--cockpit-divider:var(--ui-surface-hover)] [--cockpit-shadow:0_1px_2px_rgba(15,23,42,0.025)]">
      <DashboardAutoRefresh />
      <div className="w-full px-4 py-3 lg:pb-3">
        <motion.div
          {...STAGGER_CONTAINER}
          className="space-y-3 xl:grid xl:grid-rows-[172px_420px_264px] xl:gap-3 xl:space-y-0"
        >
          <TopCockpitBand
            today={today}
            calendar={calendar}
            weather={weather}
            acceptedValue={acceptedValue}
            pipelineValue={pipelineValue}
            acceptanceRate={acceptanceRate}
            averageWonValue={pipelineOverview.averageWonValue}
            acceptedCount={pipelineOverview.stages.find((s) => s.id === 'accepted')?.count ?? 0}
            kpiTrends={kpiTrends}
          />

          <div className="grid items-stretch gap-3 xl:min-h-0 xl:grid-cols-12">
            <ActionQueue items={actionItems} />
            <OfferTable rows={offerTable} />
          </div>

          <div className="grid items-stretch gap-3 xl:min-h-0 xl:grid-cols-12">
            <PipelinePanel overview={pipelineOverview} acceptanceRate={acceptanceRate} />
            <ProjectHandoffPanel projects={projectHandoffs} overview={pipelineOverview} projectStats={projectStats} />
            <ActivityFeedPanel items={activityFeed} focusMetrics={focusMetrics} acceptanceRate={acceptanceRate} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
