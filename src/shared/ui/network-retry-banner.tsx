'use client';

import { useEffect, useState } from 'react';
import { ArrowsClockwiseIcon, XIcon } from '@phosphor-icons/react';

export const API_TRANSIENT_ERROR_EVENT = 'soleria:api-transient-error';

export type ApiTransientErrorDetail = {
  message: string;
  status: number;
  willRetry: boolean;
};

export function NetworkRetryBanner() {
  const [detail, setDetail] = useState<ApiTransientErrorDetail | null>(null);

  useEffect(() => {
    function onTransientError(event: Event) {
      const next = (event as CustomEvent<ApiTransientErrorDetail>).detail;
      setDetail(next);
      if (!next.willRetry) return;
      window.setTimeout(() => {
        setDetail((current) => current === next ? null : current);
      }, 6000);
    }

    window.addEventListener(API_TRANSIENT_ERROR_EVENT, onTransientError);
    return () => window.removeEventListener(API_TRANSIENT_ERROR_EVENT, onTransientError);
  }, []);

  if (!detail) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[210] flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-xl items-center gap-3 rounded-xl border border-[var(--accent-border)] bg-[var(--surface)]/95 px-4 py-2.5 text-sm text-[var(--text-primary)] shadow-elevated backdrop-blur">
        <ArrowsClockwiseIcon
          size={16}
          className={detail.willRetry ? 'animate-spin text-[var(--accent)]' : 'text-[var(--text-muted)]'}
        />
        <span className="min-w-0 flex-1">
          {detail.willRetry
            ? 'Tillfälligt nätverksproblem. Vi försöker igen automatiskt.'
            : detail.message}
        </span>
        <button
          type="button"
          onClick={() => setDetail(null)}
          className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
          aria-label="Stäng nätverksmeddelande"
        >
          <XIcon size={14} />
        </button>
      </div>
    </div>
  );
}
