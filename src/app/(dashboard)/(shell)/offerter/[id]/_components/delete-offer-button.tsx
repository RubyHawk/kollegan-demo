'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteOffer } from '@shared/lib/api/offers.api';
import { Button } from '@shared/ui/button';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';

type DeleteOfferButtonProps = {
  offerId: string;
  offerTitle: string;
};

export function DeleteOfferButton({ offerId, offerTitle }: DeleteOfferButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      await deleteOffer(offerId);
      router.push('/offerter');
      router.refresh();
    } catch {
      setError('Kunde inte radera offerten. Kontrollera anslutningen och försök igen.');
      setDeleting(false);
    }
  }

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 size={16} strokeWidth={1.75} aria-hidden />
        Radera offert
      </Button>

      <ConfirmDestructiveDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (deleting) return;
          setOpen(nextOpen);
          if (!nextOpen) setError(null);
        }}
        title="Radera offert?"
        description={`”${offerTitle}” tas bort från offertlistan. Åtgärden går inte att ångra i appen.`}
        confirmLabel="Radera offert"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />

      {error ? (
        <p role="alert" className="w-full text-sm text-[var(--ui-danger-text)]">
          {error}
        </p>
      ) : null}
    </>
  );
}
