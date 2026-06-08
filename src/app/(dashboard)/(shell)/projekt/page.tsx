'use client';

import { Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Package, Search } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { Input } from '@shared/ui/input';
import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import { Toolbar, ToolbarGroup, ToolbarSpacer } from '@shared/ui/toolbar';
import { useProjectsListStore } from './_store/projects-list.store';
import {
  PROJECT_STAGE_LABELS,
  PROJECT_STAGE_QUERY,
  PROJECT_STAGES,
  QUERY_TO_STAGE,
  type Project,
  type ProjectStage,
} from './_store/types';
import { fmtSEK, fmtDate } from './_lib/project-display';

const STAGE_TONE: Record<ProjectStage, StatusTone> = {
  details: 'neutral',
  ordered: 'info',
  arrived: 'accent',
  in_progress: 'success',
  completed: 'neutral',
};

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
        className="block rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] p-3 shadow-sm transition-[border-color,background-color,box-shadow] hover:border-[var(--ui-accent-border)] hover:bg-[var(--ui-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-5 text-[var(--ui-text)]">{project.name}</p>
            <p className="mt-1 truncate text-sm text-[var(--ui-text-secondary)]">
              {customer?.company || customer?.name || 'Kund saknas'}
            </p>
          </div>
          {project.offerNumber ? <StatusBadge tone="neutral" className="shrink-0">Offert {project.offerNumber}</StatusBadge> : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <Panel variant="subtle" padding="sm">
            <p className="text-[var(--ui-text-muted)]">Värde</p>
            <p className="mt-0.5 font-semibold text-[var(--ui-text)]">{fmtSEK(project.totalIncVat)}</p>
          </Panel>
          <Panel variant="subtle" padding="sm">
            <p className="text-[var(--ui-text-muted)]">Rader</p>
            <p className="mt-0.5 font-semibold text-[var(--ui-text)]">{project.lineItems?.length ?? 0}</p>
          </Panel>
        </div>

        <div className="mt-4 space-y-2.5 border-t border-[var(--ui-border-subtle)] pt-3 text-xs text-[var(--ui-text-secondary)]">
          <div className="flex items-center gap-2">
            <Package size={16} strokeWidth={1.75} className="shrink-0" aria-hidden />
            <span className="truncate">{summary.text}</span>
          </div>
          {installDate ? (
            <div className="flex items-center gap-2">
              <Calendar size={16} strokeWidth={1.75} className="shrink-0" aria-hidden />
              <span>{installDate}</span>
            </div>
          ) : null}
          {blocker ? (
            <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] px-2.5 py-2 text-xs font-medium text-[var(--ui-danger-text)]">
              <span className="line-clamp-2">{blocker}</span>
            </div>
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}

function ProjectsBoardPageInner() {
  const searchParams = useSearchParams();
  const stageQuery = searchParams.get('stage') ?? '';
  const projects = useProjectsListStore((s) => s.projects);
  const total = useProjectsListStore((s) => s.total);
  const counts = useProjectsListStore((s) => s.counts);
  const loading = useProjectsListStore((s) => s.loading);
  const loadingMore = useProjectsListStore((s) => s.loadingMore);
  const error = useProjectsListStore((s) => s.error);
  const searchInput = useProjectsListStore((s) => s.searchInput);
  const search = useProjectsListStore((s) => s.search);
  const stageFilter = useProjectsListStore((s) => s.stageFilter);
  const setSearchInput = useProjectsListStore((s) => s.setSearchInput);
  const setSearch = useProjectsListStore((s) => s.setSearch);
  const setStageFilter = useProjectsListStore((s) => s.setStageFilter);
  const setError = useProjectsListStore((s) => s.setError);
  const load = useProjectsListStore((s) => s.load);
  const loadMore = useProjectsListStore((s) => s.loadMore);
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

  const hasMore = total > projects.length;

  return (
    <div className="mx-auto max-w-[1520px] space-y-6 px-6 py-8 xl:px-8">
      <PageHeader
        title="Projekt"
        description="Installationer från accepterad offert till klart jobb."
        meta={<StatusBadge tone="neutral">{total} projekt</StatusBadge>}
      />

      <Toolbar>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" size={16} strokeWidth={1.75} aria-hidden />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Sök projekt, kund eller företag"
            className="pl-9"
          />
        </div>
        <ToolbarSpacer />
        <ToolbarGroup>
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
        </ToolbarGroup>
      </Toolbar>

      {error ? (
        <Panel variant="danger" className="flex items-center justify-between gap-3 text-sm">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>Stäng</Button>
        </Panel>
      ) : null}

      {hasMore && !loading ? (
        <Panel variant="subtle" className="flex flex-col gap-3 text-sm text-[var(--ui-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>Visar {projects.length} av {total} projekt.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="self-start sm:self-auto"
          >
            {loadingMore ? 'Laddar...' : 'Visa fler'}
          </Button>
        </Panel>
      ) : null}

      {loading ? (
        <Panel className="grid min-h-[420px] place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ui-border)] border-t-[var(--ui-accent)]" />
        </Panel>
      ) : projects.length === 0 ? (
        <Panel className="grid min-h-[420px] place-items-center">
          <EmptyState
            title="Inga projekt än"
            description="När en kund accepterar en offert skapas projektet automatiskt här."
            actionLabel="Skapa offert"
            onAction={() => { window.location.href = '/offerter/ny'; }}
          />
        </Panel>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {visibleStages.map((stage) => {
            const columnProjects = projectsByStage.get(stage) ?? [];
            return (
              <section key={stage} className="self-start overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)]">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-4 py-3">
                  <StatusBadge tone={STAGE_TONE[stage]}>{PROJECT_STAGE_LABELS[stage]}</StatusBadge>
                  <StatusBadge tone="neutral">{counts[stage]}</StatusBadge>
                </div>
                <div className="space-y-3 p-3">
                  <AnimatePresence initial={false}>
                    {columnProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </AnimatePresence>
                  {columnProjects.length === 0 ? (
                    <EmptyState title={`Inga projekt i ${PROJECT_STAGE_LABELS[stage].toLowerCase()}.`} className="py-6" />
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProjectsBoardPage() {
  return <Suspense><ProjectsBoardPageInner /></Suspense>;
}
