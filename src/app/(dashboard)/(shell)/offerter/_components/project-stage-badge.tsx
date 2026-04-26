import Link from 'next/link';
import type { Offer } from '../_store/types';
import { PROJECT_STAGE_META } from '../_lib/offers-dashboard-constants';

export function ProjectStageBadge({ offer }: { offer: Offer }) {
  if (offer.status !== 'accepted') return null;
  const project = offer.project;

  if (!project) {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" />
        Projekt saknas
      </span>
    );
  }

  const meta = PROJECT_STAGE_META[project.stage];
  const label = project.stage === 'completed' ? 'Projekt klart' : `Projekt: ${meta.label}`;

  return (
    <Link
      href={`/projekt/${project.id}`}
      className="inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors hover:bg-[var(--surface-hover)]"
      style={{ background: meta.bg, color: meta.color, borderColor: `color-mix(in srgb, ${meta.color} 32%, var(--border))` }}
      title="Öppna projektet"
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {label}
    </Link>
  );
}
