import { Activity } from 'lucide-react';
import { KpiStrip, type KpiStripItem } from '@shared/ui/kpi-strip';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';

const kpis: KpiStripItem[] = [
  { id: 'calls', label: 'Samtal totalt', value: '1 284', trend: '+12%', tone: 'success', detail: 'vs förra månaden' },
  { id: 'bookings', label: 'Bokningar', value: '347', trend: '+8%', tone: 'success', detail: 'vs förra månaden' },
  { id: 'conversion', label: 'Konverteringsgrad', value: '27%', trend: '+3pp', tone: 'success', detail: 'vs förra månaden' },
  { id: 'duration', label: 'Avg. samtalstid', value: '2m 14s', trend: '-4%', tone: 'danger', detail: 'vs förra månaden' },
];

const channels = [
  { label: 'Röstsamtal', pct: 58, className: 'bg-[var(--ui-accent)]' },
  { label: 'Webbformulär', pct: 24, className: 'bg-[var(--ui-info-text)]' },
  { label: 'Manuellt', pct: 11, className: 'bg-[var(--ui-warning-text)]' },
  { label: 'Remiss', pct: 7, className: 'bg-[var(--ui-success-text)]' },
];

const months = ['Sep', 'Okt', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const bars = [42, 58, 51, 73, 65, 88, 94];
const maxBar = Math.max(...bars);

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ui-text)]">Analytics</h1>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
            Nyckeltal, trender och kanaldistribution - senaste 30 dagarna.
          </p>
        </div>
        <StatusBadge tone="warning">Demo-data</StatusBadge>
      </div>

      <KpiStrip items={kpis} density="comfortable" />

      <Panel padding="lg">
        <h2 className="text-sm font-semibold text-[var(--ui-text)]">Aktivitetstrend</h2>
        <p className="mt-1 text-xs text-[var(--ui-text-muted)]">Antal samtal per månad</p>
        <div className="mt-6 flex h-40 items-end gap-3">
          {bars.map((height, index) => (
            <div key={months[index]} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="group relative w-full rounded-t-[var(--ui-radius-md)] bg-[var(--ui-accent-subtle)] transition-colors hover:bg-[var(--ui-surface-selected)]"
                style={{ height: `${(height / maxBar) * 130}px` }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-[var(--ui-radius-md)] bg-[var(--ui-accent)]"
                  style={{ height: `${(height / maxBar) * 80}%` }}
                />
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-[var(--ui-text-muted)] opacity-0 transition-opacity group-hover:opacity-100">
                  {height} samtal
                </span>
              </div>
              <span className="text-[10px] text-[var(--ui-text-muted)]">{months[index]}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Panel padding="lg">
          <h2 className="mb-4 text-sm font-semibold text-[var(--ui-text)]">Kanaldistribution</h2>
          <div className="space-y-3">
            {channels.map((channel) => (
              <div key={channel.label}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--ui-text-secondary)]">{channel.label}</span>
                  <span className="text-xs font-semibold text-[var(--ui-text)]">{channel.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--ui-surface-subtle)]">
                  <div className={`h-2 rounded-full ${channel.className}`} style={{ width: `${channel.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel padding="lg" className="flex min-h-[220px] flex-col items-center justify-center gap-3 border-dashed text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[var(--ui-accent)]">
            <Activity aria-hidden="true" size={20} strokeWidth={1.75} />
          </div>
          <p className="text-sm font-semibold text-[var(--ui-text)]">Djupare analys</p>
          <p className="max-w-xs text-xs leading-relaxed text-[var(--ui-text-muted)]">
            Kohortanalys, trattvisualisering och AI-genererade insikter kommer i nästa version.
          </p>
        </Panel>
      </div>
    </div>
  );
}
