'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';

interface SendOfferDialogProps {
  open: boolean;
  onClose: () => void;
  recipientName: string;
  recipientEmail: string;
  recipientCompany?: string | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function SendOfferDialog({
  open,
  onClose,
  recipientName,
  recipientEmail,
  recipientCompany,
  onConfirm,
  loading = false,
}: SendOfferDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent mobileVariant="center" className="max-w-[420px]">
        <DialogHeader className="px-6 pb-2 pt-5">
          <DialogTitle className="text-base">Bekräfta utskick</DialogTitle>
          <DialogDescription>
            Offerten skickas via e-post och kan inte redigeras efter utskick.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="shrink-0 text-[var(--text-muted)]">Mottagare</dt>
                <dd className="text-right font-medium text-[var(--text-primary)]">{recipientName}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="shrink-0 text-[var(--text-muted)]">E-post</dt>
                <dd className="text-right text-[var(--text-primary)]">{recipientEmail}</dd>
              </div>
              {recipientCompany && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="shrink-0 text-[var(--text-muted)]">Företag</dt>
                  <dd className="text-right text-[var(--text-primary)]">{recipientCompany}</dd>
                </div>
              )}
              <div className="border-t border-[var(--border)] pt-2">
                <p className="text-xs leading-5 text-[var(--text-muted)]">
                  Mottagaren får ett mejl med en knapp till den säkra offertvyn där pris, villkor och signering visas.
                </p>
              </div>
            </dl>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-[var(--border)] px-6 pb-5 pt-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Avbryt
          </Button>
          <Button type="button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Skickar…' : 'Skicka offert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
