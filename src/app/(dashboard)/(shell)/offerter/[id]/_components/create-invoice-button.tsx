'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoice } from '@shared/lib/api/invoices.api';

/**
 * Creates a draft invoice from an accepted offer and navigates to the editor.
 * Rendered on the offer detail page only when the offer is accepted.
 */
export function CreateInvoiceButton({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setCreating(true);
    setError(null);
    try {
      const invoice = await createInvoice({ source: 'offer', offerId });
      router.push(`/fakturor/${invoice.id}`);
    } catch (e) {
      setError((e as Error).message || 'Kunde inte skapa fakturan.');
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={create}
        disabled={creating}
        className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {creating ? 'Skapar…' : 'Skapa faktura'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
