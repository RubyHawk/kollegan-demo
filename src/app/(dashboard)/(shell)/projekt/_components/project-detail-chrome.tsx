'use client';

import type React from 'react';
import { CheckCircleIcon, PlusIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { cn } from '@shared/lib/utils';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card, CardContent } from '@shared/ui/card';
import { STAGE_STYLE } from '../_lib/project-display';
import { PROJECT_STAGE_LABELS, PROJECT_STAGES, type Project, type ProjectStage } from '../_store/types';

const STEP_STATE_COPY = {
  done: 'Klart',
  current: 'Nuvarande steg',
  upcoming: 'Kommande',
} as const;

export type StageGate = {
  target: ProjectStage | null;
  allowed: boolean;
  reason: string | null;
};

export function StageStepper({ project }: { project: Project }) {
  const currentIndex = PROJECT_STAGES.indexOf(project.stage);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {PROJECT_STAGE_LABELS[project.stage]}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            Steg {currentIndex + 1} av {PROJECT_STAGES.length}
          </span>
        </div>
        <div className="flex gap-1">
          {PROJECT_STAGES.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                index <= currentIndex ? 'bg-[var(--accent)]' : 'bg-[var(--surface-alt)]',
              )}
            />
          ))}
        </div>
      </div>

      <div className="hidden sm:block">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Projektstatus</p>
            <p className="text-xs text-[var(--text-muted)]">Steg {currentIndex + 1} av {PROJECT_STAGES.length}</p>
          </div>
          <Badge className={cn('border', STAGE_STYLE[project.stage])}>{PROJECT_STAGE_LABELS[project.stage]}</Badge>
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
                  'min-w-0 rounded-xl border px-3 py-3',
                  complete && 'border-[var(--accent-border)] bg-[var(--accent-subtle)]',
                  current && 'border-[var(--accent-border)] bg-[var(--surface)] shadow-sm',
                  !complete && !current && 'border-[var(--border)] bg-[var(--surface-alt)]',
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold',
                      complete && 'border-[var(--accent)] bg-[var(--accent)] text-white',
                      current && 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]',
                      !complete && !current && 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-muted)]',
                    )}
                  >
                    {complete ? <CheckCircleIcon size={14} weight="fill" /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      'truncate text-xs font-semibold',
                      current ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
                    )}
                  >
                    {PROJECT_STAGE_LABELS[stage]}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-[var(--text-muted)]">{stepState}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--surface-alt)] px-3 py-3">
      <p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p>
      <div className="mt-1 text-sm text-[var(--text-primary)]">{value || 'Ej satt'}</div>
    </div>
  );
}

export function DetailStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
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
      <Card className="border-[var(--accent-border)] bg-[var(--accent-subtle)]">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{'N\u00E4sta steg'}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {'Skapa och skicka en ink\u00F6psorder f\u00F6r att best\u00E4lla material fr\u00E5n leverant\u00F6r.'}
          </p>
          <Button className="mt-3 w-full" size="sm" onClick={onPoOpen}>
            <PlusIcon />
            {'Skapa ink\u00F6psorder'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (gate.reason && !gate.allowed) {
    return (
      <Card className="border-[var(--border)]">
        <CardContent className="p-4">
          <div className="flex items-start gap-2 text-sm">
            <WarningCircleIcon size={15} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
            <p className="text-[var(--text-secondary)]">{gate.reason}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gate.allowed && gate.target) {
    return (
      <Card className="border-[var(--border)]">
        <CardContent className="p-4 text-sm text-[var(--text-secondary)]">
          {'Projektet \u00E4r redo att g\u00E5 vidare till '}
          <span className="font-semibold text-[var(--text-primary)]">{PROJECT_STAGE_LABELS[gate.target]}</span>.
        </CardContent>
      </Card>
    );
  }

  return null;
}
