'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type {
  DashboardActionItem,
  DashboardActivityFeedItem,
  DashboardFocusMetrics,
  DashboardOfferTableRow,
  DashboardPipelineOverview,
  DashboardProjectHandoff,
  DashboardTone,
  ProjectStats,
} from '@modules/generic/dashboard';
import {
  CalendarIcon,
  CheckCircleIcon,
  FolderIcon,
  PhoneIcon,
  ReceiptIcon,
  SendIcon,
} from '@shared/ui/icons';
import { cn } from '@shared/lib/utils';
import {
  Bell,
  DotsThreeVertical,
  Lightbulb,
} from '@phosphor-icons/react';
import { DashboardBadge, DashboardDotLabel, EmptyPanelState, Panel } from './dashboard-cockpit-primitives';
import { fmtCompactSEK, fmtRelativeDate, fmtSEK, toneClasses } from './dashboard-cockpit-utils';

// ── ActionQueue ───────────────────────────────────────────────────────────────

export function ActionQueue({ items }: { items: DashboardActionItem[] }) {
  const criticalCount = items.filter((i) => i.tone === 'danger').length;
  const warningCount = items.filter((i) => i.tone === 'warning').length;
  const insightText = criticalCount > 0
    ? `${criticalCount} kritisk${criticalCount !== 1 ? 'a' : ''} åtgärd${criticalCount !== 1 ? 'er' : ''} kräver omedelbar hantering.`
    : warningCount > 0
      ? `${warningCount} erbjudande${warningCount !== 1 ? 'n' : ''} är på väg att löpa ut. Agera innan de förfaller.`
      : 'Läget ser bra ut — alla offerter är under kontroll.';

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
          <div className="mx-3.5 my-2 flex flex-1 items-start gap-2.5 overflow-hidden rounded-lg border border-dashed border-[var(--cockpit-border-soft,var(--border))] bg-[var(--surface-1)] px-3 py-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200">
              <Lightbulb size={13} weight="duotone" className="text-amber-500" />
            </span>
            <p className="text-[11.5px] leading-[1.55] text-[#475569]">{insightText}</p>
          </div>
          <Link
            href="/offerter"
            className="flex h-9 shrink-0 items-center justify-center border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] text-[11.5px] font-semibold text-[var(--accent)] hover:underline"
          >
            Visa alla åtgärder →
          </Link>
        </div>
      )}
    </Panel>
  );
}

type ActionIconComponent = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

function ctaConfig(actionLabel: string): { Icon: ActionIconComponent; word: string } {
  if (actionLabel === 'Ring nu') return { Icon: PhoneIcon, word: 'Ring' };
  if (actionLabel === 'Följ upp') return { Icon: SendIcon, word: 'Följ upp' };
  if (actionLabel === 'Förläng') return { Icon: CalendarIcon, word: 'Förläng' };
  if (actionLabel === 'Redo för projekt') return { Icon: FolderIcon, word: 'Projekt' };
  if (actionLabel === 'Skicka offert') return { Icon: SendIcon, word: 'Skicka' };
  return { Icon: CheckCircleIcon, word: 'Åtgärda' };
}

function ctaBtnClass(tone: DashboardActionItem['tone']): string {
  if (tone === 'danger') return 'bg-red-50 text-red-700';
  if (tone === 'warning') return 'bg-amber-50 text-amber-700';
  if (tone === 'info') return 'bg-violet-50 text-violet-700';
  return 'bg-slate-100 text-slate-600';
}

const TONE_CHIP_LABELS: Record<DashboardActionItem['tone'], string> = {
  danger: 'Kritisk',
  warning: 'Varning',
  info: 'Info',
  neutral: 'Normal',
};

const TONE_CHIP_CLASSES: Record<DashboardActionItem['tone'], string> = {
  danger: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]',
  warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]',
  info: 'bg-[var(--status-viewed-bg)] text-[var(--status-viewed-text)]',
  neutral: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
};

