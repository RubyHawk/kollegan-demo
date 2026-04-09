'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash } from '@phosphor-icons/react';
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

  const inputClass =
    'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="fullscreen" showMobileClose className="w-[min(100vw-1rem,960px)] sm:max-w-[960px]">
        <DialogHeader className="border-b border-[var(--border)] px-5 pb-4 pt-5 pr-16">
          <DialogTitle>Kategorier</DialogTitle>
          <DialogDescription>
            {categories.length} huvud{categories.length === 1 ? 'kategori' : 'kategorier'} · {totalSubcategories} underkategori{totalSubcategories === 1 ? '' : 'er'}
            {supportMessage && <span className="ml-2 text-amber-600 dark:text-amber-400">· {supportMessage}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(76dvh,800px)] space-y-4 overflow-y-auto px-5 pb-2 pt-4">
          {/* Add main category */}
          <div className="flex gap-2">
            <input
              value={mainName}
              onChange={(e) => setMainName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && mainName.trim() && supportState === 'available' && !saving) {
                  void onCreateCategory({ name: mainName.trim() }).then(() => setMainName(''));
                }
              }}
              placeholder="Ny huvudkategori…"
              disabled={supportState !== 'available'}
              className={inputClass}
            />
            <Button
              type="button"
              onClick={async () => {
                if (!mainName.trim()) return;
                await onCreateCategory({ name: mainName.trim() });
                setMainName('');
              }}
              disabled={supportState !== 'available' || saving || !mainName.trim()}
              className="h-9 shrink-0 rounded-xl px-3"
            >
              <Plus size={14} weight="bold" />
              Lägg till
            </Button>
          </div>

          {/* Category grid */}
          {categories.length > 0 && (
            <div className="grid gap-3 lg:grid-cols-2">
              {categories.map((node, index) => (
                <motion.section
                  key={node.main.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, delay: index * 0.03, ease: 'easeOut' }}
                  className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-0)] p-3"
                >
                  {/* Main category header */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{node.main.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {mainCounts.get(node.main.id) ?? 0} produkter · {node.children.length} underkategorier
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void onDeleteCategory(node.main.id)}
                      disabled={supportState !== 'available' || deletingId === node.main.id || node.children.length > 0}
                      title={node.children.length > 0 ? 'Ta bort underkategorierna först' : 'Ta bort'}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950/30"
                    >
                      <Trash size={13} weight="bold" />
                    </button>
                  </div>

                  {/* Subcategory list */}
                  {node.children.length > 0 && (
                    <div className="mt-2.5 space-y-1">
                      {node.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[var(--text-primary)]">{child.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              {subCounts.get(child.id) ?? 0} produkter
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void onDeleteCategory(child.id)}
                            disabled={supportState !== 'available' || deletingId === child.id}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950/30"
                          >
                            <Trash size={12} weight="bold" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add subcategory */}
                  <div className="mt-2.5 flex gap-2">
                    <input
                      value={subNames[node.main.id] ?? ''}
                      onChange={(e) => setSubNames((c) => ({ ...c, [node.main.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        const value = subNames[node.main.id]?.trim();
                        if (e.key === 'Enter' && value && supportState === 'available' && !saving) {
                          void onCreateCategory({ name: value, parentId: node.main.id }).then(() =>
                            setSubNames((c) => ({ ...c, [node.main.id]: '' })),
                          );
                        }
                      }}
                      placeholder="Ny underkategori…"
                      disabled={supportState !== 'available'}
                      className={inputClass}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={async () => {
                        const value = subNames[node.main.id]?.trim();
                        if (!value) return;
                        await onCreateCategory({ name: value, parentId: node.main.id });
                        setSubNames((c) => ({ ...c, [node.main.id]: '' }));
                      }}
                      disabled={supportState !== 'available' || saving || !(subNames[node.main.id] ?? '').trim()}
                      className="h-9 shrink-0 rounded-xl px-3"
                    >
                      <Plus size={14} weight="bold" />
                    </Button>
                  </div>
                </motion.section>
              ))}
            </div>
          )}

          {categories.length === 0 && (
            <div className="rounded-[18px] border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              Inga kategorier än. Lägg till en huvudkategori ovan för att strukturera biblioteket.
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-[var(--border)] px-5 pb-5 pt-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Stäng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
