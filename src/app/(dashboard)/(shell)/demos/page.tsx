'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, CircleAlert } from 'lucide-react';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';

const hotelTags = ['Röst-AI', 'Bokningar', 'CRM', 'Realtid'];
const futureTags = ['Klinik', 'Restaurang', 'E-handel'];

export default function DemosPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--ui-text)]">Demos</h1>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
          Interaktiva AI-scenarier med live-simulerade miljöer.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => router.push('/demos/hotel')}
          className="group rounded-[var(--ui-radius-lg)] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
        >
          <Panel padding="lg" className="h-full transition-colors group-hover:border-[var(--ui-accent-border)] group-hover:bg-[var(--ui-surface-hover)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-secondary)]">
                <Building2 aria-hidden="true" size={18} strokeWidth={1.75} />
              </div>
              <StatusBadge tone="success">Live</StatusBadge>
            </div>

            <h2 className="font-semibold text-[var(--ui-text)]">Grand Hotel Soleria</h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ui-text-muted)]">
              AI-receptionist som hanterar rum, bokningar och gästfrågor i realtid via röstsamtal.
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {hotelTags.map((tag) => (
                <StatusBadge key={tag} tone="neutral">{tag}</StatusBadge>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-[var(--ui-accent)]">
              Öppna demo
              <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </Panel>
        </button>

        <Panel padding="lg" className="flex h-full flex-col justify-between border-dashed">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-muted)]">
              <CircleAlert aria-hidden="true" size={18} strokeWidth={1.75} />
            </div>
            <h2 className="font-semibold text-[var(--ui-text-secondary)]">Fler demos</h2>
            <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
              Nya branscher och AI-scenarier är på väg.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {futureTags.map((tag) => (
              <StatusBadge key={tag} tone="neutral">{tag}</StatusBadge>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
