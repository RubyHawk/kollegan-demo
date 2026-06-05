/**
 * Custom-fields settings store.
 *
 * Small CRUD-over-tabs screen: holds the active entity-type tab, the loaded
 * definitions for that tab, and load/error state. Async loading lives here so
 * the container just calls `load(entityType)`. Mutations are handled in the
 * container (with toasts) and pushed back via the setters below.
 */

import { create } from 'zustand';
import { listCustomFields } from '@shared/lib/api/custom-fields.api';
import type {
  CustomFieldDefinition,
  CustomFieldEntityType,
} from '../_types';

interface CustomFieldsState {
  activeTab: CustomFieldEntityType;
  definitions: CustomFieldDefinition[];
  loading: boolean;
  error: string | null;

  setActiveTab: (tab: CustomFieldEntityType) => void;
  load: (entityType: CustomFieldEntityType) => Promise<void>;

  upsertDefinition: (definition: CustomFieldDefinition) => void;
  removeDefinition: (id: string) => void;
}

function sortDefinitions(definitions: CustomFieldDefinition[]): CustomFieldDefinition[] {
  return [...definitions].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'sv'),
  );
}

export const useCustomFieldsStore = create<CustomFieldsState>((set, get) => ({
  activeTab: 'offer',
  definitions: [],
  loading: false,
  error: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  load: async (entityType) => {
    set({ loading: true, error: null });
    try {
      const definitions = await listCustomFields(entityType);
      // Ignore stale responses if the user switched tabs mid-flight.
      if (get().activeTab !== entityType) return;
      set({ definitions: sortDefinitions(definitions), loading: false });
    } catch (err) {
      if (get().activeTab !== entityType) return;
      const message =
        err instanceof Error ? err.message : 'Kunde inte hämta anpassade fält.';
      set({ error: message, loading: false });
    }
  },

  upsertDefinition: (definition) =>
    set((state) => {
      if (definition.entityType !== state.activeTab) return state;
      const exists = state.definitions.some((d) => d.id === definition.id);
      const next = exists
        ? state.definitions.map((d) => (d.id === definition.id ? definition : d))
        : [...state.definitions, definition];
      return { definitions: sortDefinitions(next) };
    }),

  removeDefinition: (id) =>
    set((state) => ({ definitions: state.definitions.filter((d) => d.id !== id) })),
}));
