'use client';

import { motion } from 'framer-motion';
import type { DashboardReadModel } from '@modules/generic/dashboard';
import { STAGGER_CONTAINER } from '@shared/lib/motion';
import {
  ActionQueue,
  ActivityFeedPanel,
  KpiStrip,
  OfferTable,
  PipelinePanel,
  ProjectHandoffPanel,
  TodayFocusPanel,
  WeatherPanel,
} from './dashboard-cockpit-panels';

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
    <div className="min-h-full bg-[oklch(0.985_0.002_250)] [--cockpit-border:oklch(0.90_0.006_250)] [--cockpit-border-soft:oklch(0.94_0.004_250)] [--cockpit-shadow:0_1px_2px_rgba(15,23,42,0.035),0_14px_34px_rgba(15,23,42,0.045)]">
      <div className="mx-auto w-full max-w-[1480px] px-4 py-3 sm:px-5 lg:px-5">
        <motion.div {...STAGGER_CONTAINER} className="space-y-3">
          <div className="grid items-stretch gap-3 xl:h-[172px] xl:grid-cols-[minmax(390px,1.05fr)_minmax(444px,1.28fr)_170px]">
            <TodayFocusPanel today={today} focusMetrics={focusMetrics} calendar={calendar} />
            <KpiStrip
              acceptedValue={acceptedValue}
              pipelineValue={pipelineValue}
              acceptanceRate={acceptanceRate}
              averageWonValue={pipelineOverview.averageWonValue}
            />
            <WeatherPanel weather={weather} />
          </div>

          <div className="grid items-stretch gap-3 xl:h-[304px] xl:grid-cols-12">
            <ActionQueue items={actionItems} />
            <OfferTable rows={offerTable} />
          </div>

          <div className="grid items-stretch gap-3 xl:h-[260px] xl:grid-cols-12">
            <PipelinePanel overview={pipelineOverview} />
            <ProjectHandoffPanel projects={projectHandoffs} />
            <ActivityFeedPanel items={activityFeed} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
