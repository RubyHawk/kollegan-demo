'use client';

import { motion } from 'framer-motion';
import { PencilSimple, Power, Trash } from '@phosphor-icons/react';
import { cn } from '@shared/lib/utils';
import type { ProductRowProps } from './product-library.types';
import { formatSek, productInitials } from './product-library.utils';

function ProductThumbnail({
  imageUrl,
  name,
}: {
  imageUrl?: string;
  name: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className="h-12 w-12 shrink-0 rounded-2xl border border-[var(--border)] object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] text-xs font-semibold tracking-[0.16em] text-[var(--text-muted)]">
      {productInitials(name)}
    </div>
  );
}

export function ProductRow({
  product,
  meta,
  deleting,
  onEdit,
  onToggleActive,
  onDelete,
}: ProductRowProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(
        'group relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)]/92 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[color:color-mix(in_srgb,var(--accent)_18%,var(--border))] hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]',
        !product.isActive && 'opacity-65',
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <ProductThumbnail imageUrl={product.imageUrl} name={product.name} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">{product.name}</h3>
              {meta?.mainCategoryName && (
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-0)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                  {meta.mainCategoryName}
                </span>
              )}
              {meta?.subCategoryName && (
                <span className="rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]">
                  {meta.subCategoryName}
                </span>
              )}
              {!meta?.isStructured && meta?.label && (
                <span className="rounded-full border border-dashed border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
                  {meta.label}
                </span>
              )}
              {product.sku && (
                <span className="rounded-full bg-[var(--surface-3)] px-2.5 py-1 font-mono text-[10px] text-[var(--text-muted)]">
                  {product.sku}
                </span>
              )}
              {!product.isActive && (
                <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  Inaktiv
                </span>
              )}
            </div>

            {product.description && (
              <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                {product.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:min-w-[280px] lg:items-end">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-left lg:min-w-[168px] lg:justify-end lg:text-right">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)] lg:hidden">
              Pris
            </div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">{formatSek(product.unitPrice)}</div>
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">
              {product.unit ? `per ${product.unit}` : 'Engångspris'}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-1 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">
            <button
              type="button"
              onClick={() => onEdit(product)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]"
            >
              <PencilSimple size={14} weight="bold" />
              Redigera
            </button>
            <button
              type="button"
              onClick={() => onToggleActive(product)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]"
            >
              <Power size={14} weight="bold" />
              {product.isActive ? 'Inaktivera' : 'Aktivera'}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => onDelete(product)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 disabled:cursor-wait disabled:opacity-50"
            >
              <Trash size={14} weight="bold" />
              {deleting ? 'Tar bort…' : 'Ta bort'}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