function ActionQueueRow({ item }: { item: DashboardActionItem }) {
  const { Icon, word } = ctaConfig(item.actionLabel);
  return (
    <Link
      href={item.href}
      className="grid min-h-[58px] grid-cols-[6px_minmax(0,1fr)_auto] items-stretch gap-3 pr-3.5 transition-colors hover:bg-[var(--surface-hover)]"
    >
      <span className={cn('rounded-r-sm', priorityRailClass(item.tone))} />
      <span className="flex min-w-0 flex-col justify-center py-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={cn('shrink-0 rounded px-1.5 py-px text-[9.5px] font-bold leading-4', TONE_CHIP_CLASSES[item.tone])}>
            {TONE_CHIP_LABELS[item.tone]}
          </span>
          <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">{item.label}</span>
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-[#475569]">{item.detail}</span>
      </span>
      <span className="flex items-center">
        <span className={cn('inline-flex h-8 w-[72px] items-center justify-center gap-1.5 rounded-md text-[11.5px] font-semibold', ctaBtnClass(item.tone))}>
          <Icon size={12} strokeWidth={2.5} />
          {word}
        </span>
      </span>
    </Link>
  );
}

// ── OfferTable ────────────────────────────────────────────────────────────────

export function OfferTable({ rows }: { rows: DashboardOfferTableRow[] }) {
  const [view, setView] = useState<'table' | 'diagram'>('table');
  const [tab, setTab] = useState<'aktiva' | 'risk' | 'vunna'>('aktiva');

  const riskRows = rows.filter((r) => r.deadlineTone === 'danger' || r.deadlineTone === 'warning');
  const vunnaRows = rows.filter((r) => r.status === 'accepted');
  const displayRows = tab === 'risk' ? riskRows : tab === 'vunna' ? vunnaRows : rows;

  const eyebrow = tab === 'aktiva'
    ? `${rows.length} aktiva`
    : tab === 'risk'
      ? `${riskRows.length} riskobjekt`
      : `${vunnaRows.length} vunna`;

  const footerLabel = tab === 'aktiva'
    ? 'Visa alla offerter →'
    : tab === 'risk'
      ? 'Visa alla riskobjekt →'
      : 'Visa alla vunna →';

  return (
    <Panel
      title="Aktiva offerter"
      eyebrow={eyebrow}
      action={<OfferTableToolbar view={view} onViewChange={setView} />}
      className="xl:col-span-7"
    >
      {rows.length === 0 ? (
        <EmptyPanelState title="Inga aktiva offerter" body="När du skapar eller skickar offerter visas de här." />
      ) : view === 'diagram' ? (
        <OfferDiagram rows={rows} />
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Horizontal scroll area: tabs + headers + rows scroll together on narrow viewports */}
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
            {/* Tab bar */}
            <div className="flex min-w-[650px] items-end gap-1 border-b border-[var(--cockpit-divider,var(--cockpit-border-soft))] px-3.5">
              {([
                { key: 'aktiva' as const, label: 'Aktiva', count: rows.length },
                { key: 'risk' as const, label: 'Risk', count: riskRows.length },
                { key: 'vunna' as const, label: 'Vunna', count: vunnaRows.length },
              ] as const).map(({ key, label, count }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    'flex h-8 cursor-pointer items-center gap-1.5 border-b-2 px-1 text-xs font-medium transition-colors',
                    tab === key
                      ? 'border-[var(--accent)] font-semibold text-[var(--accent)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                  )}
                >
                  {label}
                  <span className={cn(
                    'flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-semibold',
                    tab === key
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-muted)]',
                  )}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
            {/* Column headers */}
            <div className="grid h-8 min-w-[650px] grid-cols-[108px_minmax(180px,1fr)_100px_122px_124px] items-center border-b border-[var(--cockpit-divider,var(--cockpit-border-soft))] bg-[var(--surface-1)] px-3.5 text-[9.5px] font-semibold uppercase text-[var(--text-muted)]">
              <span>Status</span>
              <span>Kund</span>
              <span>Belopp</span>
              <span>Deadline</span>
              <span>Nästa steg</span>
            </div>
            {/* Rows */}
            <div className="divide-y divide-[var(--cockpit-divider,var(--cockpit-border-soft))]">
              {displayRows.map((row) => (
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
          {/* Footer — outside the scroll area so it stays pinned at panel bottom */}
          <Link
            href="/offerter"
            className="flex h-9 shrink-0 items-center justify-center border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] text-[11.5px] font-semibold text-[var(--accent)] hover:underline"
          >
            {footerLabel}
          </Link>
        </div>
      )}
    </Panel>
  );
}

function OfferTableToolbar({
  view,
  onViewChange,
}: {
  view: 'table' | 'diagram';
  onViewChange: (v: 'table' | 'diagram') => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onViewChange('table')}
        className={cn(
          'rounded px-2 py-1 text-[11px] font-semibold transition-colors',
          view === 'table'
            ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
        )}
      >
        Tabell
      </button>
      <button
        type="button"
        onClick={() => onViewChange('diagram')}
        className={cn(
          'rounded px-2 py-1 text-[11px] font-semibold transition-colors',
          view === 'diagram'
            ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
        )}
      >
        Diagram
      </button>
      <DotsThreeVertical size={16} weight="bold" className="ml-1 text-[var(--text-muted)]" />
    </div>
  );
}

// ── OfferDiagram ──────────────────────────────────────────────────────────────

const TONE_ORDER: DashboardTone[] = ['danger', 'warning', 'accent', 'info', 'success', 'neutral'];

const TONE_LABELS: Record<DashboardTone, string> = {
  danger: 'Kritisk',
  warning: 'Snart',
  accent: 'Aktiv',
  info: 'Visad',
  success: 'Accepterad',
  neutral: 'Ingen deadline',
};

const TONE_COLORS: Record<DashboardTone, string> = {
  danger: '#dc2626',
  warning: '#d97706',
  accent: '#3b82f6',
  info: '#8b5cf6',
  success: '#16a34a',
  neutral: '#94a3b8',
};

const SWEDISH_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

function OfferDiagram({ rows }: { rows: DashboardOfferTableRow[] }) {
  const groups = TONE_ORDER.map((tone) => {
    const group = rows.filter((r) => r.deadlineTone === tone);
    return { tone, count: group.length, total: group.reduce((s, r) => s + r.amount, 0) };
  }).filter((g) => g.count > 0);

  const maxTotal = Math.max(...groups.map((g) => g.total), 1);
  const grandTotal = rows.reduce((s, r) => s + r.amount, 0);
  const now = new Date();
  const monthLabel = `${SWEDISH_MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-3.5 py-3">
      <p className="mb-3 text-[11px] font-medium text-[#475569]">Pipeline per deadline-risk</p>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {groups.map((group) => {
          const pct = grandTotal > 0 ? Math.round((group.total / grandTotal) * 100) : 0;
          return (
            <div key={group.tone} className="grid grid-cols-[88px_minmax(0,1fr)_116px] items-center gap-3">
              <span className="truncate text-[11.5px] font-medium text-[#334155]">
                {TONE_LABELS[group.tone]}
              </span>
              <div className="relative h-[36px] overflow-hidden rounded-md bg-[var(--surface-2)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(group.total / maxTotal) * 100}%` }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: 0.04 }}
                  className="absolute inset-y-0 left-0 rounded-md"
                  style={{ backgroundColor: TONE_COLORS[group.tone] }}
                />
              </div>
              <div className="text-right text-[11.5px] tabular-nums">
                <span className="font-semibold text-[#334155]">{fmtCompactSEK(group.total)}</span>
                {' '}
                <span className="font-normal text-[#475569]">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 shrink-0 border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] pt-2.5 text-[10.5px] text-[var(--text-muted)]">
        Totalt {rows.length} offerter · {monthLabel}
      </div>
    </div>
  );
}

