'use client';

/**
 * CustomFieldsSection — presentational renderer for org-defined custom fields.
 *
 * Pure presentation: no data fetching, no Prisma, no API calls. The caller
 * supplies the active `definitions` and the current `values` bag, and receives
 * the next bag through `onChange`. One input is rendered per definition,
 * ordered by `sortOrder`. Labels and options come from the data, so the
 * component is language-agnostic (Swedish-friendly). Renders nothing when there
 * are no definitions.
 */

import { useMemo } from 'react';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import type { CustomFieldDefinition } from '@shared/lib/custom-fields/types';

export interface CustomFieldsSectionProps {
  definitions: CustomFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  disabled?: boolean;
}

function toStringValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

export function CustomFieldsSection({
  definitions,
  values,
  onChange,
  disabled,
}: CustomFieldsSectionProps) {
  const ordered = useMemo(
    () => [...definitions].sort((a, b) => a.sortOrder - b.sortOrder),
    [definitions],
  );

  if (ordered.length === 0) return null;

  const setValue = (key: string, value: unknown) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-3">
      {ordered.map((def) => {
        const fieldId = `cf-${def.id}`;
        const raw = values[def.key];

        return (
          <div key={def.id} className="space-y-1.5">
            {def.fieldType !== 'boolean' && (
              <Label htmlFor={fieldId}>
                {def.label}
                {def.required && <span className="ml-0.5 text-[var(--status-danger-text)]">*</span>}
              </Label>
            )}

            {def.fieldType === 'text' && (
              <Input
                id={fieldId}
                value={toStringValue(raw)}
                disabled={disabled}
                onChange={(e) => setValue(def.key, e.target.value)}
              />
            )}

            {def.fieldType === 'number' && (
              <Input
                id={fieldId}
                type="number"
                inputMode="decimal"
                value={toStringValue(raw)}
                disabled={disabled}
                onChange={(e) => setValue(def.key, e.target.value)}
              />
            )}

            {def.fieldType === 'date' && (
              <Input
                id={fieldId}
                type="date"
                value={toStringValue(raw)}
                disabled={disabled}
                onChange={(e) => setValue(def.key, e.target.value)}
              />
            )}

            {def.fieldType === 'boolean' && (
              <label
                htmlFor={fieldId}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-3"
              >
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  {def.label}
                  {def.required && <span className="ml-0.5 text-[var(--status-danger-text)]">*</span>}
                </span>
                <input
                  id={fieldId}
                  type="checkbox"
                  checked={raw === true || raw === 'true'}
                  disabled={disabled}
                  onChange={(e) => setValue(def.key, e.target.checked)}
                  className="h-5 w-5 shrink-0 cursor-pointer accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>
            )}

            {def.fieldType === 'select' && (
              <Select
                value={toStringValue(raw) || undefined}
                disabled={disabled}
                onValueChange={(v) => setValue(def.key, v)}
              >
                <SelectTrigger id={fieldId} aria-label={def.label}>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {(def.options ?? []).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        );
      })}
    </div>
  );
}
