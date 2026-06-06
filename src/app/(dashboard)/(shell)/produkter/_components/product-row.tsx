'use client';

import { motion } from 'framer-motion';
import { Pencil, Power, Trash, type LucideIcon } from 'lucide-react';
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
        className="h-9 w-9 shrink-0 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] object-cover"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[10px] font-semibold tracking-[0.14em] text-[var(--ui-text-muted)]">
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
  icon: LucideIcon;
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
          ? 'text-[var(--ui-danger-text)] hover:bg-[var(--ui-danger-bg)]'
          : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-subtle)] hover:text-[var(--ui-text)]',
      )}
    >
      <Icon aria-hidden="true" size={14} strokeWidth={2} />
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
        'group flex items-center gap-3 border-b border-[var(--ui-border)] px-4 py-3 last:border-b-0 transition-colors hover:bg-[var(--ui-surface-subtle)]/50',
        !product.isActive && 'opacity-60',
      )}
    >
      <ProductThumbnail imageUrl={product.imageUrl} name={product.name} />

      {/* Name + chips + description */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-[var(--ui-text)]">{product.name}</span>
          {meta?.mainCategoryName && (
            <span className="rounded-full border border-[var(--ui-border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ui-text-secondary)]">
              {meta.mainCategoryName}
            </span>
          )}
          {meta?.subCategoryName && (
            <span className="rounded-full bg-[var(--ui-accent)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--ui-accent)]">
              {meta.subCategoryName}
            </span>
          )}
          {!meta?.isStructured && meta?.label && (
            <span className="rounded-full border border-dashed border-[var(--ui-border)] px-1.5 py-0.5 text-[10px] text-[var(--ui-text-muted)]">
              {meta.label}
            </span>
          )}
          {product.sku && (
            <span className="rounded-full bg-[var(--ui-surface-subtle)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ui-text-muted)]">
              {product.sku}
            </span>
          )}
          {!product.isActive && (
            <span className="rounded-full bg-[var(--ui-warning-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ui-warning-text)]">
              Inaktiv
            </span>
          )}
        </div>
        {product.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-[var(--ui-text-muted)]">{product.description}</p>
        )}
      </div>

      {/* Price — no box, right-aligned */}
      <div className="hidden shrink-0 text-right sm:block">
        <div className="text-sm font-semibold text-[var(--ui-text)]">{formatSek(product.unitPrice)}</div>
        <div className="text-[10px] text-[var(--ui-text-muted)]">
          {product.unit ? `per ${product.unit}` : 'engångspris'}
        </div>
      </div>

      {/* Actions — always visible for reliable touch + desktop editing */}
      <div className="flex shrink-0 items-center gap-0.5">
        <ActionBtn icon={Pencil} label="Redigera" onClick={() => onEdit(product)} />
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
