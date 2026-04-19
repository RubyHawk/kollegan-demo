import { create } from 'zustand';
import { fetchWithRefresh } from '@shared/lib/api-client';
import type { Project, ProjectStage } from './types';

const EMPTY_COUNTS: Record<ProjectStage, number> = {
  details: 0,
  ordered: 0,
  arrived: 0,
  in_progress: 0,
  completed: 0,
};

interface ProjectsListState {
  projects: Project[];
  total: number;
  counts: Record<ProjectStage, number>;
  loading: boolean;
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
  loadCounts: () => Promise<void>;
}

function problemMessage(body: string, fallback: string) {
  try {
    const json = JSON.parse(body) as { detail?: string; title?: string };
    return json.detail ?? json.title ?? fallback;
  } catch {
    return body || fallback;
  }
}

export const useProjectsListStore = create<ProjectsListState>()((set, get) => ({
  projects: [],
  total: 0,
  counts: { ...EMPTY_COUNTS },
  loading: true,
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
      const params = new URLSearchParams({ limit: '100', offset: '0' });
      if (state.stageFilter !== 'all') params.set('stage', state.stageFilter);
      if (state.search.trim()) params.set('search', state.search.trim());
      const res = await fetchWithRefresh(`/api/projekt?${params.toString()}`);
      if (!res.ok) throw new Error(problemMessage(await res.text(), `Fel ${res.status}`));
      const json = await res.json() as { data: { projects: Project[]; total: number } };
      set({ projects: json.data.projects, total: json.data.total });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  loadCounts: async () => {
    const state = get();
    try {
      const params = new URLSearchParams();
      if (state.search.trim()) params.set('search', state.search.trim());
      const res = await fetchWithRefresh(`/api/projekt/counts?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json() as { data: { counts: Record<ProjectStage, number> } };
      set({ counts: { ...EMPTY_COUNTS, ...json.data.counts } });
    } catch {
      // Counts are supporting UI only.
    }
  },
}));
