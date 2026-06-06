'use client';

import type { ReactNode } from 'react';
import { Columns2, PencilLine, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useHeaderFooter } from './header-footer-context';

export function CanvasZoomControls({ className }: { className?: string }) {
  const hf = useHeaderFooter();
  const activePage = hf?.pages[hf.activeIdx];
  const isDocumentPage = activePage?.kind === 'document';
  const zoom = hf?.canvasZoom ?? 'fit';

  return (
    <div className={cn('flex min-w-0 items-center gap-1.5', className)}>
      <div className="hidden min-w-0 items-center gap-1.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-1 text-[11px] text-[var(--ui-text-secondary)] md:flex">
        {isDocumentPage ? <PencilLine size={14} strokeWidth={1.75} /> : <Columns2 size={14} strokeWidth={1.75} />}
        <span className="max-w-[110px] truncate font-medium text-[var(--ui-text)]">
          {activePage?.label ?? (isDocumentPage ? 'Offertsida' : 'Presentation')}
        </span>
        <span className="text-[var(--ui-text-muted)]">/</span>
        <span>{isDocumentPage ? 'System' : activePage?.includeInCustomerPdf === false ? 'Intern' : 'PDF'}</span>
      </div>

      <div className="flex shrink-0 items-center gap-0 rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-subtle)] p-0.5">
        <ZoomButton title="Zooma ut" onClick={() => hf?.stepCanvasZoom(-1)}>
          <ZoomOut size={16} strokeWidth={1.75} />
        </ZoomButton>
        <button
          type="button"
          onClick={() => hf?.setCanvasZoom('fit')}
          className={cn(
            'h-7 rounded-[var(--ui-radius-sm)] px-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
            zoom === 'fit'
              ? 'bg-[var(--ui-surface)] text-[var(--ui-accent)] ring-1 ring-inset ring-[var(--ui-accent-border)]'
              : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface)] hover:text-[var(--ui-text)]',
          )}
          title="Anpassa till bredd"
        >
          Anpassa
        </button>
        <button
          type="button"
          onClick={() => hf?.setCanvasZoom(1)}
          className={cn(
            'h-7 rounded-[var(--ui-radius-sm)] px-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
            zoom === 1
              ? 'bg-[var(--ui-surface)] text-[var(--ui-accent)] ring-1 ring-inset ring-[var(--ui-accent-border)]'
              : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface)] hover:text-[var(--ui-text)]',
          )}
          title="Visa i 100%"
        >
          {zoom === 'fit' ? '100%' : `${Math.round(zoom * 100)}%`}
        </button>
        <ZoomButton title="Zooma in" onClick={() => hf?.stepCanvasZoom(1)}>
          <ZoomIn size={16} strokeWidth={1.75} />
        </ZoomButton>
      </div>
    </div>
  );
}

function ZoomButton({ title, children, onClick }: { title: string; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--ui-radius-sm)] text-[var(--ui-text-secondary)] transition-colors hover:bg-[var(--ui-surface)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
    >
      {children}
    </button>
  );
}
