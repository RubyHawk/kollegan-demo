'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type {
  DashboardActionItem,
  DashboardActivityFeedItem,
  DashboardFocusMetrics,
  DashboardOfferTableRow,
  DashboardPipelineOverview,
  DashboardProjectHandoff,
} from '@modules/generic/dashboard';
import {
  CheckCircleIcon,
  ReceiptIcon,
} from '@shared/ui/icons';
import { cn } from '@shared/lib/utils';
import {
  Bell,
  DotsThreeVertical,
  Lightbulb,
} from '@phosphor-icons/react';
import { DashboardBadge, DashboardDotLabel, EmptyPanelState, Panel } from './dashboard-cockpit-primitives';
import { fmtCompactSEK, fmtRelativeDate, fmtSEK, toneClasses } from './dashboard-cockpit-utils';

export function ActionQueue({ items }: { items: DashboardActionItem[] }) {
  return (
    <Panel
      title="Kräver handling"
      eyebrow={`${items.length} prioriterade åtgärder`}
      action={<DotsThreeVertical size={16} weight="bold" className="text-[var(--text-muted)]" />}
      className="xl:col-span-5"
    >
      {items.length === 0 ? (
        <EmptyPanelState title="Inga akuta åtgärder" body="Öppna offerter och uppföljningar ser lugna ut just nu." />
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="divide-y divide-[var(--cockpit-divider,var(--cockpit-border-soft))]">
            {items.map((item) => (
              <ActionQueueRow key={item.id} item={item} />
            ))}
          </div>
          <Link href="/offerter" className="mt-auto inline-flex h-8 items-center px-3.5 text-[11px] font-semibold text-[var(--accent)] hover:underline">
            Visa alla ({items.length})
          </Link>
        </div>
      )}
    </Panel>
  );
}

function ActionQueueRow({ item }: { item: DashboardActionItem }) {
  return (
    <Link
      href={item.href}
      className="grid h-[60px] grid-cols-[3px_minmax(0,1fr)_auto] items-center gap-3 px-3.5 transition-colors hover:bg-[var(--surface-hover)]"
    >
      <span className={cn('h-9 rounded-full opacity-80', priorityRailClass(item.tone))} />
      <span className="min-w-0">
        <span className="mb-1 flex min-w-0 items-center gap-2">
          <DashboardDotLabel tone={item.tone} className="w-[60px] shrink-0">{priorityLabel(item.tone)}</DashboardDotLabel>
          <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">{item.label}</span>
        </span>
        <span className="block truncate text-[11px] text-[var(--text-secondary)]">{item.detail}</span>
      </span>
      <span className="inline-flex h-7 items-center rounded bg-[var(--surface-1)] px-2.5 text-[11px] font-semibold text-[var(--accent)] ring-1 ring-[var(--cockpit-divider,var(--cockpit-border-soft))]">
        {item.actionLabel}
      </span>
    </Link>
  );
}

