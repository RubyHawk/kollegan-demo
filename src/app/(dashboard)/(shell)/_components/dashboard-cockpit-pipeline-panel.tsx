'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { EllipsisVertical } from 'lucide-react';
import type { DashboardPipelineOverview } from '@modules/generic/dashboard';
import { cn } from '@shared/lib/utils';
import { Panel } from './dashboard-cockpit-primitives';
import { fmtCompactSEK, fmtSEK } from './dashboard-cockpit-utils';
const PIPELINE_SHORT_LABELS: Record<string, string> = {
  draft: 'Utkast',
  sent: 'Skickad',
  viewed: 'Förhandling',
  accepted: 'Accepterad',
};

const PIPELINE_FUNNEL_COLORS: Record<string, string> = {
  draft: 'var(--ui-text-muted)',
  sent: 'var(--ui-accent)',
  viewed: 'var(--ui-info-text)',
  accepted: 'var(--ui-success-text)',
};

// ── PipelinePanel ─────────────────────────────────────────────────────────────

export function PipelinePanel({
  overview,
  acceptanceRate,
}: {
  overview: DashboardPipelineOverview;
  acceptanceRate: number | null;
}) {
  const [view, setView] = useState<'cards' | 'funnel'>('cards');

  return (
    <Panel
      title="Pipelineöversikt"
      eyebrow={`Totalt ${fmtCompactSEK(overview.totalValue)} i pipeline`}
      action={
        <div className="flex items-center gap-1">
          <PipelineViewToggle view={view} onViewChange={setView} />
          <EllipsisVertical size={16} strokeWidth={2} className="ml-1 text-[var(--ui-text-muted)]" />
        </div>
      }
      className="xl:col-span-4"
    >
      {view === 'funnel' ? (
        <PipelineFunnelView overview={overview} acceptanceRate={acceptanceRate} />
      ) : (
        <PipelineCardsView overview={overview} acceptanceRate={acceptanceRate} />
      )}
    </Panel>
  );
}

function PipelineViewToggle({
  view,
  onViewChange,
}: {
  view: 'cards' | 'funnel';
  onViewChange: (v: 'cards' | 'funnel') => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {(['cards', 'funnel'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onViewChange(v)}
          className={cn(
            'rounded px-2 py-1 text-[11px] font-semibold transition-colors',
            view === v
              ? 'bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
              : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-secondary)]',
          )}
        >
          {v === 'cards' ? 'Kort' : 'Tratt'}
        </button>
      ))}
    </div>
  );
}

function PipelineCardsView({
  overview,
  acceptanceRate,
}: {
  overview: DashboardPipelineOverview;
  acceptanceRate: number | null;
}) {
  const weighted = Math.round(overview.totalValue * 0.35);
  const conversionDisplay = acceptanceRate !== null ? `${acceptanceRate}%` : '–';

  return (
    <div className="flex flex-1 flex-col px-3.5 py-3">
      <div className="grid grid-cols-4 gap-1.5" style={{ height: 108 }}>
        {overview.stages.map((stage) => (
          <Link
            key={stage.id}
            href={`/offerter?status=${stage.id}`}
            className="flex min-w-0 flex-col justify-between rounded-md border border-[var(--cockpit-border-soft,var(--ui-border))] bg-[var(--ui-surface-raised)] px-2 py-2 transition-colors hover:bg-[var(--ui-surface-hover)]"
          >
            <span className="min-w-0">
              <span className="block truncate text-[9.5px] font-semibold uppercase text-[var(--ui-text-muted)]">{PIPELINE_SHORT_LABELS[stage.id] ?? stage.label}</span>
              <span className="mt-2 block text-[17px] font-bold tabular-nums leading-none text-[var(--ui-text)]">{stage.count}</span>
              <span className="mt-0.5 block truncate text-[10px] font-semibold tabular-nums text-[var(--ui-text-secondary)]">{fmtCompactSEK(stage.value)}</span>
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-[var(--ui-surface-subtle)]">
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: `${stage.percent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="block h-full rounded-full"
                style={{ backgroundColor: PIPELINE_FUNNEL_COLORS[stage.id] ?? 'var(--ui-accent)' }}
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
  );
}

function PipelineFunnelView({
  overview,
  acceptanceRate,
}: {
  overview: DashboardPipelineOverview;
  acceptanceRate: number | null;
}) {
  const stages = overview.stages;
  const maxValue = Math.max(...stages.map((s) => s.value), 1);
  const weighted = Math.round(overview.totalValue * 0.35);
  const conversionDisplay = acceptanceRate !== null ? `${acceptanceRate}%` : '–';

  return (
    <div className="flex flex-1 flex-col px-3.5 py-3">
      <div className="flex flex-1 flex-col justify-center gap-0.5 overflow-y-auto">
        {stages.map((stage, i) => {
          const prevStage = i > 0 ? stages[i - 1] : null;
          // Only show drop-off when count actually decreases (valid funnel step).
          // > 100% would mean more deals entered at this stage than left the previous
          // one — a data artefact, not a meaningful conversion rate.
          const convPct =
            prevStage && prevStage.count > 0 && stage.count <= prevStage.count
              ? Math.round((stage.count / prevStage.count) * 100)
              : null;
          const barPct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          const color = PIPELINE_FUNNEL_COLORS[stage.id] ?? 'var(--ui-text-muted)';

          return (
            <div key={stage.id}>
              {convPct !== null && (
                <div className="flex items-center gap-1.5 py-0.5 pl-[88px] text-[9.5px] text-[var(--ui-text-muted)]">
                  <span className="inline-block h-3 w-px bg-[var(--cockpit-divider,var(--cockpit-border-soft))]" />
                  <span>{convPct}% konverterat</span>
                </div>
              )}
              <Link
                href={`/offerter?status=${stage.id}`}
                className="grid grid-cols-[84px_minmax(0,1fr)_76px] items-center gap-2 rounded-md py-0.5 transition-colors hover:bg-[var(--ui-surface-hover)]"
              >
                <span className="truncate pl-0.5 text-[11px] font-medium text-[var(--ui-text-secondary)]">
                  {PIPELINE_SHORT_LABELS[stage.id] ?? stage.label}
                </span>
                <div className="relative h-[32px] overflow-hidden rounded-md bg-[var(--ui-surface-subtle)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barPct}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.06 }}
                    className="absolute inset-y-0 left-0 rounded-md"
                    style={{ backgroundColor: color, opacity: 0.88 }}
                  />
                  {stage.count > 0 && (
                    <span className="absolute inset-0 flex items-center px-2.5">
                      <span className="relative z-10 text-[11px] font-bold text-[var(--ui-text-inverse)]">
                        {stage.count} st
                      </span>
                    </span>
                  )}
                </div>
                <span className="text-right text-[10.5px] font-semibold tabular-nums text-[var(--ui-text-secondary)]">
                  {fmtCompactSEK(stage.value)}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
      <div className="mt-auto grid grid-cols-3 gap-3 border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] pt-2.5">
        <PipelineStat label="Vägd pipeline" value={fmtSEK(weighted)} />
        <PipelineStat label="Snittaffär" value={overview.averageWonValue > 0 ? fmtSEK(overview.averageWonValue) : '--'} />
        <PipelineStat label="Konvertering" value={conversionDisplay} />
      </div>
    </div>
  );
}

function PipelineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] text-[var(--ui-text-muted)]">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-[var(--ui-text)]">{value}</p>
    </div>
  );
}

