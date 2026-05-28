'use client';

import * as Switch from '@radix-ui/react-switch';
import { useId } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';

interface Props {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}

export function RememberDeviceSwitch({ checked, onCheckedChange }: Props) {
  const id = useId();
  return (
    <div className="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)]">
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border outline-none transition-[background-color,border-color] duration-[160ms] data-[state=checked]:border-[var(--auth-accent)] data-[state=checked]:bg-[var(--auth-accent)] data-[state=unchecked]:border-[var(--border)] data-[state=unchecked]:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--auth-accent-glow)]"
        style={{ transitionTimingFunction: 'var(--ease-out-soft)' }}
      >
        <Switch.Thumb
          className="block h-4 w-4 rounded-full bg-[var(--surface-0)] shadow-sm transition-transform duration-[180ms] data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-[2px]"
          style={{ transitionTimingFunction: 'var(--ease-out-soft)' }}
        />
      </Switch.Root>
      <label htmlFor={id} className="cursor-pointer select-none">
        Kom ihåg den här enheten
      </label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-[var(--text-muted)] underline decoration-dotted underline-offset-4">
            30 dagar
          </button>
        </TooltipTrigger>
        <TooltipContent>Lita på den här webbläsaren i 30 dagar efter lyckad MFA.</TooltipContent>
      </Tooltip>
    </div>
  );
}
