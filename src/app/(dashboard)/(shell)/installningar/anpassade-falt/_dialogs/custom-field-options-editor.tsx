'use client';

import { Plus, Trash } from '@phosphor-icons/react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { slugifyKey, type CustomFieldOption } from '../_types';

interface OptionsEditorProps {
  options: CustomFieldOption[];
  onChange: (options: CustomFieldOption[]) => void;
  disabled?: boolean;
}

/**
 * Editor for `select` field options. Each row is a `{ label, value }` pair.
 * The value auto-fills from the label (slugified) until the user edits it
 * manually, mirroring how the server derives keys.
 */
export function CustomFieldOptionsEditor({ options, onChange, disabled }: OptionsEditorProps) {
  const update = (index: number, patch: Partial<CustomFieldOption>) => {
    onChange(options.map((opt, i) => (i === index ? { ...opt, ...patch } : opt)));
  };

  const updateLabel = (index: number, label: string) => {
    const current = options[index];
    const valueWasAuto = current.value === slugifyKey(current.label);
    update(index, {
      label,
      value: valueWasAuto ? slugifyKey(label) : current.value,
    });
  };

  const addRow = () => onChange([...options, { label: '', value: '' }]);

  const removeRow = (index: number) => onChange(options.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <Label>Alternativ</Label>
      {options.length === 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          Lägg till minst ett alternativ för listfältet.
        </p>
      )}
      <div className="space-y-2">
        {options.map((opt, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                value={opt.label}
                placeholder="Etikett"
                disabled={disabled}
                onChange={(e) => updateLabel(index, e.target.value)}
              />
              <Input
                value={opt.value}
                placeholder="Värde"
                disabled={disabled}
                className="font-mono text-xs"
                onChange={(e) => update(index, { value: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Ta bort alternativ"
              disabled={disabled}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
              onClick={() => removeRow(index)}
            >
              <Trash size={16} />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addRow}>
        <Plus size={14} />
        Lägg till alternativ
      </Button>
    </div>
  );
}
