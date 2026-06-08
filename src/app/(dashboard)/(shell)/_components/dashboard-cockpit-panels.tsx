'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle,
  EllipsisVertical,
  Folder,
  Phone,
  Send,
} from 'lucide-react';
import type {
  DashboardActionItem,
  DashboardOfferTableRow,
} from '@modules/generic/dashboard';
import { cn } from '@shared/lib/utils';
import { DashboardBadge, DashboardDotLabel, EmptyPanelState, Panel } from './dashboard-cockpit-primitives';
import { fmtCompactSEK } from './dashboard-cockpit-utils';

// ── ActionQueue ───────────────────────────────────────────────────────────────

export function ActionQueue({ items }: { items: DashboardActionItem[] }) {

  return (
    <Panel
      title="Kräver handling"
      eyebrow={`${items.length} prioriterade åtgärder`}
      action={<EllipsisVertical size={16} strokeWidth={2} className="text-[var(--ui-text-muted)]" />}
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
          <Link
            href="/offerter"
            className="flex h-9 shrink-0 items-center justify-center border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] text-[11.5px] font-semibold text-[var(--ui-accent)] hover:underline"
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
  if (actionLabel === 'Ring nu') return { Icon: Phone, word: 'Ring' };
  if (actionLabel === 'Följ upp') return { Icon: Send, word: 'Följ upp' };
  if (actionLabel === 'Förläng') return { Icon: Calendar, word: 'Förläng' };
  if (actionLabel === 'Redo för projekt') return { Icon: Folder, word: 'Projekt' };
  if (actionLabel === 'Skicka offert') return { Icon: Send, word: 'Skicka' };
  return { Icon: CheckCircle, word: 'Åtgärda' };
}

function ctaBtnClass(tone: DashboardActionItem['tone']): string {
  if (tone === 'danger') return 'bg-[var(--ui-danger-bg)] text-[var(--ui-danger-text)]';
  if (tone === 'warning') return 'bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)]';
  if (tone === 'info') return 'bg-[var(--ui-info-bg)] text-[var(--ui-info-text)]';
  return 'bg-[var(--ui-surface-subtle)] text-[var(--ui-text-muted)]';
}

const TONE_CHIP_LABELS: Record<DashboardActionItem['tone'], string> = {
  danger: 'Kritisk',
  warning: 'Varning',
  info: 'Info',
  neutral: 'Normal',
};

const TONE_CHIP_CLASSES: Record<DashboardActionItem['tone'], string> = {
  danger: 'bg-[var(--ui-danger-bg)] text-[var(--ui-danger-text)]',
  warning: 'bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)]',
  info: 'bg-[var(--ui-info-bg)] text-[var(--ui-info-text)]',
  neutral: 'bg-[var(--ui-surface-subtle)] text-[var(--ui-text-muted)]',
};

function ActionQueueRow({ item }: { item: DashboardActionItem }) {
  const { Icon, word } = ctaConfig(item.actionLabel);
  return (
    <Link
      href={item.href}
      className="grid min-h-[58px] grid-cols-[6px_minmax(0,1fr)_auto] items-stretch gap-3 pr-3.5 transition-colors hover:bg-[var(--ui-surface-hover)]"
    >
      <span className={cn('rounded-r-sm', priorityRailClass(item.tone))} />
      <span className="flex min-w-0 flex-col justify-center py-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={cn('shrink-0 rounded px-1.5 py-px text-[9.5px] font-bold leading-4', TONE_CHIP_CLASSES[item.tone])}>
            {TONE_CHIP_LABELS[item.tone]}
          </span>
          <span className="block truncate text-xs font-semibold text-[var(--ui-text)]">{item.label}</span>
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-[var(--ui-text-muted)]">{item.detail}</span>
      </span>
      <span className="flex items-center">
        <span className={cn('inline-flex h-8 w-[72px] items-center justify-center gap-1.5 rounded-md text-[11.5px] font-semibold', ctaBtnClass(item.tone))}>
          <Icon size={12} strokeWidth={2} />
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
          <div className="flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-hidden">
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
                      ? 'border-[var(--ui-accent)] font-semibold text-[var(--ui-accent)]'
                      : 'border-transparent text-[var(--ui-text-secondary)] hover:text-[var(--ui-text)]',
                  )}
                >
                  {label}
                  <span className={cn(
                    'flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-semibold',
                    tab === key
                      ? 'bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
                      : 'bg-[var(--ui-surface-subtle)] text-[var(--ui-text-muted)]',
                  )}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
            {/* Column headers */}
            <div className="grid h-8 min-w-[650px] grid-cols-[108px_minmax(180px,1fr)_100px_122px_124px] items-center border-b border-[var(--cockpit-divider,var(--cockpit-border-soft))] bg-[var(--ui-surface)] px-3.5 text-[9.5px] font-semibold uppercase text-[var(--ui-text-muted)]">
              <span>Status</span>
              <span>Kund</span>
              <span>Belopp</span>
              <span>Deadline</span>
              <span>Nästa steg</span>
            </div>
            {/* Rows — flex-1 so rows fill the available panel height */}
            <div className="flex flex-1 flex-col divide-y divide-[var(--cockpit-divider,var(--cockpit-border-soft))]">
              {displayRows.map((row) => (
                <Link
                  key={row.id}
                  href={row.href}
                  className="grid flex-1 min-h-[41px] min-w-[650px] grid-cols-[108px_minmax(180px,1fr)_100px_122px_124px] items-center px-3.5 transition-colors hover:bg-[var(--ui-surface-hover)]"
                >
                  <span className="min-w-0 pr-3">
                    <DashboardDotLabel tone={statusTone(row.status)}>{row.statusLabel}</DashboardDotLabel>
                  </span>
                  <span className="min-w-0 pr-3">
                    <span className="block truncate text-xs font-semibold leading-4 text-[var(--ui-text)]">{row.displayCustomerName}</span>
                    <span className="block truncate text-[10.5px] leading-3 text-[var(--ui-text-muted)]">{row.displaySubtitle}</span>
                  </span>
                  <span className="whitespace-nowrap pr-3 text-xs font-semibold tabular-nums text-[var(--ui-text)]">{row.displayAmount}</span>
                  <span className="min-w-0 pr-3">
                    {row.displayRiskLabel ? (
                      <DashboardBadge tone={row.deadlineTone}>{row.displayRiskLabel}</DashboardBadge>
                    ) : null}
                  </span>
                  <span className="truncate text-xs text-[var(--ui-text-secondary)]">{row.displayNextAction}</span>
                </Link>
              ))}
            </div>
          </div>
          {/* Footer — outside the scroll area so it stays pinned at panel bottom */}
          <Link
            href="/offerter"
            className="flex h-9 shrink-0 items-center justify-center border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] text-[11.5px] font-semibold text-[var(--ui-accent)] hover:underline"
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
            ? 'bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
            : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-secondary)]',
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
            ? 'bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
            : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-secondary)]',
        )}
      >
        Diagram
      </button>
      <EllipsisVertical size={16} strokeWidth={2} className="ml-1 text-[var(--ui-text-muted)]" />
    </div>
  );
}

