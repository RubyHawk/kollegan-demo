'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarBlankIcon, MagnifyingGlassIcon, PackageIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { cn } from '@shared/lib/utils';
import { useProjectsListStore } from './_store/projects-list.store';
import {
  PROJECT_STAGE_LABELS,
  PROJECT_STAGE_QUERY,
  PROJECT_STAGES,
  QUERY_TO_STAGE,
  type Project,
  type ProjectStage,
} from './_store/types';

const STAGE_STYLE: Record<ProjectStage, string> = {
  details: 'bg-[var(--status-draft-bg)] text-[var(--status-draft-text)] border-[var(--status-draft-border)]',
  ordered: 'bg-[var(--status-sent-bg)] text-[var(--status-sent-text)] border-transparent',
  arrived: 'bg-[var(--status-viewed-bg)] text-[var(--status-viewed-text)] border-transparent',
  in_progress: 'bg-[var(--status-accepted-bg)] text-[var(--status-accepted-text)] border-transparent',
  completed: 'bg-[var(--surface-alt)] text-[var(--text-muted)] border-[var(--border)]',
};

function fmtSEK(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(value);
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function poSummary(project: Project) {
  const orders = project.purchaseOrders ?? [];
  const activeOrders = orders.filter((po) => po.status !== 'cancelled');
  if (!activeOrders.length) return { text: 'Ingen inköpsorder', blocked: project.stage === 'details' || project.stage === 'ordered' };
  if (activeOrders.some((po) => po.status === 'draft')) return { text: 'Utkast till inköpsorder', blocked: project.stage === 'details' };
  if (activeOrders.every((po) => po.status === 'received')) return { text: 'Material ankommet', blocked: false };
  return { text: 'Inköpsorder skickad', blocked: project.stage === 'ordered' };
}

function stageBlocker(project: Project) {
  const summary = poSummary(project);
  if (summary.blocked && project.stage === 'details') return 'Skapa och skicka inköpsorder';
  if (summary.blocked && project.stage === 'ordered') return 'Registrera leverans';
  return null;
}

function ProjectCard({ project }: { project: Project }) {
  const blocker = stageBlocker(project);
  const summary = poSummary(project);
  const installDate = fmtDate(project.wishedInstallDate);
  const customer = project.customer;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <Link
        href={`/projekt/${project.id}`}
        className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-colors hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{project.name}</p>
            <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
              {customer?.company || customer?.name || 'Kund saknas'}
            </p>
          </div>
          <Badge className={cn('shrink-0 border', STAGE_STYLE[project.stage])}>{PROJECT_STAGE_LABELS[project.stage]}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-[var(--surface-alt)] px-3 py-2">
            <p className="text-[var(--text-muted)]">Värde</p>
            <p className="mt-0.5 font-semibold text-[var(--text-primary)]">{fmtSEK(project.totalIncVat)}</p>
          </div>
          <div className="rounded-lg bg-[var(--surface-alt)] px-3 py-2">
            <p className="text-[var(--text-muted)]">Rader</p>
            <p className="mt-0.5 font-semibold text-[var(--text-primary)]">{project.lineItems?.length ?? 0}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <PackageIcon size={14} />
            <span className="truncate">{summary.text}</span>
          </div>
          {installDate && (
            <div className="flex items-center gap-2">
              <CalendarBlankIcon size={14} />
              <span>{installDate}</span>
            </div>
          )}
          {blocker && (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-1.5 text-[var(--text-primary)]">
              <WarningCircleIcon size={14} />
              <span className="truncate">{blocker}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function ProjectsBoardPage() {
  const searchParams = useSearchParams();
  const stageQuery = searchParams.get('stage') ?? '';
  const projects = useProjectsListStore((s) => s.projects);
  const total = useProjectsListStore((s) => s.total);
  const counts = useProjectsListStore((s) => s.counts);
  const loading = useProjectsListStore((s) => s.loading);
  const error = useProjectsListStore((s) => s.error);
  const searchInput = useProjectsListStore((s) => s.searchInput);
  const search = useProjectsListStore((s) => s.search);
  const stageFilter = useProjectsListStore((s) => s.stageFilter);
  const setSearchInput = useProjectsListStore((s) => s.setSearchInput);
  const setSearch = useProjectsListStore((s) => s.setSearch);
  const setStageFilter = useProjectsListStore((s) => s.setStageFilter);
  const setError = useProjectsListStore((s) => s.setError);
  const load = useProjectsListStore((s) => s.load);
  const loadCounts = useProjectsListStore((s) => s.loadCounts);

  useEffect(() => {
    const stage = stageQuery ? QUERY_TO_STAGE[stageQuery] ?? 'all' : 'all';
    setStageFilter(stage);
  }, [stageQuery, setStageFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput), 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput, setSearch]);

  useEffect(() => {
    void load();
    void loadCounts();
  }, [load, loadCounts, search, stageFilter]);

  const visibleStages = stageFilter === 'all' ? PROJECT_STAGES : [stageFilter];
  const projectsByStage = useMemo(() => {
    const grouped = new Map<ProjectStage, Project[]>();
    for (const stage of PROJECT_STAGES) grouped.set(stage, []);
    for (const project of projects) grouped.get(project.stage)?.push(project);
    return grouped;
  }, [projects]);

  return (
    <div className="mx-auto max-w-[1520px] space-y-8 px-8 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Projekt</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Installationer från accepterad offert till klart jobb.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">{total}</span>
          projekt
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Sök projekt, kund eller företag"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant={stageFilter === 'all' ? 'default' : 'outline'} size="sm">
            <Link href="/projekt">Alla</Link>
          </Button>
          {PROJECT_STAGES.map((stage) => (
            <Button key={stage} asChild variant={stageFilter === stage ? 'default' : 'outline'} size="sm">
              <Link href={`/projekt?stage=${PROJECT_STAGE_QUERY[stage]}`}>
                {PROJECT_STAGE_LABELS[stage]}
                <span className="ml-1 text-xs opacity-70">{counts[stage]}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm text-[var(--text-primary)]">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>Stäng</Button>
        </div>
      )}

      {loading ? (
        <div className="grid min-h-[420px] place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
        </div>
      ) : projects.length === 0 ? (
        <div className="grid min-h-[420px] place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 text-center">
          <div>
            <p className="text-base font-semibold text-[var(--text-primary)]">Inga projekt än</p>
            <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">När en kund accepterar en offert skapas projektet automatiskt här.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-5">
          {visibleStages.map((stage) => {
            const columnProjects = projectsByStage.get(stage) ?? [];
            return (
              <section key={stage} className="min-h-[520px] rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)]">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full border', STAGE_STYLE[stage])} />
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">{PROJECT_STAGE_LABELS[stage]}</h2>
                  </div>
                  <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                    {counts[stage]}
                  </span>
                </div>
                <div className="space-y-3 p-3">
                  <AnimatePresence initial={false}>
                    {columnProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </AnimatePresence>
                  {columnProjects.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-8 text-center text-xs text-[var(--text-muted)]">
                      Inga projekt i {PROJECT_STAGE_LABELS[stage].toLowerCase()}.
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
