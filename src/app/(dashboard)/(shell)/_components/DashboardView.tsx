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
}: DashboardViewProps) {
  return (
    <div className="min-h-full bg-[oklch(0.985_0.002_250)] [--cockpit-border:oklch(0.905_0.004_250)] [--cockpit-border-soft:oklch(0.955_0.003_250)] [--cockpit-divider:oklch(0.935_0.003_250)] [--cockpit-shadow:0_1px_2px_rgba(15,23,42,0.025)]">
      <DashboardAutoRefresh />
      <div className="w-full px-4 py-3 lg:pb-3">
        <motion.div
          {...STAGGER_CONTAINER}
          className="space-y-3 xl:grid xl:grid-rows-[164px_420px_264px] xl:gap-3 xl:space-y-0"
        >
          <TopCockpitBand
            today={today}
            focusMetrics={focusMetrics}
            calendar={calendar}
            weather={weather}
            acceptedValue={acceptedValue}
            pipelineValue={pipelineValue}
            acceptanceRate={acceptanceRate}
            averageWonValue={pipelineOverview.averageWonValue}
          />

          <div className="grid items-stretch gap-3 xl:min-h-0 xl:grid-cols-12">
            <ActionQueue items={actionItems} />
            <OfferTable rows={offerTable} />
          </div>

          <div className="grid items-stretch gap-3 xl:min-h-0 xl:grid-cols-12">
            <PipelinePanel overview={pipelineOverview} />
            <ProjectHandoffPanel projects={projectHandoffs} overview={pipelineOverview} />
            <ActivityFeedPanel items={activityFeed} focusMetrics={focusMetrics} acceptanceRate={acceptanceRate} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
