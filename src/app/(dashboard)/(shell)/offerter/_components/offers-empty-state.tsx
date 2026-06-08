'use client';

import { FileText } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { Panel } from '@shared/ui/panel';

export function OffersMobileEmptyState() {
  return (
    <Panel>
      <EmptyState
        icon={FileText}
        title="Inga offerter"
        description="Skapa din första offert för att komma igång."
      />
    </Panel>
  );
}

type OffersTableEmptyStateProps = {
  onCreateOffer: () => void;
};

export function OffersTableEmptyState({ onCreateOffer }: OffersTableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={8} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <EmptyState
            icon={FileText}
            title="Inga offerter ännu"
            description="Skapa din första offert för att komma igång med en tydlig och trygg kunddialog."
          />
          <Button type="button" onClick={onCreateOffer}>
            Skapa ny offert
          </Button>
          <p className="text-xs text-[var(--ui-text-muted)]">
            Du kan alltid justera innehållet innan du skickar.
          </p>
        </div>
      </td>
    </tr>
  );
}

