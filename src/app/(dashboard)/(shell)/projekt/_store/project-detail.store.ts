import { create } from 'zustand';
import { fetchWithRefresh } from '@shared/lib/api-client';
import type {
  InstallDetailsForm,
  Project,
  ProjectLineItem,
  ProjectStage,
  PurchaseOrder,
  PurchaseOrderForm,
  PurchaseOrderFormLine,
  ReceiptLineForm,
  Supplier,
} from './types';
import { EMPTY_DETAILS_FORM } from './types';

interface ProjectDetailState {
  project: Project | null;
  suppliers: Supplier[];
  detailsDraft: InstallDetailsForm;
  poDraft: PurchaseOrderForm;
  receiptDraft: ReceiptLineForm[];
  loading: boolean;
  saving: boolean;
  acting: boolean;
  error: string | null;

  setDetailsDraft: (patch: Partial<InstallDetailsForm>) => void;
  setPoDraft: (patch: Partial<PurchaseOrderForm>) => void;
  setPoLine: (index: number, patch: Partial<PurchaseOrderFormLine>) => void;
  addPoLine: (line?: Partial<PurchaseOrderFormLine>) => void;
  removePoLine: (index: number) => void;
  setReceiptDraft: (lines: ReceiptLineForm[]) => void;
  setReceiptLine: (lineItemId: string, receivedQuantity: string) => void;
  setError: (error: string | null) => void;

  loadProject: (projectId: string) => Promise<void>;
  loadSuppliers: () => Promise<void>;
  saveDetails: () => Promise<void>;
  advanceStage: (toStage: ProjectStage) => Promise<void>;
  createPO: () => Promise<void>;
  submitPO: (poId: string) => Promise<void>;
  receivePO: (po: PurchaseOrder) => Promise<void>;
}

const emptyPoLine = (line?: Partial<ProjectLineItem | PurchaseOrderFormLine>): PurchaseOrderFormLine => ({
  projectLineItemId: 'id' in (line ?? {}) ? (line as ProjectLineItem).id ?? '' : (line as PurchaseOrderFormLine | undefined)?.projectLineItemId ?? '',
  description: (line as ProjectLineItem | undefined)?.description ?? (line as PurchaseOrderFormLine | undefined)?.description ?? '',
  quantity: String((line as ProjectLineItem | undefined)?.quantity ?? (line as PurchaseOrderFormLine | undefined)?.quantity ?? 1),
  unit: (line as ProjectLineItem | undefined)?.unit ?? (line as PurchaseOrderFormLine | undefined)?.unit ?? 'st',
  unitCost: String((line as PurchaseOrderFormLine | undefined)?.unitCost ?? ''),
  vatRate: String((line as ProjectLineItem | undefined)?.vatRate ?? (line as PurchaseOrderFormLine | undefined)?.vatRate ?? 0.25),
});

const EMPTY_PO_DRAFT: PurchaseOrderForm = {
  supplierId: '',
  supplierName: '',
  supplierEmail: '',
  supplierPhone: '',
  supplierOrgNumber: '',
  expectedDeliveryDate: '',
  notes: '',
  items: [emptyPoLine()],
};

function toDateInput(iso: string | null) {
  return iso ? iso.slice(0, 10) : '';
}

function detailsFromProject(project: Project): InstallDetailsForm {
  return {
    siteAddress: project.siteAddress ?? project.customer?.address ?? '',
    sitePostalCode: project.sitePostalCode ?? project.customer?.postalCode ?? '',
    siteCity: project.siteCity ?? project.customer?.city ?? '',
    siteCountry: project.siteCountry ?? project.customer?.country ?? 'SE',
    squareMeters: project.squareMeters === null ? '' : String(project.squareMeters),
    objectType: project.objectType ?? '',
    objectDescription: project.objectDescription ?? '',
    accessNotes: project.accessNotes ?? '',
    wishedInstallDate: toDateInput(project.wishedInstallDate),
    wishedInstallDateText: project.wishedInstallDateText ?? '',
    onsiteContactName: project.onsiteContactName ?? project.customer?.name ?? '',
    onsiteContactPhone: project.onsiteContactPhone ?? project.customer?.phone ?? '',
    onsiteContactEmail: project.onsiteContactEmail ?? project.customer?.email ?? '',
    internalNotes: project.internalNotes ?? '',
  };
}