// ── OfferDiagram ──────────────────────────────────────────────────────────────

const SWEDISH_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

const OFFER_STATUS_CONFIG = [
  { status: 'accepted', label: 'Accepterad', color: 'var(--ui-success-text)' },
  { status: 'viewed', label: 'Förhandling', color: 'var(--ui-info-text)' },
  { status: 'sent', label: 'Skickad', color: 'var(--ui-accent)' },
  { status: 'draft', label: 'Utkast', color: 'var(--ui-text-muted)' },
] as const;

function OfferDiagram({ rows }: { rows: DashboardOfferTableRow[] }) {
  const groups = OFFER_STATUS_CONFIG.map((cfg) => {
    const inStatus = rows.filter((r) => r.status === cfg.status);
    return { ...cfg, count: inStatus.length, total: inStatus.reduce((s, r) => s + r.amount, 0) };
  }).filter((g) => g.count > 0);

  const maxTotal = Math.max(...groups.map((g) => g.total), 1);
  const grandTotal = rows.reduce((s, r) => s + r.amount, 0);
  const now = new Date();
  const monthLabel = `${SWEDISH_MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-3.5 py-3">
      <p className="mb-3 text-[11px] font-medium text-[var(--ui-text-muted)]">Pipeline per status</p>
      <div className="flex flex-1 flex-col justify-center gap-3 overflow-y-auto">
        {groups.map((group, i) => {
          const pct = grandTotal > 0 ? Math.round((group.total / grandTotal) * 100) : 0;
          return (
            <div key={group.status} className="grid grid-cols-[88px_minmax(0,1fr)_116px] items-center gap-3">
              <span className="truncate text-[11.5px] font-medium text-[var(--ui-text-secondary)]">
                {group.label}
              </span>
              <div className="relative h-[32px] overflow-hidden rounded-md bg-[var(--ui-surface-subtle)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(group.total / maxTotal) * 100}%` }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.06 }}
                  className="absolute inset-y-0 left-0 rounded-md"
                  style={{ backgroundColor: group.color, opacity: 0.88 }}
                />
                {group.count > 0 && (
                  <span className="absolute inset-0 flex items-center px-2.5">
                    <span className="relative z-10 text-[11px] font-semibold text-[var(--ui-text-inverse)]">
                      {group.count} st
                    </span>
                  </span>
                )}
              </div>
              <div className="text-right text-[11.5px] tabular-nums">
                <span className="font-semibold text-[var(--ui-text-secondary)]">{fmtCompactSEK(group.total)}</span>
                {' '}
                <span className="font-normal text-[var(--ui-text-muted)]">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 shrink-0 border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] pt-2.5 text-[10.5px] text-[var(--ui-text-muted)]">
        Totalt {rows.length} offerter · {monthLabel}
      </div>
    </div>
  );
}

export { PipelinePanel } from './dashboard-cockpit-pipeline-panel';
export { ActivityFeedPanel, ProjectHandoffPanel } from './dashboard-cockpit-project-activity-panels';

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusTone(status: string): DashboardOfferTableRow['deadlineTone'] {
  if (status === 'accepted') return 'success';
  if (status === 'viewed') return 'info';
  if (status === 'sent') return 'accent';
  return 'neutral';
}

function priorityRailClass(tone: DashboardActionItem['tone']): string {
  if (tone === 'danger') return 'bg-[var(--ui-danger-text)]';
  if (tone === 'warning') return 'bg-[var(--ui-warning-text)]';
  if (tone === 'info') return 'bg-[var(--ui-info-text)]';
  return 'bg-[var(--ui-text-muted)]';
}



