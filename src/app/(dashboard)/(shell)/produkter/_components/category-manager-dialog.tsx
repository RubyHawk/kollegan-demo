'use client';

import { useMemo, useState } from 'react';
import { Building, FolderOpen, Folders, Layers, Plus, Trash } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { cn } from '@shared/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ModalActionFooter,
  ModalBody,
  ModalSection,
} from '@shared/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/ui/tooltip';
import type { CategoryComposerPayload, CategoryNode, CategorySupportState } from './product-library.types';

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
  selectedCompanyName?: string;
}

interface PendingDelete {
  id: string;
  name: string;
  type: 'main' | 'sub';
}

const inputCls =
  'w-full rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3.5 py-2.5 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] transition-colors focus:border-[var(--ui-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60';

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
  selectedCompanyName,
}: CategoryManagerDialogProps) {
  const [selectedMainId, setSelectedMainId] = useState<string | null>(null);
  const [mainName, setMainName] = useState('');
  const [subName, setSubName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const selectedNode = useMemo(
    () => categories.find((node) => node.main.id === selectedMainId) ?? null,
    [categories, selectedMainId],
  );

  const isAvailable = supportState === 'available';

  return (
    <>
      <TooltipProvider delayDuration={250}>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent mobileVariant="fullscreen" size="xl" showMobileClose>
            <div className="flex min-h-0 flex-1 flex-col">
              <DialogHeader className="border-b border-[var(--ui-border)] pr-16">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-xl">Produktkategorier</DialogTitle>
                  {selectedCompanyName && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--ui-text-secondary)]">
                      <Building aria-hidden="true" size={12} strokeWidth={2} />
                      {selectedCompanyName}
                    </span>
                  )}
                </div>
                <DialogDescription className="max-w-3xl">
                  Hantera huvudkategorier och underkategorier i samma vy. Välj en huvudkategori till vänster för att
                  arbeta vidare med dess undernivåer.
                </DialogDescription>
                {supportMessage ? (
                  <p className="text-sm text-[var(--ui-warning-text)]">{supportMessage}</p>
                ) : null}
              </DialogHeader>

              <ModalBody>
                <div className="grid min-h-0 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
                  <ModalSection tone="card" className="min-h-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Folders aria-hidden="true" size={16} strokeWidth={1.75} className="text-[var(--ui-accent)]" />
                        <p className="text-sm font-semibold text-[var(--ui-text)]">Huvudkategorier</p>
                      </div>
                      <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--ui-text-muted)]">
                        {categories.length}
                      </span>
                    </div>

                    {categories.length === 0 ? (
                      <div className="rounded-[var(--ui-radius-panel)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-4 py-8 text-center">
                        <FolderOpen aria-hidden="true" size={24} strokeWidth={1.75} className="mx-auto text-[var(--ui-text-muted)]" />
                        <p className="mt-3 text-sm text-[var(--ui-text-muted)]">Inga kategorier ännu.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {categories.map((node) => {
                          const isSelected = selectedMainId === node.main.id;
                          const hasChildren = node.children.length > 0;

                          return (
                            <div
                              key={node.main.id}
                              className={cn(
                                'group rounded-[var(--ui-radius-panel)] border px-3 py-3 transition-colors',
                                isSelected
                                  ? 'border-[var(--ui-accent)]/20 bg-[var(--ui-accent)]/6'
                                  : 'border-[var(--ui-border)] bg-[var(--ui-surface-subtle)]',
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => setSelectedMainId(node.main.id)}
                                  className="min-w-0 flex-1 text-left"
                                >
                                  <p className="truncate text-sm font-medium text-[var(--ui-text)]">{node.main.name}</p>
                                  <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                                    {node.children.length} underkategorier
                                  </p>
                                </button>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setPendingDelete({ id: node.main.id, name: node.main.name, type: 'main' })}
                                        disabled={!isAvailable || deletingId === node.main.id || hasChildren}
                                        className="h-8 w-8 rounded-[var(--ui-radius-control)] text-[var(--ui-text-muted)] hover:bg-[var(--ui-danger-bg)] hover:text-[var(--ui-danger-text)]"
                                      >
                                        <Trash aria-hidden="true" size={14} strokeWidth={2} />
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {hasChildren ? (
                                    <TooltipContent side="right">Ta bort underkategorierna först</TooltipContent>
                                  ) : null}
                                </Tooltip>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="space-y-2 border-t border-[var(--ui-border)] pt-4">
                      <label className="block text-xs font-medium text-[var(--ui-text-secondary)]">Ny huvudkategori</label>
                      <div className="flex gap-2">
                        <input
                          value={mainName}
                          onChange={(event) => setMainName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && mainName.trim() && isAvailable && !saving) {
                              void onCreateCategory({ name: mainName.trim() }).then(() => setMainName(''));
                            }
                          }}
                          placeholder="Ny kategori..."
                          disabled={!isAvailable}
                          className={inputCls}
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
                        >
                          <Plus aria-hidden="true" size={15} strokeWidth={2} />
                        </Button>
                      </div>
                    </div>
                  </ModalSection>

                  <ModalSection tone="card" className="min-h-0">
                    {selectedNode ? (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--ui-text)]">{selectedNode.main.name}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--ui-text-muted)]">
                              <span className="inline-flex items-center gap-1">
                                <Layers aria-hidden="true" size={12} strokeWidth={2} />
                                {selectedNode.children.length} underkategorier
                              </span>
                              {(mainCounts.get(selectedNode.main.id) ?? 0) > 0 ? (
                                <span>{mainCounts.get(selectedNode.main.id)} direktkopplade produkter</span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {selectedNode.children.length === 0 ? (
                          <div className="rounded-[var(--ui-radius-panel)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-6 py-10 text-center">
                            <p className="text-sm font-medium text-[var(--ui-text)]">Inga underkategorier ännu</p>
                            <p className="mt-1 text-sm leading-6 text-[var(--ui-text-muted)]">
                              Lägg till underkategorier för att strukturera produkterna under {selectedNode.main.name}.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedNode.children.map((child) => (
                              <div
                                key={child.id}
                                className="flex items-center justify-between gap-3 rounded-[var(--ui-radius-panel)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-[var(--ui-text)]">{child.name}</p>
                                  <p className="text-xs text-[var(--ui-text-muted)]">
                                    {subCounts.get(child.id) ?? 0} kopplade produkter
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setPendingDelete({ id: child.id, name: child.name, type: 'sub' })}
                                  disabled={!isAvailable || deletingId === child.id}
                                  className="h-8 w-8 shrink-0 rounded-[var(--ui-radius-control)] text-[var(--ui-text-muted)] hover:bg-[var(--ui-danger-bg)] hover:text-[var(--ui-danger-text)]"
                                >
                                  <Trash aria-hidden="true" size={14} strokeWidth={2} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2 border-t border-[var(--ui-border)] pt-4">
                          <label className="block text-xs font-medium text-[var(--ui-text-secondary)]">
                            Ny underkategori för {selectedNode.main.name}
                          </label>
                          <div className="flex gap-2">
                            <input
                              value={subName}
                              onChange={(event) => setSubName(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' && subName.trim() && isAvailable && !saving) {
                                  void onCreateCategory({ name: subName.trim(), parentId: selectedNode.main.id }).then(
                                    () => setSubName(''),
                                  );
                                }
                              }}
                              placeholder="Underkategori..."
                              disabled={!isAvailable}
                              className={inputCls}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              onClick={async () => {
                                if (!subName.trim()) return;
                                await onCreateCategory({ name: subName.trim(), parentId: selectedNode.main.id });
                                setSubName('');
                              }}
                              disabled={!isAvailable || saving || !subName.trim()}
                              className="shrink-0"
                            >
                              <Plus aria-hidden="true" size={15} strokeWidth={2} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-[var(--ui-radius-panel)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-8 py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--ui-radius-panel)] border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text-muted)]">
                          <Folders aria-hidden="true" size={22} strokeWidth={1.75} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--ui-text)]">Välj en huvudkategori</p>
                          <p className="mt-1 text-sm leading-6 text-[var(--ui-text-muted)]">
                            Klicka på en kategori till vänster för att hantera dess underkategorier här.
                          </p>
                        </div>
                      </div>
                    )}
                  </ModalSection>
                </div>
              </ModalBody>

              <ModalActionFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Stäng
                </Button>
              </ModalActionFooter>
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