function poDraftFromProject(project: Project): PurchaseOrderForm {
  const lines = project.lineItems?.length ? project.lineItems.map((line) => emptyPoLine(line)) : [emptyPoLine()];
  return { ...EMPTY_PO_DRAFT, items: lines };
}

function problemMessage(body: string, fallback: string) {
  try {
    const json = JSON.parse(body) as { detail?: string; title?: string };
    return json.detail ?? json.title ?? fallback;
  } catch {
    return body || fallback;
  }
}

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithRefresh(url, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(problemMessage(await res.text(), `Fel ${res.status}`));
  return res.json() as Promise<T>;
}

export const useProjectDetailStore = create<ProjectDetailState>()((set, get) => ({
  project: null,
  suppliers: [],
  detailsDraft: { ...EMPTY_DETAILS_FORM },
  poDraft: { ...EMPTY_PO_DRAFT, items: [emptyPoLine()] },
  receiptDraft: [],
  loading: true,
  saving: false,
  acting: false,
  error: null,

  setDetailsDraft: (patch) => set((state) => ({ detailsDraft: { ...state.detailsDraft, ...patch } })),
  setPoDraft: (patch) => set((state) => ({ poDraft: { ...state.poDraft, ...patch } })),
  setPoLine: (index, patch) => set((state) => ({
    poDraft: {
      ...state.poDraft,
      items: state.poDraft.items.map((line, i) => i === index ? { ...line, ...patch } : line),
    },
  })),
  addPoLine: (line) => set((state) => ({
    poDraft: { ...state.poDraft, items: [...state.poDraft.items, emptyPoLine(line)] },
  })),
  removePoLine: (index) => set((state) => ({
    poDraft: { ...state.poDraft, items: state.poDraft.items.filter((_, i) => i !== index) },
  })),
  setReceiptDraft: (receiptDraft) => set({ receiptDraft }),
  setReceiptLine: (lineItemId, receivedQuantity) => set((state) => ({
    receiptDraft: state.receiptDraft.map((line) => line.lineItemId === lineItemId ? { ...line, receivedQuantity } : line),
  })),
  setError: (error) => set({ error }),

  loadProject: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const json = await jsonRequest<{ data: { project: Project } }>(`/api/projekt/${projectId}`);
      const project = json.data.project;
      set({
        project,
        detailsDraft: detailsFromProject(project),
        poDraft: poDraftFromProject(project),
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  loadSuppliers: async () => {
    try {
      const json = await jsonRequest<{ data: { suppliers: Supplier[] } }>('/api/leverantorer?limit=100');
      set({ suppliers: json.data.suppliers });
    } catch {
      // Supplier list is loaded again when the panel opens.
    }
  },

  saveDetails: async () => {
    const project = get().project;
    if (!project) return;
    const draft = get().detailsDraft;
    set({ saving: true, error: null });
    try {
      const body = {
        siteAddress: draft.siteAddress.trim() || null,
        sitePostalCode: draft.sitePostalCode.trim() || null,
        siteCity: draft.siteCity.trim() || null,
        siteCountry: draft.siteCountry.trim() || null,
        squareMeters: draft.squareMeters.trim() ? Number(draft.squareMeters) : null,
        objectType: draft.objectType.trim() || null,
        objectDescription: draft.objectDescription.trim() || null,
        accessNotes: draft.accessNotes.trim() || null,
        wishedInstallDate: draft.wishedInstallDate ? new Date(draft.wishedInstallDate).toISOString() : null,
        wishedInstallDateText: draft.wishedInstallDateText.trim() || null,
        onsiteContactName: draft.onsiteContactName.trim() || null,
        onsiteContactPhone: draft.onsiteContactPhone.trim() || null,
        onsiteContactEmail: draft.onsiteContactEmail.trim() || null,
        internalNotes: draft.internalNotes.trim() || null,
      };
      const json = await jsonRequest<{ data: { project: Project } }>(`/api/projekt/${project.id}/details`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      set({ project: json.data.project, detailsDraft: detailsFromProject(json.data.project) });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  advanceStage: async (toStage) => {
    const project = get().project;
    if (!project) return;
    set({ acting: true, error: null });
    try {
      const json = await jsonRequest<{ data: { project: Project } }>(`/api/projekt/${project.id}/advance`, {
        method: 'POST',
        body: JSON.stringify({ toStage }),
      });
      set({ project: json.data.project, detailsDraft: detailsFromProject(json.data.project) });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ acting: false });
    }
  },

  createPO: async () => {
    const project = get().project;
    if (!project) return;
    const draft = get().poDraft;
    set({ saving: true, error: null });
    try {
      let supplierId = draft.supplierId;
      if (!supplierId && draft.supplierName.trim()) {
        const supplierJson = await jsonRequest<{ data: { supplier: Supplier } }>('/api/leverantorer', {
          method: 'POST',
          body: JSON.stringify({
            name: draft.supplierName.trim(),
            email: draft.supplierEmail.trim() || null,
            phone: draft.supplierPhone.trim() || null,
            orgNumber: draft.supplierOrgNumber.trim() || null,
          }),
        });
        supplierId = supplierJson.data.supplier.id;
      }
      const items = draft.items
        .filter((line) => line.description.trim() && Number(line.quantity) > 0)
        .map((line) => ({
          projectLineItemId: line.projectLineItemId || null,
          description: line.description.trim(),
          quantity: Number(line.quantity),
          unit: line.unit.trim() || 'st',
          unitCost: Number(line.unitCost || 0),
          vatRate: Number(line.vatRate || 0.25),
        }));
      const poJson = await jsonRequest<{ data: { purchaseOrder: PurchaseOrder } }>(`/api/projekt/${project.id}/purchase-orders`, {
        method: 'POST',
        body: JSON.stringify({
          supplierId,
          items,
          expectedDeliveryDate: draft.expectedDeliveryDate ? new Date(draft.expectedDeliveryDate).toISOString() : null,
          notes: draft.notes.trim() || null,
        }),
      });
      await jsonRequest<{ data: { purchaseOrder: PurchaseOrder } }>(`/api/projekt/${project.id}/purchase-orders/${poJson.data.purchaseOrder.id}/submit`, {
        method: 'PATCH',
        body: JSON.stringify({}),
      });
      await get().loadProject(project.id);
      await get().loadSuppliers();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  submitPO: async (poId) => {
    const project = get().project;
    if (!project) return;
    set({ acting: true, error: null });
    try {
      await jsonRequest<{ data: { purchaseOrder: PurchaseOrder } }>(`/api/projekt/${project.id}/purchase-orders/${poId}/submit`, {
        method: 'PATCH',
        body: JSON.stringify({}),
      });
      await get().loadProject(project.id);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ acting: false });
    }
  },

  receivePO: async (po) => {
    const project = get().project;
    if (!project) return;
    set({ acting: true, error: null });
    try {
      const draft = get().receiptDraft;
      await jsonRequest<{ data: { purchaseOrder: PurchaseOrder } }>(`/api/projekt/${project.id}/purchase-orders/${po.id}/receive`, {
        method: 'PATCH',
        body: JSON.stringify({
          receivedItems: draft.map((line) => ({
            lineItemId: line.lineItemId,
            receivedQuantity: Number(line.receivedQuantity || 0),
          })),
        }),
      });
      await get().loadProject(project.id);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ acting: false });
    }
  },
}));
