'use client';

import { Warning } from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui/alert-dialog';
import { Button } from '@shared/ui/button';

interface ConfirmDestructiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}

/**
 * Reusable confirmation dialog for irreversible/destructive actions.
 * Uses Radix AlertDialog (role="alertdialog") for correct screen reader semantics.
 *
 * Usage:
 *   <ConfirmDestructiveDialog
 *     open={confirmOpen}
 *     onOpenChange={setConfirmOpen}
 *     title="Ta bort {name}?"
 *     description="Det här går inte att ångra."
 *     onConfirm={handleDelete}
 *   />
 */
export function ConfirmDestructiveDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Ta bort',
  cancelLabel = 'Avbryt',
  loading = false,
  onConfirm,
}: ConfirmDestructiveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
            <Warning size={20} weight="fill" className="text-red-600 dark:text-red-400" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline" disabled={loading} autoFocus>
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button type="button" variant="destructive" disabled={loading} onClick={onConfirm}>
              {loading ? 'Tar bort…' : confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
