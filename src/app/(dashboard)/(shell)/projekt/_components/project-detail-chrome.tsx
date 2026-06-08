'use client';

import type React from 'react';
import { CheckCircle, CircleAlert, Plus } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Panel } from '@shared/ui/panel';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import { PROJECT_STAGE_LABELS, PROJECT_STAGES, type Project, type ProjectStage } from '../_store/types';

const STEP_STATE_COPY = {
  done: 'Klart',
  current: 'Nuvarande steg',
  upcoming: 'Kommande',
} as const;

const STAGE_TONE: Record<ProjectStage, StatusTone> = {
  details: 'neutral',
  ordered: 'info',
  arrived: 'accent',
  in_progress: 'success',
  completed: 'neutral',
};

export type StageGate = {
  target: ProjectStage | null;
  allowed: boolean;
  reason: string | null;
};

export function StageStepper({ project }: { project: Project }) {
  const currentIndex = PROJECT_STAGES.indexOf(project.stage);

  return (
    <Panel>
      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--ui-text)]">
            {PROJECT_STAGE_LABELS[project.stage]}
          </span>
          <span className="text-xs text-[var(--ui-text-muted)]">
            Steg {currentIndex + 1} av {PROJECT_STAGES.length}
          </span>
        </div>
        <div className="flex gap-1">
          {PROJECT_STAGES.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                index <= currentIndex ? 'bg-[var(--ui-accent)]' : 'bg-[var(--ui-surface-subtle)]',
              )}
            />
          ))}
        </div>
      </div>

      <div className="hidden sm:block">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--ui-text)]">Projektstatus</p>
            <p className="text-xs text-[var(--ui-text-muted)]">Steg {currentIndex + 1} av {PROJECT_STAGES.length}</p>
          </div>
          <StatusBadge tone={STAGE_TONE[project.stage]}>{PROJECT_STAGE_LABELS[project.stage]}</StatusBadge>
        </div>

        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
          {PROJECT_STAGES.map((stage, index) => {
            const complete = index < currentIndex;
            const current = index === currentIndex;
            const stepState = complete ? STEP_STATE_COPY.done : current ? STEP_STATE_COPY.current : STEP_STATE_COPY.upcoming;

            return (
              <div
                key={stage}
                className={cn(
                  'min-w-0 rounded-[var(--ui-radius-md)] border px-3 py-3',
                  complete && 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)]',
                  current && 'border-[var(--ui-accent-border)] bg-[var(--ui-surface)] shadow-sm',
                  !complete && !current && 'border-[var(--ui-border)] bg-[var(--ui-surface-subtle)]',
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold',
                      complete && 'border-[var(--ui-accent)] bg-[var(--ui-accent)] text-[var(--ui-text-inverse)]',
                      current && 'border-[var(--ui-accent)] bg-[var(--ui-accent-subtle)] text-[var(--ui-accent)]',
                      !complete && !current && 'border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-muted)]',
                    )}
                  >
                    {complete ? <CheckCircle size={16} strokeWidth={2} aria-hidden /> : index + 1}
                  </span>
                  <span className={cn('truncate text-xs font-semibold', current ? 'text-[var(--ui-text)]' : 'text-[var(--ui-text-secondary)]')}>
                    {PROJECT_STAGE_LABELS[stage]}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-[var(--ui-text-muted)]">{stepState}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Panel variant="subtle" padding="sm">
      <p className="text-xs font-semibold text-[var(--ui-text-muted)]">{label}</p>
      <div className="mt-1 text-sm text-[var(--ui-text)]">{value || 'Ej satt'}</div>
    </Panel>
  );
}

export function DetailStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Panel padding="sm">
      <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--ui-text)]">{value}</p>
    </Panel>
  );
}

export function ContextualNextStep({
  project,
  gate,
  onPoOpen,
}: {
  project: Project;
  gate: StageGate;
  onPoOpen: () => void;
}) {
  if (project.stage === 'completed') return null;

  if (project.stage === 'details') {
    return (
      <Panel variant="selected">
        <p className="text-sm font-semibold text-[var(--ui-text)]">Nästa steg</p>
        <p className="mt-1 text-xs text-[var(--ui-text-secondary)]">
          Skapa och skicka en inköpsorder för att beställa material från leverantör.
        </p>
        <Button className="mt-3 w-full" size="sm" onClick={onPoOpen}>
          <Plus size={16} strokeWidth={1.75} aria-hidden />
          Skapa inköpsorder
        </Button>
      </Panel>
    );
  }

  if (gate.reason && !gate.allowed) {
    return (
      <Panel>
        <div className="flex items-start gap-2 text-sm">
          <CircleAlert size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[var(--ui-text-muted)]" aria-hidden />
          <p className="text-[var(--ui-text-secondary)]">{gate.reason}</p>
        </div>
      </Panel>
    );
  }

  if (gate.allowed && gate.target) {
    return (
      <Panel className="text-sm text-[var(--ui-text-secondary)]">
        Projektet är redo att gå vidare till{' '}
        <span className="font-semibold text-[var(--ui-text)]">{PROJECT_STAGE_LABELS[gate.target]}</span>.
      </Panel>
    );
  }

  return null;
}

