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
import { DashboardBadge, EmptyPanelState, Panel } from './dashboard-cockpit-primitives';
import { fmtCompactSEK, fmtRelativeDate, fmtSEK, toneClasses } from './dashboard-cockpit-utils';

export function ActionQueue({ items }: { items: DashboardActionItem[] }) {
  return (
    <Panel
      title="Kräver handling"
      eyebrow={`${items.length} prioriterade`}
      action={<DotsThreeVertical size={18} weight="bold" className="text-[var(--text-muted)]" />}
      className="xl:col-span-5"
    >
      {items.length === 0 ? (
        <EmptyPanelState title="Inga akuta åtgärder" body="Öppna offerter och uppföljningar ser lugna ut just nu." />
      ) : (
        <div className="flex-1 divide-y divide-[var(--cockpit-border-soft,var(--border))] overflow-hidden">
          {items.map((item) => (
            <Link key={item.id} href={item.href} className="grid min-h-[64px] grid-cols-[3px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--surface-hover)]">
              <span className={cn('h-9 rounded-full', priorityRailClass(item.tone))} />
              <span className="min-w-0">
                <span className="mb-1 flex min-w-0 items-center gap-2">
                  <DashboardBadge tone={item.tone}>{priorityLabel(item.tone)}</DashboardBadge>
                  <span className="block truncate text-[13px] font-semibold text-[var(--text-primary)]">{item.label}</span>
                </span>
                <span className="block truncate text-xs text-[var(--text-secondary)]">{item.detail}</span>
              </span>
              <span className="inline-flex h-8 items-center rounded-md border border-[var(--cockpit-border-soft,var(--border))] bg-[var(--surface-1)] px-3 text-xs font-semibold text-[var(--accent)]">
                {item.actionLabel}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function OfferTable({ rows }: { rows: DashboardOfferTableRow[] }) {
  return (
    <Panel
      title="Aktiva offerter"
      eyebrow={`${rows.length} rader`}
      action={<Link href="/offerter" className="text-xs font-semibold text-[var(--accent)] hover:underline">Visa alla</Link>}
      className="xl:col-span-7"
    >
      {rows.length === 0 ? (
        <EmptyPanelState title="Inga aktiva offerter" body="När du skapar eller skickar offerter visas de här." />
      ) : (
        <div className="flex-1 overflow-hidden">
          <table className="w-full table-fixed text-left">
            <colgroup>
              <col className="w-[112px]" />
              <col />
              <col className="w-[104px]" />
              <col className="w-[126px]" />
              <col className="w-[128px]" />
            </colgroup>
            <thead className="sticky top-0 border-b border-[var(--cockpit-border-soft,var(--border))] bg-[var(--surface-1)] text-[10px] uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Kund</th>
                <th className="px-3 py-2 font-semibold">Belopp</th>
                <th className="px-3 py-2 font-semibold">Deadline</th>
                <th className="px-3 py-2 font-semibold">Nästa steg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cockpit-border-soft,var(--border))]">
              {rows.map((row) => (
                <tr key={row.id} className="h-[52px] transition-colors hover:bg-[var(--surface-hover)]">
                  <td className="px-3 py-1.5">
                    <Link href={row.href}>
                      <DashboardBadge tone={statusTone(row.status)}>{row.statusLabel}</DashboardBadge>
                    </Link>
                  </td>
                  <td className="min-w-0 px-3 py-1.5">
                    <Link href={row.href} className="block">
                      <span className="block truncate text-[13px] font-semibold leading-4 text-[var(--text-primary)]">{row.customer}</span>
                      <span className="block truncate text-[11px] leading-3 text-[var(--text-muted)]">Offert {row.offerNumber}</span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">{fmtSEK(row.amount)}</td>
                  <td className="px-3 py-1.5">
                    <DashboardBadge tone={row.deadlineTone}>{row.deadlineLabel}</DashboardBadge>
                  </td>
                  <td className="truncate px-3 py-1.5 text-[13px] text-[var(--text-secondary)]">{row.nextStep}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function PipelinePanel({ overview }: { overview: DashboardPipelineOverview }) {
  return (
    <Panel title="Pipelineöversikt" eyebrow={`Värde i pipeline ${fmtSEK(overview.totalValue)}`} action={<DotsThreeVertical size={18} weight="bold" className="text-[var(--text-muted)]" />} className="xl:col-span-4">
      <div className="flex-1 divide-y divide-[var(--cockpit-border-soft,var(--border))] px-4 py-2">
        {overview.stages.map((stage) => (
          <Link key={stage.id} href={`/offerter?status=${stage.id}`} className="grid h-[42px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 transition-colors hover:bg-[var(--surface-hover)]">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold uppercase text-[var(--text-muted)]">{stage.label}</p>
                <p className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">{fmtCompactSEK(stage.value)}</p>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stage.percent}%` }}
                  className="h-full rounded-full bg-[var(--accent)]"
                />
              </div>
            </div>
            <p className="w-8 text-right text-lg font-semibold tabular-nums text-[var(--text-primary)]">{stage.count}</p>
          </Link>
        ))}
        <div className="grid h-[42px] grid-cols-3 items-center gap-3 pt-2">
          <div>
            <p className="text-[10px] uppercase text-[var(--text-muted)]">Vägd pipeline</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{fmtSEK(Math.round(overview.totalValue * 0.35))}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--text-muted)]">Snittaffär</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{overview.averageWonValue > 0 ? fmtSEK(overview.averageWonValue) : '--'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--text-muted)]">Steg</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{overview.stages.length}</p>
          </div>
        </div>
      </div>
    </Panel>
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
      eyebrow={`${projects.length} aktiva projekt`}
      action={<Link href="/projekt" className="text-xs font-semibold text-[var(--accent)] hover:underline">Alla projekt</Link>}
      className="xl:col-span-4"
    >
      {projects.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center px-4 py-4">
          <div className="grid grid-cols-3 overflow-hidden rounded-md border border-[var(--cockpit-border-soft,var(--border))]">
            <div className="border-r border-[var(--cockpit-border-soft,var(--border))] px-3 py-3">
              <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Accepterade</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">{acceptedStage?.count ?? 0}</p>
            </div>
            <div className="border-r border-[var(--cockpit-border-soft,var(--border))] px-3 py-3">
              <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Värde</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">{fmtCompactSEK(acceptedStage?.value ?? 0)}</p>
            </div>
            <div className="px-3 py-3">
              <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Redo</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">{projects.length}</p>
            </div>
          </div>
          <p className="mt-4 text-center text-sm font-semibold text-[var(--text-primary)]">Inga projekt att lämna över</p>
          <p className="mx-auto mt-1 max-w-xs text-center text-xs leading-5 text-[var(--text-secondary)]">
            Accepterade offerter som saknar projekt hamnar här som nästa överlämning.
          </p>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-[var(--cockpit-border-soft,var(--border))] overflow-auto">
          {projects.map((project) => (
            <Link key={project.id} href={project.href} className="grid gap-2 px-4 py-3 transition-colors hover:bg-[var(--surface-hover)] sm:grid-cols-[minmax(0,1fr)_104px_88px] sm:items-center">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{project.name}</span>
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
    <Panel title="Senaste aktivitet" eyebrow="Live från erbjudanden" action={<Bell size={18} weight="duotone" className="text-[var(--text-muted)]" />} className="xl:col-span-4">
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col">
          <EmptyPanelState title="Ingen aktivitet ännu" body="Skapade, skickade, visade och accepterade offerter visas här." />
          <InsightBlock lines={insightLines} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 divide-y divide-[var(--cockpit-border-soft,var(--border))] overflow-hidden">
            {items.slice(0, 2).map((item) => {
            const content = (
                <span className="grid h-[48px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 transition-colors hover:bg-[var(--surface-hover)]">
                <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border', toneClasses(item.tone))}>
                  {item.tone === 'success' ? <CheckCircleIcon size={14} /> : <ReceiptIcon size={14} />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-[var(--text-primary)]">{item.label}</span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">{item.detail}</span>
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">{fmtRelativeDate(item.occurredAt)}</span>
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
    <div className="border-t border-[var(--cockpit-border-soft,var(--border))] bg-[var(--surface-1)] px-4 py-2.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]">
          <Lightbulb size={15} weight="duotone" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--text-primary)]">Insikter</p>
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
  return 'bg-[var(--accent)]';
}
