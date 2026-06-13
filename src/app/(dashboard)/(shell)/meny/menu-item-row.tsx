'use client';

import { useState } from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { StatusBadge } from '@shared/ui/status-badge';
import { InlineAlert } from '@shared/ui/inline-alert';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { EditIcon, TrashIcon } from '@shared/ui/icons';
import type { RestaurantMenuItem, UpdateMenuItemPayload } from '@shared/lib/api/restaurant.api';
import { parsePriceCents, parseTags, priceSummary, priceToInput } from './menu-utils';

interface MenuItemRowProps {
  item: RestaurantMenuItem;
  onUpdate: (id: string, payload: UpdateMenuItemPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MenuItemRow({ item, onUpdate, onDelete }: MenuItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    if (!name) {
      setError('Rätten behöver ett namn.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onUpdate(item.id, {
        name,
        priceCents: parsePriceCents(form.get('price')),
        tags: parseTags(form.get('tags')),
        description: String(form.get('description') ?? '').trim() || null,
      });
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailable() {
    setBusy(true);
    setError('');
    try {
      await onUpdate(item.id, { isAvailable: !item.isAvailable });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    setError('');
    try {
      await onDelete(item.id);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  if (editing) {
    return (
      <form onSubmit={save} className="space-y-3 py-3">
        <Input name="name" defaultValue={item.name} placeholder="Rättens namn" required />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="price" type="number" min="0" step="1" defaultValue={priceToInput(item.priceCents)} placeholder="Pris i kronor" />
          <Input name="tags" defaultValue={item.tags.join(', ')} placeholder="Prisvarianter, ex. S 89, M 149" />
        </div>
        <Textarea name="description" defaultValue={item.description ?? ''} placeholder="Beskrivning, råvaror eller allergener" rows={3} />
        {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="compact" loading={busy}>Spara</Button>
          <Button type="button" variant="ghost" size="compact" disabled={busy} onClick={() => { setEditing(false); setError(''); }}>
            Avbryt
          </Button>
        </div>
      </form>
    );
  }

  return (
    <article className="grid gap-2 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-[var(--ui-text)]">{item.name}</p>
            {!item.isAvailable ? <StatusBadge tone="neutral">Dold</StatusBadge> : null}
          </div>
          {item.description ? <p className="text-sm text-[var(--ui-text-muted)]">{item.description}</p> : null}
          {item.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] px-1.5 py-0.5 text-xs text-[var(--ui-text-muted)]">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <p className="shrink-0 text-right text-sm tabular-nums text-[var(--ui-text-secondary)]">
          {priceSummary(item.priceCents, item.currency, item.tags)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button type="button" variant="ghost" size="compact" onClick={() => setEditing(true)}>
          <EditIcon size={14} />
          Redigera
        </Button>
        <Button type="button" variant="ghost" size="compact" loading={busy} onClick={toggleAvailable}>
          {item.isAvailable ? 'Dölj' : 'Visa'}
        </Button>
        <Button type="button" variant="ghost" size="compact" onClick={() => setConfirmOpen(true)}>
          <TrashIcon size={14} />
          Ta bort
        </Button>
      </div>

      {error && !editing ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      <ConfirmDestructiveDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Ta bort ${item.name}?`}
        description="Rätten tas bort från menyn och den publika restaurangsidan. Detta går inte att ångra."
        loading={busy}
        onConfirm={confirmDelete}
      />
    </article>
  );
}
