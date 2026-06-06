'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Bell, CheckCircle, Eye, Folder, Receipt, Send } from 'lucide-react';
import type {
  DashboardActivityFeedItem,
  DashboardFocusMetrics,
  DashboardPipelineOverview,
  DashboardProjectHandoff,
  ProjectStats,
} from '@modules/generic/dashboard';
import { cn } from '@shared/lib/utils';
import { DashboardBadge, EmptyPanelState, Panel } from './dashboard-cockpit-primitives';
import { fmtCompactSEK, fmtRelativeDate, toneClasses } from './dashboard-cockpit-utils';
// ── ProjectHandoffPanel ───────────────────────────────────────────────────────

type ProjectGroup = { label: string; count: number; value: number };

function projectGroups(projects: DashboardProjectHandoff[]): ProjectGroup[] {
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

const PROJECT_STAGE_CONFIG = [
  { id: 'details', label: 'Överlämning', color: 'var(--ui-success-text)', tone: 'success' as const },
  { id: 'in_progress', label: 'Pågår', color: 'var(--ui-accent)', tone: 'accent' as const },
  { id: 'arrived', label: 'Anlänt', color: 'var(--ui-info-text)', tone: 'accent' as const },
  { id: 'ordered', label: 'Planerad', color: 'var(--ui-text-muted)', tone: 'neutral' as const },
] as const;

// Reverse of QUERY_TO_STAGE from projekt/_store/types.ts
const PROJECT_STAGE_QUERY: Record<string, string> = {
  details:     'uppgifter',
  ordered:     'bestallt',
  arrived:     'ankommet',
  in_progress: 'pagar',
  completed:   'klart',
};

export function ProjectHandoffPanel({
  projects,
}: {
  projects: DashboardProjectHandoff[];
  overview: DashboardPipelineOverview;
  projectStats: ProjectStats;
}) {
  const [view, setView] = useState<'lista' | 'steg'>('lista');
  const groups = projectGroups(projects);
  const totalActive = groups.reduce((s, g) => s + g.count, 0);

  return (
    <Panel
      title="Projektöverlämning"
      eyebrow={`${totalActive} aktiva projekt`}
      action={
        <div className="flex items-center gap-1">
          {(['lista', 'steg'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                'rounded px-2 py-1 text-[11px] font-semibold transition-colors',
                view === v
                  ? 'bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
                  : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-secondary)]',
              )}
            >
              {v === 'lista' ? 'Lista' : 'Steg'}
            </button>
          ))}
          <Link href="/projekt" className="ml-1 text-[11px] font-semibold text-[var(--ui-accent)] hover:underline">Alla →</Link>
        </div>
      }
      className="xl:col-span-4"
    >
      {/* 3-column summary header — only in Lista view; Steg shows the breakdown directly */}
      {view !== 'steg' && (
        <div className="grid grid-cols-3 divide-x divide-[var(--cockpit-divider,var(--cockpit-border-soft))] border-b border-[var(--cockpit-divider,var(--cockpit-border-soft))]">
          {groups.map((g) => (
            <div key={g.label} className="flex flex-col px-3 py-2.5">
              <span className="truncate text-[9px] font-semibold uppercase text-[var(--ui-text-muted)]">{g.label}</span>
              <span className="mt-1 text-[19px] font-bold tabular-nums leading-none text-[var(--ui-text)]">{g.count}</span>
              {g.value > 0 && (
                <span className="mt-0.5 text-[10px] font-medium tabular-nums text-[var(--ui-text-secondary)]">{fmtCompactSEK(g.value)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {view === 'steg' ? (
        <ProjectStageChart projects={projects} />
      ) : projects.length === 0 ? (
        <div className="px-3.5 py-3">
          <div className="rounded bg-[var(--ui-surface)] px-3 py-3">
            <p className="text-xs font-semibold text-[var(--ui-text)]">Nästa steg</p>
            <p className="mt-1 text-xs leading-5 text-[var(--ui-text-secondary)]">
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
              className="grid h-[42px] grid-cols-[minmax(0,1fr)_68px_80px] items-center gap-2 px-3.5 transition-colors hover:bg-[var(--ui-surface-hover)]"
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-[var(--ui-text)]">{project.name}</span>
                <span className="mt-0.5 block truncate text-[10.5px] text-[var(--ui-text-secondary)]">{project.customer}</span>
              </span>
              <DashboardBadge tone={projectStageBadgeTone(project.stage)} className="justify-center">
                {projectStageBadgeLabel(project.stage)}
              </DashboardBadge>
              <span className="truncate text-right text-[10.5px] text-[var(--ui-text-muted)]">{project.handoffLabel}</span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ProjectStageChart({ projects }: { projects: DashboardProjectHandoff[] }) {
  if (projects.length === 0) {
    return <EmptyPanelState title="Inga projekt" body="Accepterade offerter utan projekt hamnar här." />;
  }

  const rows = PROJECT_STAGE_CONFIG.map((cfg) => {
    const inStage = projects.filter((p) => p.stage === cfg.id);
    const totalValue = inStage.reduce((s, p) => s + p.value, 0);
    return { ...cfg, count: inStage.length, value: totalValue, projects: inStage };
  }).filter((r) => r.count > 0);

  const maxValue = Math.max(...rows.map((r) => r.value), 1);
  const totalValue = rows.reduce((s, r) => s + r.value, 0);

  return (
    <div className="flex flex-1 flex-col px-3.5 py-3">
      <div className="flex flex-1 flex-col justify-center gap-2 overflow-y-auto">
        {rows.map((row, i) => (
          <Link
            key={row.id}
            href={`/projekt?stage=${PROJECT_STAGE_QUERY[row.id] ?? row.id}`}
            className="grid grid-cols-[80px_minmax(0,1fr)_56px] items-center gap-2.5 rounded-md transition-colors hover:bg-[var(--ui-surface-hover)]"
          >
            <span className="truncate pl-0.5 text-[11px] font-medium text-[var(--ui-text-secondary)]">{row.label}</span>
            <div className="relative h-[28px] overflow-hidden rounded-md bg-[var(--ui-surface-subtle)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(row.value / maxValue) * 100}%` }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.06 }}
                className="absolute inset-y-0 left-0 rounded-md"
                style={{ backgroundColor: row.color, opacity: 0.85 }}
              />
              <span className="absolute inset-0 flex items-center px-2.5">
                <span className="relative z-10 text-[11px] font-semibold text-[var(--ui-text-inverse)]">
                  {row.count} projekt
                </span>
              </span>
            </div>
            <span className="text-right text-[10.5px] font-semibold tabular-nums text-[var(--ui-text-secondary)]">
              {fmtCompactSEK(row.value)}
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-auto border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] pt-2.5">
        <p className="text-[10.5px] text-[var(--ui-text-muted)]">
          Totalt projektvärde{' '}
          <strong className="font-semibold text-[var(--ui-text)]">{fmtCompactSEK(totalValue)}</strong>
        </p>
      </div>
    </div>
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
  const [view, setView] = useState<'feed' | 'fokus'>('feed');

  return (
    <Panel
      title="Senaste aktivitet"
      eyebrow="Live från erbjudanden"
      action={
        <div className="flex items-center gap-1">
          {(['feed', 'fokus'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                'rounded px-2 py-1 text-[11px] font-semibold transition-colors',
                view === v
                  ? 'bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
                  : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-secondary)]',
              )}
            >
              {v === 'feed' ? 'Feed' : 'Fokus'}
            </button>
          ))}
          <Bell size={16} strokeWidth={1.75} className="ml-1 text-[var(--ui-text-muted)]" />
        </div>
      }
      className="xl:col-span-4"
    >
      {view === 'fokus' ? (
        <ActivityFokusDiagram focusMetrics={focusMetrics} acceptanceRate={acceptanceRate} />
      ) : items.length === 0 ? (
        <EmptyPanelState title="Ingen aktivitet ännu" body="Skapade, skickade, visade och accepterade offerter visas här." />
      ) : (
        <div className="min-h-0 flex-1 divide-y divide-[var(--cockpit-divider,var(--cockpit-border-soft))] overflow-hidden">
          {items.slice(0, 5).map((item) => {
            const content = (
              <span className="grid h-[42px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-3.5 transition-colors hover:bg-[var(--ui-surface-hover)]">
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full border', toneClasses(item.tone))}>
                  {item.tone === 'success' ? <CheckCircle size={13} strokeWidth={2} />
                  : item.tone === 'accent'  ? <Send size={13} strokeWidth={2} />
                  : item.tone === 'info'    ? <Eye size={13} strokeWidth={1.75} />
                  : item.label.toLowerCase().includes('projekt') ? <Folder size={13} strokeWidth={1.75} />
                  : <Receipt size={13} strokeWidth={1.75} />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-[var(--ui-text)]">{item.label}</span>
                  <span className="mt-0.5 block truncate text-[10.5px] text-[var(--ui-text-secondary)]">{item.detail}</span>
                </span>
                <span className="text-[10.5px] text-[var(--ui-text-muted)]">{fmtRelativeDate(item.occurredAt)}</span>
              </span>
            );
            return item.href ? <Link key={item.id} href={item.href}>{content}</Link> : <div key={item.id}>{content}</div>;
          })}
        </div>
      )}
    </Panel>
  );
}

function ActivityFokusDiagram({
  focusMetrics,
  acceptanceRate,
}: {
  focusMetrics: DashboardFocusMetrics;
  acceptanceRate: number | null;
}) {
  const metrics = [
    { label: 'Förfallna', value: focusMetrics.overdue, color: 'var(--ui-danger-text)', href: '/offerter' },
    { label: 'Förfaller snart', value: focusMetrics.dueSoon, color: 'var(--ui-warning-text)', href: '/offerter' },
    { label: 'Saknar uppföljning', value: focusMetrics.missingFollowUp, color: 'var(--ui-accent)', href: '/offerter' },
    { label: 'Möten idag', value: focusMetrics.meetingsToday, color: 'var(--ui-info-text)', href: '/meetings' },
  ];
  const maxVal = Math.max(...metrics.map((m) => m.value), 1);

  return (
    <div className="flex flex-1 flex-col px-3.5 py-3">
      <div className="flex flex-1 flex-col justify-center gap-2.5 overflow-y-auto">
        {metrics.map((m, i) => (
          <Link
            key={m.label}
            href={m.href}
            className="grid grid-cols-[120px_minmax(0,1fr)_28px] items-center gap-2.5 rounded-md transition-colors hover:bg-[var(--ui-surface-hover)]"
          >
            <span className="truncate pl-0.5 text-[11px] font-medium text-[var(--ui-text-secondary)]">{m.label}</span>
            <div className="relative h-[28px] overflow-hidden rounded-md bg-[var(--ui-surface-subtle)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(m.value / maxVal) * 100}%` }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.06 }}
                className="absolute inset-y-0 left-0 rounded-md"
                style={{ backgroundColor: m.color, opacity: m.value === 0 ? 0 : 0.82 }}
              />
            </div>
            <span className={cn(
              'text-right text-sm font-bold tabular-nums',
              m.value === 0 ? 'text-[var(--ui-text-muted)]' : 'text-[var(--ui-text)]',
            )}>
              {m.value}
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-auto border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] pt-2.5">
        <p className="text-[10.5px] text-[var(--ui-text-muted)]">
          Vinstgrad{' '}
          <strong className="font-semibold text-[var(--ui-text)]">
            {acceptanceRate !== null ? `${acceptanceRate}%` : '–'}
          </strong>
          {' '}på avslutade offerter
        </p>
      </div>
    </div>
  );
}

