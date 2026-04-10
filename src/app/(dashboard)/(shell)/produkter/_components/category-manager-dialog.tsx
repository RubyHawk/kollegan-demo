'use client';

import { useMemo, useState } from 'react';
import { FolderOpen, Folders, Plus, StackSimple, Trash } from '@phosphor-icons/react';
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
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/ui/tooltip';

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

interface PendingDelete {
  id: string;
  name: string;
  type: 'main' | 'sub';
}

const inputCls =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60';

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
  const [selectedMainId, setSelectedMainId] = useState<string | null>(null);
  const [mainName, setMainName] = useState('');
  const [subName, setSubName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const selectedNode = useMemo(
    () => categories.find((node) => node.main.id === selectedMainId) ?? null,
    [categories, selectedMainId],
  );

  // If selected category was deleted, clear selection
  const resolvedNode = selectedNode ?? (categories.length > 0 && !selectedMainId ? null : null);
  void resolvedNode;

  const isAvailable = supportState === 'available';

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent mobileVariant="fullscreen" showMobileClose className="w-[min(100vw-1.5rem,920px)] sm:max-w-[920px]">
            <div className="flex h-full min-h-0 flex-col">
              <DialogHeader className="border-b border-[var(--border)] px-5 pb-4 pt-5 pr-16">
                <DialogTitle>Produktkategorier</DialogTitle>
                <DialogDescription>
                  Skapa och organisera kategoristrukturen. Välj en huvudkategori till vänster för att hantera dess underkategorier.
                  {supportMessage && <span className="ml-1 text-amber-600 dark:text-amber-400">{supportMessage}</span>}
                </DialogDescription>
              </DialogHeader>

              {/* Two-panel body */}
              <div className="flex min-h-0 flex-1 divide-x divide-[var(--border)]">

                {/* Left panel — Main categories */}
                <div className="flex w-[260px] shrink-0 flex-col">
                  <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                      <Folders size={14} />
                      Huvudkategorier
                    </div>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                      {categories.length}
                    </span>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-2">
                    {categories.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                        <FolderOpen size={24} weight="duotone" className="text-[var(--text-muted)]" />
                        <p className="text-xs text-[var(--text-muted)]">Inga kategorier ännu</p>
                      </div>
                    ) : (
                      categories.map((node) => {
                        const isSelected = selectedMainId === node.main.id;
                        const hasChildren = node.children.length > 0;
                        return (
                          <div key={node.main.id} className="group/row flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedMainId(node.main.id)}
                              className={`flex-1 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? 'bg-[var(--accent)]/8 font-semibold text-[var(--text-primary)] ring-1 ring-inset ring-[var(--accent)]/20'
                                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]'
                              }`}
                            >
                              <span className="block truncate">{node.main.name}</span>
                              <span className="block text-xs text-[var(--text-muted)]">
                                {node.children.length} underkategorier
                              </span>
                            </button>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPendingDelete({ id: node.main.id, name: node.main.name, type: 'main' })
                                    }
                                    disabled={!isAvailable || deletingId === node.main.id || hasChildren}
                                    className="hidden h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40 group-hover/row:flex dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                  >
                                    <Trash size={13} weight="bold" />
                                  </button>
                                </span>
                              </TooltipTrigger>
                              {hasChildren && (
                                <TooltipContent side="right">
                                  Ta bort underkategorierna först
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add main category */}
                  <div className="border-t border-[var(--border)] p-3">
                    <div className="flex gap-2">
                      <input
                        value={mainName}
                        onChange={(e) => setMainName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && mainName.trim() && isAvailable && !saving) {
                            void onCreateCategory({ name: mainName.trim() }).then(() => setMainName(''));
                          }
                        }}
                        placeholder="Ny kategori…"
                        disabled={!isAvailable}
                        className={`${inputCls} text-xs`}
                      />
                      <Button
                        type="button"
                        size="icon"
                        onClick={async () => {
                          if (!mainName.trim()) return;
                          await onCreateCategory({ name: mainName.trim() });
                          setMainName('');
                        }}
                        disabled={!isAvailable || saving || !mainName.trim()}
                        className="shrink-0"
                        title="Lägg till huvudkategori"
                      >
                        <Plus size={15} weight="bold" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right panel — Subcategories */}
                <div className="flex min-w-0 flex-1 flex-col">
                  {selectedNode ? (
                    <>
                      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedNode.main.name}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                            <StackSimple size={12} />
                            {selectedNode.children.length} underkategorier
                            {(mainCounts.get(selectedNode.main.id) ?? 0) > 0 && (
                              <span>• {mainCounts.get(selectedNode.main.id)} direktkopplade produkter</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="min-h-0 flex-1 overflow-y-auto p-3">
                        {selectedNode.children.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-6 py-8 text-center">
                            <p className="text-sm text-[var(--text-muted)]">Inga underkategorier</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              Lägg till underkategorier för att strukturera produkterna under {selectedNode.main.name}.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {selectedNode.children.map((child) => (
                              <div
                                key={child.id}
                                className="group/sub flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-0)] px-3.5 py-2.5"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{child.name}</p>
                                  <p className="text-xs text-[var(--text-muted)]">
                                    {subCounts.get(child.id) ?? 0} kopplade produkter
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setPendingDelete({ id: child.id, name: child.name, type: 'sub' })}
                                  disabled={!isAvailable || deletingId === child.id}
                                  className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40 group-hover/sub:flex dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                >
                                  <Trash size={13} weight="bold" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add subcategory */}
                      <div className="border-t border-[var(--border)] p-3">
                        <div className="flex gap-2">
                          <input
                            value={subName}
                            onChange={(e) => setSubName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && subName.trim() && isAvailable && !saving) {
                                void onCreateCategory({ name: subName.trim(), parentId: selectedNode.main.id }).then(
                                  () => setSubName(''),
                                );
                              }
                            }}
                            placeholder={`Underkategori för ${selectedNode.main.name}…`}
                            disabled={!isAvailable}
                            className={`${inputCls} text-xs`}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            onClick={async () => {
                              if (!subName.trim()) return;
                              await onCreateCategory({ name: subName.trim(), parentId: selectedNode.main.id });
                              setSubName('');
                            }}
                            disabled={!isAvailable || saving || !subName.trim()}
                            className="shrink-0"
                            title="Lägg till underkategori"
                          >
                            <Plus size={15} weight="bold" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-muted)]">
                        <Folders size={22} weight="duotone" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">Välj en kategori</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                          Klicka på en huvudkategori i listan till vänster för att hantera dess underkategorier.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t border-[var(--border)] px-5 pb-5 pt-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Stäng
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </TooltipProvider>

      <ConfirmDestructiveDialog
        open={!!pendingDelete}
        onOpenChange={(next) => { if (!next) setPendingDelete(null); }}
        title={`Ta bort "${pendingDelete?.name ?? ''}"?`}
        description={
          pendingDelete?.type === 'main'
            ? 'Huvudkategorin tas bort permanent. Produkter kopplade direkt till den förlorar sin kategori.'
            : 'Underkategorin tas bort permanent. Kopplade produkter förlorar sin underkategori.'
        }
        confirmLabel="Ta bort"
        loading={!!pendingDelete && deletingId === pendingDelete.id}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await onDeleteCategory(pendingDelete.id);
          if (pendingDelete.type === 'main' && selectedMainId === pendingDelete.id) {
            setSelectedMainId(null);
          }
          setPendingDelete(null);
        }}
      />
    </>
  );
}
