'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  ModalBody,
  ModalActionFooter,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import {
  CUSTOM_FIELD_TYPES,
  FIELD_TYPE_LABELS,
  slugifyKey,
  type CreateCustomFieldPayload,
  type CustomFieldDefinition,
  type CustomFieldEntityType,
  type CustomFieldOption,
  type CustomFieldType,
  type UpdateCustomFieldPatch,
} from '../_types';
import { CustomFieldOptionsEditor } from './custom-field-options-editor';

interface EditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: CustomFieldEntityType;
  /** When set, the dialog edits this definition; otherwise it creates a new one. */
  definition: CustomFieldDefinition | null;
  saving: boolean;
  /** Server-side error message (e.g. 409 duplicate key, 400 validation). */
  serverError: string | null;
  onCreate: (payload: CreateCustomFieldPayload) => void;
  onUpdate: (id: string, patch: UpdateCustomFieldPatch) => void;
}

interface FormState {
  label: string;
  fieldType: CustomFieldType;
  required: boolean;
  sortOrder: string;
  options: CustomFieldOption[];
}

function initialState(definition: CustomFieldDefinition | null): FormState {
  return {
    label: definition?.label ?? '',
    fieldType: definition?.fieldType ?? 'text',
    required: definition?.required ?? false,
    sortOrder: String(definition?.sortOrder ?? 0),
    options: definition?.options ?? [],
  };
}

/**
 * The dialog is keyed by its target in the container (`create` vs definition id),
 * so a fresh instance mounts each time it opens — `useState` initializers reset
 * the form from the target without a syncing effect.
 */
export function CustomFieldEditorDialog({
  open,
  onOpenChange,
  entityType,
  definition,
  saving,
  serverError,
  onCreate,
  onUpdate,
}: EditorDialogProps) {
  const isEdit = definition !== null;
  const [form, setForm] = useState<FormState>(() => initialState(definition));
  const [clientError, setClientError] = useState<string | null>(null);

  const keyPreview = useMemo(
    () => (isEdit ? definition.key : slugifyKey(form.label)),
    [isEdit, definition, form.label],
  );

  const isSelect = form.fieldType === 'select';

  const handleSubmit = () => {
    setClientError(null);
    const label = form.label.trim();
    if (!label) {
      setClientError('Etikett krävs.');
      return;
    }

    const sortOrder = Number(form.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      setClientError('Sortering måste vara ett nummer.');
      return;
    }

    let options: CustomFieldOption[] | undefined;
    if (isSelect) {
      const cleaned = form.options
        .map((o) => ({ label: o.label.trim(), value: o.value.trim() }))
        .filter((o) => o.label !== '' || o.value !== '');
      if (cleaned.length === 0) {
        setClientError('Listfält kräver minst ett alternativ.');
        return;
      }
      if (cleaned.some((o) => o.label === '' || o.value === '')) {
        setClientError('Varje alternativ måste ha både etikett och värde.');
        return;
      }
      options = cleaned;
    }

    if (isEdit) {
      // fieldType/entityType/key are immutable; non-select fields clear options.
      onUpdate(definition.id, {
        label,
        required: form.required,
        sortOrder,
        options: isSelect ? options : null,
      });
      return;
    }

    onCreate({
      entityType,
      label,
      fieldType: form.fieldType,
      required: form.required,
      sortOrder,
      ...(isSelect ? { options } : {}),
    });
  };

  const errorMessage = clientError ?? serverError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="sheet" size="md" className="flex max-h-[88dvh] flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Redigera fält' : 'Lägg till fält'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Uppdatera etikett, alternativ, obligatorisk och sortering. Typ och nyckel är låsta.'
              : 'Definiera ett nytt anpassat fält. Nyckeln skapas automatiskt från etiketten.'}
          </DialogDescription>
        </DialogHeader>

        <ModalBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cf-label">Etikett</Label>
            <Input
              id="cf-label"
              value={form.label}
              placeholder="t.ex. Internt referensnummer"
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
            <p className="text-xs text-[var(--text-muted)]">
              Nyckel:{' '}
              <span className="font-mono text-[var(--text-secondary)]">{keyPreview || '—'}</span>
              {!isEdit && ' (kan inte ändras efter att fältet skapats)'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Typ</Label>
            <Select
              value={form.fieldType}
              disabled={isEdit}
              onValueChange={(v) => setForm((f) => ({ ...f, fieldType: v as CustomFieldType }))}
            >
              <SelectTrigger aria-label="Typ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOM_FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {FIELD_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && <p className="text-xs text-[var(--text-muted)]">Typen kan inte ändras.</p>}
          </div>

          {isSelect && (
            <CustomFieldOptionsEditor
              options={form.options}
              disabled={saving}
              onChange={(options) => setForm((f) => ({ ...f, options }))}
            />
          )}

          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-3">
            <div>
              <Label htmlFor="cf-required">Obligatorisk</Label>
              <p className="text-xs text-[var(--text-muted)]">Kräv ett värde i detta fält.</p>
            </div>
            <input
              id="cf-required"
              type="checkbox"
              checked={form.required}
              onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
              className="h-5 w-5 shrink-0 cursor-pointer accent-[var(--accent)]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cf-sort">Sortering</Label>
            <Input
              id="cf-sort"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
              {errorMessage}
            </p>
          )}
        </ModalBody>

        <ModalActionFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button type="button" disabled={saving} onClick={handleSubmit}>
            {saving ? 'Sparar…' : 'Spara'}
          </Button>
        </ModalActionFooter>
      </DialogContent>
    </Dialog>
  );
}
