'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Folders, Plus, StackSimple, Trash } from '@phosphor-icons/react';
import type { CategoryComposerPayload, CategoryNode, CategorySupportState } from './product-library.types';
import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryNode[];
  supportState: CategorySupportState;
  supportMessage: string | null;
  mainCounts: Map<string, number>;
  subCounts: Map<string, number>;
  onCreateCategory: (payload: CategoryComposerPayload) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  saving: boolean;
  deletingId: string | null;
}

export function CategoryManagerDialog({
  open,
  onOpenChange,
  categories,
  supportState,
  supportMessage,
  mainCounts,
  subCounts,
  onCreateCategory,
  onDeleteCategory,
  saving,
  deletingId,
}: CategoryManagerDialogProps) {
  const [mainName, setMainName] = useState('');
  const [subNames, setSubNames] = useState<Record<string, string>>({});

  const totalSubcategories = useMemo(
    () => categories.reduce((count, node) => count + node.children.length, 0),
    [categories],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="fullscreen" showMobileClose className="max-w-4xl">
        <DialogHeader className="border-b border-[var(--border)] px-6 pb-5 pt-6 pr-16">
          <DialogTitle>Strukturera biblioteket med huvud- och underkategorier</DialogTitle>
          <DialogDescription>
            Huvudkategorier är bara ordning och navigation. Produkter och tjänster kopplas sedan till en vald underkategori.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(72dvh,760px)] space-y-5 overflow-y-auto px-6 pb-3 pt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                <Folders size={14} />
                Huvudkategorier
              </div>
              <div className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">{categories.length}</div>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                <StackSimple size={14} />
                Underkategorier
              </div>
              <div className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">{totalSubcategories}</div>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Status</div>
              <div className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                {supportState === 'available' ? 'Redo för struktur' : 'Väntar på databasuppdatering'}
              </div>
              {supportMessage && <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{supportMessage}</p>}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Ny huvudkategori</label>
                <input
                  value={mainName}
                  onChange={(event) => setMainName(event.target.value)}
                  placeholder="Solfilm"
                  disabled={supportState !== 'available'}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <Button
                type="button"
                onClick={async () => {
                  if (!mainName.trim()) return;
                  await onCreateCategory({ name: mainName.trim() });
                  setMainName('');
                }}
                disabled={supportState !== 'available' || saving || !mainName.trim()}
                className="h-12 rounded-2xl px-4"
              >
                <Plus size={16} weight="bold" />
                Lägg till huvudkategori
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {categories.map((node, index) => (
              <motion.section
                key={node.main.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: index * 0.03, ease: 'easeOut' }}
                className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{node.main.name}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {mainCounts.get(node.main.id) ?? 0} produkter direkt på huvudnivån • {node.children.length} underkategorier
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onDeleteCategory(node.main.id)}
                    disabled={supportState !== 'available' || deletingId === node.main.id || node.children.length > 0}
                    className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-[var(--border)] px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/30"
                    title={node.children.length > 0 ? 'Ta bort underkategorierna först' : 'Ta bort huvudkategori'}
                  >
                    <Trash size={14} weight="bold" />
                    {deletingId === node.main.id ? 'Tar bort…' : 'Ta bort'}
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {node.children.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--text-muted)]">
                      Inga underkategorier ännu. Lägg till en eller flera för att göra produktvalet tydligare i offertflödet.
                    </div>
                  ) : (
                    node.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{child.name}</p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {subCounts.get(child.id) ?? 0} kopplade produkter
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void onDeleteCategory(child.id)}
                          disabled={supportState !== 'available' || deletingId === child.id}
                          className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-[var(--border)] px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/30"
                        >
                          <Trash size={14} weight="bold" />
                          {deletingId === child.id ? 'Tar bort…' : 'Ta bort'}
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Ny underkategori</label>
                    <input
                      value={subNames[node.main.id] ?? ''}
                      onChange={(event) =>
                        setSubNames((current) => ({ ...current, [node.main.id]: event.target.value }))
                      }
                      placeholder="Solfilm villa"
                      disabled={supportState !== 'available'}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      const value = subNames[node.main.id]?.trim();
                      if (!value) return;
                      await onCreateCategory({ name: value, parentId: node.main.id });
                      setSubNames((current) => ({ ...current, [node.main.id]: '' }));
                    }}
                    disabled={supportState !== 'available' || saving || !(subNames[node.main.id] ?? '').trim()}
                    className="h-12 rounded-2xl px-4"
                  >
                    <Plus size={16} weight="bold" />
                    Lägg till
                  </Button>
                </div>
              </motion.section>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t border-[var(--border)] px-6 pb-6 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Stäng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

