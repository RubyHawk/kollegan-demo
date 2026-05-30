'use client';

import { useEffect, useRef, useState } from 'react';
import type { SaveStatus } from '@shared/ui/save-status-pill';
import type { InstallDetailsForm } from '../_store/types';

type UseProjectDetailsDraftAutosaveInput = {
  draft: InstallDetailsForm;
  open: boolean;
  projectId: string | null;
  setDraft: (patch: Partial<InstallDetailsForm>) => void;
};

export function useProjectDetailsDraftAutosave({
  draft,
  open,
  projectId,
  setDraft,
}: UseProjectDetailsDraftAutosaveInput) {
  const [draftStatus, setDraftStatus] = useState<SaveStatus>('idle');
  const [restoredDraft, setRestoredDraft] = useState(false);
  const initialDraftRef = useRef<string | null>(null);
  const hydratedDraftKeyRef = useRef<string | null>(null);
  const draftKey = projectId ? `soleria:project:${projectId}:details-draft:v1` : null;

  useEffect(() => {
    if (!open || !draftKey) {
      hydratedDraftKeyRef.current = null;
      return;
    }
    if (hydratedDraftKeyRef.current === draftKey) return;
    hydratedDraftKeyRef.current = draftKey;
    initialDraftRef.current = JSON.stringify(draft);
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      setDraft(JSON.parse(raw) as Partial<InstallDetailsForm>);
      window.setTimeout(() => {
        setDraftStatus('restored');
        setRestoredDraft(true);
      }, 0);
    } catch {
      // Local storage can be unavailable in private browsing.
    }
  }, [draft, draftKey, open, setDraft]);

  useEffect(() => {
    if (!open || !draftKey || !initialDraftRef.current) return;
    const serialized = JSON.stringify(draft);
    if (serialized === initialDraftRef.current) return;

    const id = window.setTimeout(() => {
      setDraftStatus('autosaving');
      try {
        localStorage.setItem(draftKey, serialized);
        setDraftStatus('autosaved');
      } catch {
        setDraftStatus('dirty');
      }
    }, 900);

    return () => window.clearTimeout(id);
  }, [draft, draftKey, open]);

  function clearDraft() {
    if (!draftKey) return;
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
    setDraftStatus('saved');
    setRestoredDraft(false);
  }

  return {
    clearDraft,
    draftStatus,
    restoredDraft,
    dismissRestoredDraft: () => setRestoredDraft(false),
  };
}
