'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@shared/ui/button';

type OfferDraftRecoveryBannerProps = {
  onContinue: () => void;
  onDiscard: () => void;
};

export function OfferDraftRecoveryBanner({
  onContinue,
  onDiscard,
}: OfferDraftRecoveryBannerProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] px-4 py-2.5 text-xs text-[var(--ui-warning-text)]">
      <span className="inline-flex items-center gap-2">
        <RotateCcw size={16} strokeWidth={1.75} aria-hidden />
        Osparat offertutkast återställt från den här webbläsaren.
      </span>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onContinue} className="h-8 text-[var(--ui-warning-text)]">
          Fortsätt
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDiscard} className="h-8 text-[var(--ui-warning-text)]">
          Börja om
        </Button>
      </div>
    </div>
  );
}
