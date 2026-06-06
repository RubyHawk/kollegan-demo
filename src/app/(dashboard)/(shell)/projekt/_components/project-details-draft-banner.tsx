'use client';

import { Button } from '@shared/ui/button';

type ProjectDetailsDraftBannerProps = {
  onContinue: () => void;
};

export function ProjectDetailsDraftBanner({ onContinue }: ProjectDetailsDraftBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] px-5 py-2 text-xs text-[var(--ui-warning-text)]">
      <span>Osparade projektuppgifter återställdes från den här webbläsaren.</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-[var(--ui-warning-text)] hover:bg-[var(--ui-warning-bg)]"
        onClick={onContinue}
      >
        Fortsätt
      </Button>
    </div>
  );
}

