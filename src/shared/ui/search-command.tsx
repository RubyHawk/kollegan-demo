'use client';

import { useState, useEffect } from 'react';
import { SearchIcon } from '@shared/ui/icons';
import { cn } from '@shared/lib/utils';

export function SearchTrigger() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(
      navigator.platform?.toLowerCase().includes('mac') ||
      navigator.userAgent?.toLowerCase().includes('mac'),
    );
  }, []);

  return (
    <button
      className={cn(
        'flex items-center gap-2 h-8 px-3 rounded-lg',
        'border border-[var(--border)] bg-[var(--surface-0)]',
        'text-sm text-[var(--text-muted)]',
        'hover:border-[var(--text-muted)]/40 hover:bg-[var(--surface-hover)]',
        'transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30',
      )}
      aria-label="Sök"
    >
      <SearchIcon size={14} />
      <span className="hidden sm:inline text-[13px]">Sök...</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 rounded bg-[var(--surface-alt)] border border-[var(--border-light)] text-[10px] font-medium text-[var(--text-muted)]">
        {isMac ? '⌘' : 'Ctrl'}K
      </kbd>
    </button>
  );
}
