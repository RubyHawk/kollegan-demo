'use client';

type OfferDraftRecoveryBannerProps = {
  onContinue: () => void;
  onDiscard: () => void;
};

export function OfferDraftRecoveryBanner({
  onContinue,
  onDiscard,
}: OfferDraftRecoveryBannerProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--status-warning-bg)] px-4 py-2.5 text-xs text-[var(--status-warning-text)]">
      <span>Osparat offertutkast återställt från den här webbläsaren.</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onContinue} className="font-semibold underline-offset-2 hover:underline">
          Fortsätt
        </button>
        <button type="button" onClick={onDiscard} className="opacity-75 hover:opacity-100">
          Börja om
        </button>
      </div>
    </div>
  );
}
