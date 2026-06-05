'use client';

import { PencilSimple, Trash } from '@phosphor-icons/react';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import {
  FIELD_TYPE_LABELS,
  type CustomFieldDefinition,
} from '../_types';

interface CustomFieldsTableProps {
  definitions: CustomFieldDefinition[];
  onEdit: (definition: CustomFieldDefinition) => void;
  onDelete: (definition: CustomFieldDefinition) => void;
}

function RequiredBadge({ required }: { required: boolean }) {
  return required ? (
    <Badge variant="warning">Obligatorisk</Badge>
  ) : (
    <Badge variant="secondary">Valfri</Badge>
  );
}

function RowActions({
  definition,
  onEdit,
  onDelete,
}: {
  definition: CustomFieldDefinition;
  onEdit: (definition: CustomFieldDefinition) => void;
  onDelete: (definition: CustomFieldDefinition) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Redigera ${definition.label}`}
        onClick={() => onEdit(definition)}
      >
        <PencilSimple size={16} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Ta bort ${definition.label}`}
        className="text-red-600 hover:text-red-700 dark:text-red-400"
        onClick={() => onDelete(definition)}
      >
        <Trash size={16} />
      </Button>
    </div>
  );
}

export function CustomFieldsTable({ definitions, onEdit, onDelete }: CustomFieldsTableProps) {
  if (definitions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-6 py-12 text-center">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Inga anpassade fält ännu
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Lägg till ett fält för att samla in extra information.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--border)] md:block">
        <table className="min-w-full divide-y divide-[var(--border)] text-sm">
          <thead className="bg-[var(--surface-alt)]">
            <tr>
              {['Etikett', 'Nyckel', 'Typ', 'Obligatorisk', 'Sortering', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] last:text-right"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
            {definitions.map((d) => (
              <tr key={d.id} className="transition-colors hover:bg-[var(--surface-alt)]">
                <td className="px-4 py-3.5 font-medium text-[var(--text-primary)]">{d.label}</td>
                <td className="px-4 py-3.5 font-mono text-xs text-[var(--text-muted)]">{d.key}</td>
                <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                  {FIELD_TYPE_LABELS[d.fieldType]}
                </td>
                <td className="px-4 py-3.5">
                  <RequiredBadge required={d.required} />
                </td>
                <td className="px-4 py-3.5 text-[var(--text-secondary)]">{d.sortOrder}</td>
                <td className="px-4 py-3.5">
                  <RowActions definition={d} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {definitions.map((d) => (
          <div
            key={d.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">{d.label}</p>
                <p className="truncate font-mono text-xs text-[var(--text-muted)]">{d.key}</p>
              </div>
              <RowActions definition={d} onEdit={onEdit} onDelete={onDelete} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{FIELD_TYPE_LABELS[d.fieldType]}</Badge>
              <RequiredBadge required={d.required} />
              <span className="text-xs text-[var(--text-muted)]">Sortering: {d.sortOrder}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
