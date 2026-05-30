'use client';

type ProjectDetailsDraftBannerProps = {
  onContinue: () => void;
};

export function ProjectDetailsDraftBanner({ onContinue }: ProjectDetailsDraftBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--status-warning-bg)] px-5 py-2 text-xs text-[var(--status-warning-text)]">
      <span>Osparade projektuppgifter återställdes från den här webbläsaren.</span>
      <button
        type="button"
        className="font-semibold underline-offset-2 hover:underline"
        onClick={onContinue}
      >
        Fortsätt
      </button>
    </div>
  );
}
