import { create } from 'zustand';
import { getProfile } from '@shared/lib/api/auth-account.api';
import {
  createTimeEntry,
  deleteTimeEntry,
  listTimeEntries,
  updateTimeEntry,
  type CreateTimeEntryPayload,
  type TimeEntry,
  type UpdateTimeEntryPatch,
} from '@shared/lib/api/time-entries.api';

interface ProjectTimeState {
  entries: TimeEntry[];
  currentUserId: string | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  setError: (error: string | null) => void;
  loadEntries: (projectId: string) => Promise<void>;
  saveEntry: (
    projectId: string,
    payload: CreateTimeEntryPayload | UpdateTimeEntryPatch,
    entryId?: string,
  ) => Promise<void>;
  deleteEntry: (projectId: string, entryId: string) => Promise<void>;
}

/**
 * Time entries for a single project detail page.
 *
 * Own-vs-others edit rights: we surface the current user's id (from the profile
 * endpoint) so the UI can offer edit/delete on their own rows. Admins may edit
 * any row — that is enforced server-side, so a 403 from a non-owner edit is
 * surfaced as an error rather than being predicted client-side.
 */
export const useProjectTimeStore = create<ProjectTimeState>()((set, get) => ({
  entries: [],
  currentUserId: null,
  loading: true,
  saving: false,
  error: null,

  setError: (error) => set({ error }),

  loadEntries: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const [entries, profile] = await Promise.all([
        listTimeEntries({ projectId }),
        get().currentUserId ? Promise.resolve(null) : getProfile().catch(() => null),
      ]);
      const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      set((state) => ({
        entries: sorted,
        currentUserId: profile?.id ?? state.currentUserId,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  saveEntry: async (projectId, payload, entryId) => {
    set({ saving: true, error: null });
    try {
      if (entryId) {
        await updateTimeEntry(entryId, payload as UpdateTimeEntryPatch);
      } else {
        await createTimeEntry({ ...(payload as CreateTimeEntryPayload), projectId });
      }
      await get().loadEntries(projectId);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  deleteEntry: async (projectId, entryId) => {
    set({ saving: true, error: null });
    try {
      await deleteTimeEntry(entryId);
      await get().loadEntries(projectId);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ saving: false });
    }
  },
}));