// ── PipelinePanel ─────────────────────────────────────────────────────────────

export function PipelinePanel({
  overview,
  acceptanceRate,
}: {
  overview: DashboardPipelineOverview;
  acceptanceRate: number | null;
}) {
  const weighted = Math.round(overview.totalValue * 0.35);
  const conversionDisplay = acceptanceRate !== null ? `${acceptanceRate}%` : '–';

  return (
    <Panel title="Pipelineöversikt" eyebrow={`Totalt ${fmtCompactSEK(overview.totalValue)} i pipeline`} action={<DotsThreeVertical size={16} weight="bold" className="text-[var(--text-muted)]" />} className="xl:col-span-4">
      <div className="flex flex-1 flex-col px-3.5 py-3">
        <div className="grid grid-cols-4 gap-1.5" style={{ height: 108 }}>
          {overview.stages.map((stage) => (
            <Link
              key={stage.id}
              href={`/offerter?status=${stage.id}`}
              className="flex min-w-0 flex-col justify-between rounded-md border border-[var(--cockpit-border-soft,var(--border))] bg-[var(--surface-0)] px-2 py-2 transition-colors hover:bg-[var(--surface-hover)]"
            >
              <span className="min-w-0">
                <span className="block truncate text-[9.5px] font-semibold uppercase tracking-[.04em] text-[var(--text-muted)]">{stage.label}</span>
                <span className="mt-2 block text-[17px] font-bold tabular-nums leading-none text-[var(--text-primary)]">{stage.count}</span>
                <span className="mt-0.5 block truncate text-[10px] font-semibold tabular-nums text-[var(--text-secondary)]">{fmtCompactSEK(stage.value)}</span>
              </span>
              <span className="h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${stage.percent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="block h-full rounded-full bg-[var(--accent)]"
                />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-auto grid grid-cols-3 gap-3 border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] pt-2.5">
          <PipelineStat label="Vägd pipeline" value={fmtSEK(weighted)} />
          <PipelineStat label="Snittaffär" value={overview.averageWonValue > 0 ? fmtSEK(overview.averageWonValue) : '--'} />
          <PipelineStat label="Konvertering" value={conversionDisplay} />
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

// ── ProjectHandoffPanel ───────────────────────────────────────────────────────

type ProjectGroup = { label: string; count: number; value: number };

function projectGroups(projects: DashboardProjectHandoff[], projectStats: ProjectStats): ProjectGroup[] {
  const klarProjects = projects.filter((p) => p.stage === 'details');
  const pagarProjects = projects.filter((p) => p.stage === 'in_progress' || p.stage === 'arrived');
  const planProjects = projects.filter((p) => p.stage === 'ordered');

  // Scope both count and value to the displayed slice so they are consistent.
  // The panel eyebrow shows the total from projectStats; these group headers show what's visible.
  return [
    { label: 'Klar för överlämning', count: klarProjects.length, value: klarProjects.reduce((s, p) => s + p.value, 0) },
    { label: 'Pågår', count: pagarProjects.length, value: pagarProjects.reduce((s, p) => s + p.value, 0) },
    { label: 'Planerad', count: planProjects.length, value: planProjects.reduce((s, p) => s + p.value, 0) },
  ];
}

function projectStageBadgeTone(stage: DashboardProjectHandoff['stage']): 'success' | 'accent' | 'neutral' {
  if (stage === 'details') return 'success';
  if (stage === 'in_progress' || stage === 'arrived') return 'accent';
  return 'neutral';
}

function projectStageBadgeLabel(stage: DashboardProjectHandoff['stage']): string {
  if (stage === 'details') return 'Klar';
  if (stage === 'in_progress' || stage === 'arrived') return 'Pågår';
  return 'Planerad';
}

export function ProjectHandoffPanel({
  projects,
  overview,
  projectStats,
}: {
  projects: DashboardProjectHandoff[];
  overview: DashboardPipelineOverview;
  projectStats: ProjectStats;
}) {
  const groups = projectGroups(projects, projectStats);
  const totalActive = groups.reduce((s, g) => s + g.count, 0);

  return (
    <Panel
      title="Projektöverlämning"
      eyebrow={`${totalActive} aktiva projekt`}
      action={<Link href="/projekt" className="text-[11px] font-semibold text-[var(--accent)] hover:underline">Alla projekt</Link>}
      className="xl:col-span-4"
    >
      {/* 3-column summary header */}
      <div className="grid grid-cols-3 divide-x divide-[var(--cockpit-divider,var(--cockpit-border-soft))] border-b border-[var(--cockpit-divider,var(--cockpit-border-soft))]">
        {groups.map((g) => (
          <div key={g.label} className="flex flex-col px-3 py-2.5">
            <span className="truncate text-[9px] font-semibold uppercase tracking-[.05em] text-[var(--text-muted)]">{g.label}</span>
            <span className="mt-1 text-[19px] font-bold tabular-nums leading-none text-[var(--text-primary)]">{g.count}</span>
            {g.value > 0 && (
              <span className="mt-0.5 text-[10px] font-medium tabular-nums text-[var(--text-secondary)]">{fmtCompactSEK(g.value)}</span>
            )}
          </div>
        ))}
      </div>

      {/* Project rows */}
      {projects.length === 0 ? (
        <div className="px-3.5 py-3">
          <div className="rounded bg-[var(--surface-1)] px-3 py-3">
            <p className="text-xs font-semibold text-[var(--text-primary)]">Nästa steg</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
              Nya accepterade offerter utan projekt hamnar här.
            </p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 divide-y divide-[var(--cockpit-divider,var(--cockpit-border-soft))] overflow-auto">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={project.href}
              className="grid h-[42px] grid-cols-[minmax(0,1fr)_68px_80px] items-center gap-2 px-3.5 transition-colors hover:bg-[var(--surface-hover)]"
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">{project.name}</span>
                <span className="mt-0.5 block truncate text-[10.5px] text-[var(--text-secondary)]">{project.customer}</span>
              </span>
              <DashboardBadge tone={projectStageBadgeTone(project.stage)} className="justify-center">
                {projectStageBadgeLabel(project.stage)}
              </DashboardBadge>
              <span className="truncate text-right text-[10.5px] text-[var(--text-muted)]">{project.handoffLabel}</span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

// ── ActivityFeedPanel ─────────────────────────────────────────────────────────

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
          <p className="text-xs font-semibold text-[var(--text-primary)]">Insikter</p>
          {lines.map((line) => (
            <p key={line} className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)]">{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusTone(status: string): DashboardOfferTableRow['deadlineTone'] {
  if (status === 'accepted') return 'success';
  if (status === 'viewed') return 'info';
  if (status === 'sent') return 'accent';
  return 'neutral';
}

function priorityRailClass(tone: DashboardActionItem['tone']): string {
  if (tone === 'danger') return 'bg-[var(--status-danger-text)]';
  if (tone === 'warning') return 'bg-[var(--status-warning-text)]';
  if (tone === 'info') return 'bg-[var(--status-viewed-text)]';
  return 'bg-[var(--text-muted)]';
}
