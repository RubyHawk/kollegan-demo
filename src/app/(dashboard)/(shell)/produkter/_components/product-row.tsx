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
        className="h-9 w-9 shrink-0 rounded-xl border border-[var(--border)] object-cover"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-3)] text-[10px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">
      {productInitials(name)}
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  danger = false,
  disabled = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors disabled:cursor-wait disabled:opacity-50',
        danger
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]',
      )}
    >
      <Icon size={13} weight="bold" />
      <span className="hidden sm:inline">{label}</span>
    </button>
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className={cn(
        'group flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0 transition-colors hover:bg-[var(--surface-alt)]/50',
        !product.isActive && 'opacity-60',
      )}
    >
      <ProductThumbnail imageUrl={product.imageUrl} name={product.name} />

      {/* Name + chips + description */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">{product.name}</span>
          {meta?.mainCategoryName && (
            <span className="rounded-full border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
              {meta.mainCategoryName}
            </span>
          )}
          {meta?.subCategoryName && (
            <span className="rounded-full bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
              {meta.subCategoryName}
            </span>
          )}
          {!meta?.isStructured && meta?.label && (
            <span className="rounded-full border border-dashed border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
              {meta.label}
            </span>
          )}
          {product.sku && (
            <span className="rounded-full bg-[var(--surface-3)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
              {product.sku}
            </span>
          )}
          {!product.isActive && (
            <span className="rounded-full bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              Inaktiv
            </span>
          )}
        </div>
        {product.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-[var(--text-muted)]">{product.description}</p>
        )}
      </div>

      {/* Price — no box, right-aligned */}
      <div className="hidden shrink-0 text-right sm:block">
        <div className="text-sm font-semibold text-[var(--text-primary)]">{formatSek(product.unitPrice)}</div>
        <div className="text-[10px] text-[var(--text-muted)]">
          {product.unit ? `per ${product.unit}` : 'engångspris'}
        </div>
      </div>

      {/* Actions — fade in on row hover */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <ActionBtn icon={PencilSimple} label="Redigera" onClick={() => onEdit(product)} />
        <ActionBtn
          icon={Power}
          label={product.isActive ? 'Inaktivera' : 'Aktivera'}
          onClick={() => onToggleActive(product)}
        />
        <ActionBtn
          icon={Trash}
          label={deleting ? 'Tar bort…' : 'Ta bort'}
          danger
          disabled={deleting}
          onClick={() => onDelete(product)}
        />
      </div>
    </motion.article>
  );
}
