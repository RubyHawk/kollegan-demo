import { create } from 'zustand';

interface CinematicStore {
  pending: boolean;
  arm: () => void;
  clear: () => void;
}

export const useCinematic = create<CinematicStore>((set) => ({
  pending: false,
  arm: () => set({ pending: true }),
  clear: () => set({ pending: false }),
}));
