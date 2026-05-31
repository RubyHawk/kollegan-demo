import { create } from 'zustand';
import { countProjects, listProjects } from '@shared/lib/api/projects.api';
import type { Project, ProjectStage } from './types';

const EMPTY_COUNTS: Record<ProjectStage, number> = {
  details: 0,
  ordered: 0,
  arrived: 0,
  in_progress: 0,
  completed: 0,
};
const PAGE_SIZE = 50;

interface ProjectsListState {
  projects: Project[];
  total: number;
  counts: Record<ProjectStage, number>;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  searchInput: string;
  search: string;
  stageFilter: ProjectStage | 'all';

  setSearchInput: (value: string) => void;
  setSearch: (value: string) => void;
  setStageFilter: (stage: ProjectStage | 'all') => void;
  setError: (error: string | null) => void;
  moveProjectLocally: (projectId: string, stage: ProjectStage) => void;

  load: (silent?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  loadCounts: () => Promise<void>;
}

export const useProjectsListStore = create<ProjectsListState>()((set, get) => ({
  projects: [],
  total: 0,
  counts: { ...EMPTY_COUNTS },
  loading: true,
  loadingMore: false,
  error: null,
  searchInput: '',
  search: '',
  stageFilter: 'all',

  setSearchInput: (searchInput) => set({ searchInput }),
  setSearch: (search) => set({ search }),
  setStageFilter: (stageFilter) => set({ stageFilter }),
  setError: (error) => set({ error }),
  moveProjectLocally: (projectId, stage) => set((state) => ({
    projects: state.projects.map((project) => project.id === projectId ? { ...project, stage } : project),
  })),

  load: async (silent = false) => {
    const state = get();
    if (!silent) set({ loading: true });
    set({ error: null });
    try {
      const result = await listProjects({
        limit: PAGE_SIZE,
        offset: 0,
        stage: state.stageFilter !== 'all' ? state.stageFilter : undefined,
        search: state.search.trim() || undefined,
      });
      set({ projects: result.projects, total: result.total });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const state = get();
    if (state.loadingMore || state.projects.length >= state.total) return;
    set({ loadingMore: true, error: null });
    try {
      const result = await listProjects({
        limit: PAGE_SIZE,
        offset: state.projects.length,
        stage: state.stageFilter !== 'all' ? state.stageFilter : undefined,
        search: state.search.trim() || undefined,
      });
      set((current) => {
        const seen = new Set(current.projects.map((project) => project.id));
        const nextProjects = result.projects.filter((project) => !seen.has(project.id));
        return {
          projects: [...current.projects, ...nextProjects],
          total: result.total,
        };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loadingMore: false });
    }
  },

  loadCounts: async () => {
    const state = get();
    try {
      const counts = await countProjects({ search: state.search.trim() || undefined });
      set({ counts: { ...EMPTY_COUNTS, ...counts } });
    } catch {
      // Counts are supporting UI only.
    }
  },
}));