export function OfferTable({ rows }: { rows: DashboardOfferTableRow[] }) {
  return (
    <Panel
      title="Aktiva offerter"
      eyebrow={`${rows.length} rader · Live`}
      action={<OfferTableToolbar />}
      className="xl:col-span-7"
    >
      {rows.length === 0 ? (
        <EmptyPanelState title="Inga aktiva offerter" body="När du skapar eller skickar offerter visas de här." />
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-8 min-w-[650px] items-end gap-4 border-b border-[var(--cockpit-divider,var(--cockpit-border-soft))] px-3.5 text-xs">
            {['Aktiva', 'Risk', 'Vunna'].map((tab, index) => (
              <span
                key={tab}
                className={cn(
                  'flex h-full items-center border-b-2 font-medium',
                  index === 0
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--text-secondary)]',
                )}
              >
                {tab}
              </span>
            ))}
          </div>
          <div className="grid h-8 min-w-[650px] grid-cols-[108px_minmax(180px,1fr)_100px_122px_124px] items-center border-b border-[var(--cockpit-divider,var(--cockpit-border-soft))] bg-[var(--surface-1)] px-3.5 text-[9.5px] font-semibold uppercase text-[var(--text-muted)]">
            <span>Status</span>
            <span>Kund</span>
            <span>Belopp</span>
            <span>Deadline</span>
            <span>Nästa steg</span>
          </div>
          <div className="divide-y divide-[var(--cockpit-divider,var(--cockpit-border-soft))]">
            {rows.map((row) => (
              <Link
                key={row.id}
                href={row.href}
                className="grid h-[41px] min-w-[650px] grid-cols-[108px_minmax(180px,1fr)_100px_122px_124px] items-center px-3.5 transition-colors hover:bg-[var(--surface-hover)]"
              >
                <span className="min-w-0 pr-3">
                  <DashboardDotLabel tone={statusTone(row.status)}>{row.statusLabel}</DashboardDotLabel>
                </span>
                <span className="min-w-0 pr-3">
                  <span className="block truncate text-xs font-semibold leading-4 text-[var(--text-primary)]">{row.displayCustomerName}</span>
                  <span className="block truncate text-[10.5px] leading-3 text-[var(--text-muted)]">{row.displaySubtitle}</span>
                </span>
                <span className="whitespace-nowrap pr-3 text-xs font-semibold tabular-nums text-[var(--text-primary)]">{row.displayAmount}</span>
                <span className="min-w-0 pr-3">
                  <DashboardBadge tone={row.deadlineTone}>{row.displayRiskLabel}</DashboardBadge>
                </span>
                <span className="truncate text-xs text-[var(--text-secondary)]">{row.displayNextAction}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

function OfferTableToolbar() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/offerter" className="rounded bg-[var(--accent-subtle)] px-2 py-1 text-[11px] font-semibold text-[var(--accent)]">
        Tabell
      </Link>
      <span className="text-[11px] font-medium text-[var(--text-muted)]">Diagram</span>
      <DotsThreeVertical size={16} weight="bold" className="text-[var(--text-muted)]" />
    </div>
  );
}

export function PipelinePanel({ overview }: { overview: DashboardPipelineOverview }) {
  const weighted = Math.round(overview.totalValue * 0.35);

  return (
    <Panel title="Pipelineöversikt" eyebrow={`Värde i pipeline ${fmtSEK(overview.totalValue)}`} action={<DotsThreeVertical size={16} weight="bold" className="text-[var(--text-muted)]" />} className="xl:col-span-4">
      <div className="flex flex-1 flex-col px-3.5 py-3">
        <div className="grid h-[112px] grid-cols-4 gap-1.5">
          {overview.stages.map((stage) => (
            <Link key={stage.id} href={`/offerter?status=${stage.id}`} className="flex min-w-0 flex-col justify-between rounded border border-[var(--cockpit-border-soft,var(--border))] bg-[var(--surface-0)] px-2.5 py-2 transition-colors hover:bg-[var(--surface-hover)]">
              <span className="min-w-0">
                <span className="block truncate text-[10px] font-medium text-[var(--text-muted)]">{stage.label}</span>
                <span className="mt-2 block text-lg font-semibold tabular-nums leading-none text-[var(--text-primary)]">{stage.count}</span>
                <span className="mt-1 block truncate text-[10.5px] font-semibold tabular-nums text-[var(--text-secondary)]">{fmtCompactSEK(stage.value)}</span>
              </span>
              <span className="h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${stage.percent}%` }}
                  className="block h-full rounded-full bg-[var(--accent)]"
                />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-auto grid h-11 grid-cols-3 gap-3 border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] pt-3">
          <PipelineStat label="Vägd pipeline" value={fmtSEK(weighted)} />
          <PipelineStat label="Snittaffär" value={overview.averageWonValue > 0 ? fmtSEK(overview.averageWonValue) : '--'} />
          <PipelineStat label="Steg" value={`${overview.stages.length}`} />
        </div>
      </div>
    </Panel>
  );
}

function PipelineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export function ProjectHandoffPanel({
  projects,
  overview,
}: {
  projects: DashboardProjectHandoff[];
  overview: DashboardPipelineOverview;
}) {
  const acceptedStage = overview.stages.find((stage) => stage.id === 'accepted');

  return (
    <Panel
      title="Projektöverlämning"
      eyebrow={`${projects.length} redo för nästa steg`}
      action={<Link href="/projekt" className="text-[11px] font-semibold text-[var(--accent)] hover:underline">Alla projekt</Link>}
      className="xl:col-span-4"
    >
      <div className="grid grid-cols-3 gap-2 px-3.5 py-3">
        <ProjectSummaryMetric label="Accepterade" value={`${acceptedStage?.count ?? 0}`} />
        <ProjectSummaryMetric label="Värde" value={fmtCompactSEK(acceptedStage?.value ?? 0)} />
        <ProjectSummaryMetric label="Redo" value={`${projects.length}`} />
      </div>
      {projects.length === 0 ? (
        <div className="px-3.5 pb-3">
          <div className="rounded bg-[var(--surface-1)] px-3 py-3">
            <p className="text-xs font-semibold text-[var(--text-primary)]">Nästa steg</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
              Alla accepterade offerter är redan hanterade. Nya accepterade offerter utan projekt hamnar här.
            </p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 divide-y divide-[var(--cockpit-divider,var(--cockpit-border-soft))] overflow-auto">
          {projects.map((project) => (
            <Link key={project.id} href={project.href} className="grid h-[42px] gap-2 px-3.5 transition-colors hover:bg-[var(--surface-hover)] sm:grid-cols-[minmax(0,1fr)_104px_88px] sm:items-center">
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-[var(--text-primary)]">{project.name}</span>
                <span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">{project.customer}</span>
              </span>
              <DashboardBadge tone="accent" className="justify-center">{project.stageLabel}</DashboardBadge>
              <span className="text-xs text-[var(--text-secondary)] sm:text-right">{project.handoffLabel}</span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ProjectSummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded bg-[var(--surface-1)] px-3 py-2">
      <p className="truncate text-[10px] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 truncate text-base font-semibold tabular-nums leading-none text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export function ActivityFeedPanel({
  items,
  focusMetrics,
  acceptanceRate,
}: {
  items: DashboardActivityFeedItem[];
  focusMetrics: DashboardFocusMetrics;
  acceptanceRate: number | null;
}) {
  const insightLines = [
    acceptanceRate === null
      ? 'Vinstgrad visas när avslutade offerter finns.'
      : `Vinstgrad ${acceptanceRate}% på avslutade offerter.`,
    focusMetrics.missingFollowUp > 0
      ? `${focusMetrics.missingFollowUp} offerter saknar uppföljning.`
      : 'Uppföljningsläget är lugnt just nu.',
  ];
  return (
    <Panel title="Senaste aktivitet" eyebrow="Live från erbjudanden" action={<Bell size={16} weight="duotone" className="text-[var(--text-muted)]" />} className="xl:col-span-4">
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col">
          <EmptyPanelState title="Ingen aktivitet ännu" body="Skapade, skickade, visade och accepterade offerter visas här." />
          <InsightBlock lines={insightLines} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 divide-y divide-[var(--cockpit-divider,var(--cockpit-border-soft))] overflow-hidden">
            {items.slice(0, 4).map((item) => {
              const content = (
                <span className="grid h-[42px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-3.5 transition-colors hover:bg-[var(--surface-hover)]">
                  <span className={cn('flex h-6 w-6 items-center justify-center rounded-full border', toneClasses(item.tone))}>
                    {item.tone === 'success' ? <CheckCircleIcon size={13} /> : <ReceiptIcon size={13} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">{item.label}</span>
                    <span className="mt-0.5 block truncate text-[10.5px] text-[var(--text-secondary)]">{item.detail}</span>
                  </span>
                  <span className="text-[10.5px] text-[var(--text-muted)]">{fmtRelativeDate(item.occurredAt)}</span>
                </span>
              );

              return item.href ? <Link key={item.id} href={item.href}>{content}</Link> : <div key={item.id}>{content}</div>;
            })}
          </div>
          <InsightBlock lines={insightLines} />
        </div>
      )}
    </Panel>
  );
}

function InsightBlock({ lines }: { lines: string[] }) {
  return (
    <div className="border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] px-3.5 py-2.5">
      <div className="flex items-start gap-2.5 rounded bg-[var(--surface-1)] px-3 py-2.5">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]">
          <Lightbulb size={14} weight="duotone" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--text-primary)]">Insikt</p>
          {lines.map((line) => (
            <p key={line} className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)]">{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function statusTone(status: string): DashboardOfferTableRow['deadlineTone'] {
  if (status === 'accepted') return 'success';
  if (status === 'viewed') return 'info';
  if (status === 'sent') return 'accent';
  return 'neutral';
}

function priorityLabel(tone: DashboardActionItem['tone']): string {
  if (tone === 'danger') return 'Kritisk';
  if (tone === 'warning') return 'Varning';
  if (tone === 'info') return 'Info';
  return 'Normal';
}

function priorityRailClass(tone: DashboardActionItem['tone']): string {
  if (tone === 'danger') return 'bg-[var(--status-danger-text)]';
  if (tone === 'warning') return 'bg-[var(--status-warning-text)]';
  if (tone === 'info') return 'bg-[var(--status-viewed-text)]';
  return 'bg-[var(--text-muted)]';
}
