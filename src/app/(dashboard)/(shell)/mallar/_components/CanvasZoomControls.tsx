'use client';

import { useHeaderFooter } from './header-footer-context';
import { cn } from '@shared/lib/utils';
import {
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  NotePencil,
  TextColumns,
} from '@phosphor-icons/react';

export function CanvasZoomControls({ className }: { className?: string }) {
  const hf = useHeaderFooter();
  const activePage = hf?.pages[hf.activeIdx];
  const isDocumentPage = activePage?.kind === 'document';
  const zoom = hf?.canvasZoom ?? 'fit';

  return (
    <div className={cn('flex min-w-0 items-center gap-1.5', className)}>
      <div className="hidden min-w-0 items-center gap-1.5 rounded-xl bg-[var(--surface)] px-2 py-1 text-[11px] text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--border)] md:flex">
        {isDocumentPage ? <NotePencil size={12} /> : <TextColumns size={12} />}
        <span className="max-w-[110px] truncate font-medium text-[var(--text-primary)]">
          {activePage?.label ?? (isDocumentPage ? 'Offertsida' : 'Presentation')}
        </span>
        <span className="text-[var(--text-muted)]">/</span>
        <span>{isDocumentPage ? 'System' : activePage?.includeInCustomerPdf === false ? 'Intern' : 'PDF'}</span>
      </div>

      <div className="flex shrink-0 items-center gap-0 rounded-lg bg-[var(--surface-active)] p-0.5">
        <ZoomButton title="Zooma ut" onClick={() => hf?.stepCanvasZoom(-1)}>
          <MagnifyingGlassMinus size={14} />
        </ZoomButton>
        <button
          type="button"
          onClick={() => hf?.setCanvasZoom('fit')}
          className={cn(
            'h-7 rounded-md px-2 text-[11px] font-semibold transition-all',
            zoom === 'fit'
              ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm ring-1 ring-inset ring-[var(--accent-border)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'
          )}
          title="Anpassa till bredd"
        >
          Anpassa
        </button>
        <button
          type="button"
          onClick={() => hf?.setCanvasZoom(1)}
          className={cn(
            'h-7 rounded-md px-2 text-[11px] font-semibold transition-all',
            zoom === 1
              ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm ring-1 ring-inset ring-[var(--accent-border)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'
          )}
          title="Visa i 100%"
        >
          {zoom === 'fit' ? '100%' : `${Math.round(zoom * 100)}%`}
        </button>
        <ZoomButton title="Zooma in" onClick={() => hf?.stepCanvasZoom(1)}>
          <MagnifyingGlassPlus size={14} />
        </ZoomButton>
      </div>
    </div>
  );
}

function ZoomButton({
  title,
  children,
  onClick,
}: {
  title: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
    >
      {children}
    </button>
  );
}
