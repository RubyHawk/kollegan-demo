'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Plus, WarningCircle } from '@phosphor-icons/react';
import { Button } from '@shared/ui/button';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { useToast } from '@shared/ui/toast/toast-context';
import { cn } from '@shared/lib/utils';
import {
  createCustomField,
  deleteCustomField,
  updateCustomField,
} from '@shared/lib/api/custom-fields.api';
import {
  CUSTOM_FIELD_ENTITY_TYPES,
  ENTITY_TYPE_LABELS,
  type CreateCustomFieldPayload,
  type CustomFieldDefinition,
  type UpdateCustomFieldPatch,
} from '../_types';
import { useCustomFieldsStore } from '../_store/custom-fields.store';
import { CustomFieldsTable } from '../_components/custom-fields-table';
import { CustomFieldEditorDialog } from '../_dialogs/custom-field-editor-dialog';

export function CustomFieldsContainer() {
  const { addToast } = useToast();
  const { activeTab, definitions, loading, error, setActiveTab, load, upsertDefinition, removeDefinition } =
    useCustomFieldsStore();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CustomFieldDefinition | null>(null);
  // Bumped on every open so the keyed editor remounts with a fresh form.
  const [editorSession, setEditorSession] = useState(0);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CustomFieldDefinition | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void load(activeTab);
  }, [activeTab, load]);

  const openCreate = () => {
    setEditing(null);
    setServerError(null);
    setEditorSession((n) => n + 1);
    setEditorOpen(true);
  };

  const openEdit = (definition: CustomFieldDefinition) => {
    setEditing(definition);
    setServerError(null);
    setEditorSession((n) => n + 1);
    setEditorOpen(true);
  };

  const toastError = (message: string) =>
    addToast({ message, color: 'red', icon: <WarningCircle size={14} className="text-red-500" /> });

  const toastSuccess = (message: string) =>
    addToast({ message, color: 'emerald', icon: <CheckCircle size={14} className="text-emerald-600" /> });

  const handleCreate = async (payload: CreateCustomFieldPayload) => {
    setSaving(true);
    setServerError(null);
    try {
      const created = await createCustomField(payload);
      upsertDefinition(created);
      setEditorOpen(false);
      toastSuccess(`Fältet ”${created.label}” skapades.`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Kunde inte skapa fältet.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, patch: UpdateCustomFieldPatch) => {
    setSaving(true);
    setServerError(null);
    try {
      const updated = await updateCustomField(id, patch);
      upsertDefinition(updated);
      setEditorOpen(false);
      toastSuccess(`Fältet ”${updated.label}” uppdaterades.`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Kunde inte uppdatera fältet.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCustomField(deleteTarget.id);
      removeDefinition(deleteTarget.id);
      toastSuccess(`Fältet ”${deleteTarget.label}” togs bort.`);
      setDeleteTarget(null);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Kunde inte ta bort fältet.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="shrink-0">
          <Plus size={16} />
          Lägg till fält
        </Button>
      </div>

      {/* Entity-type tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-1">
        {CUSTOM_FIELD_ENTITY_TYPES.map((type) => {
          const active = type === activeTab;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveTab(type)}
              className={cn(
                'min-h-[40px] flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
              aria-pressed={active}
            >
              {ENTITY_TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-xl bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger-text)]">
          {error}
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-[var(--border)] px-6 py-12 text-center text-sm text-[var(--text-muted)]">
          Laddar…
        </div>
      ) : (
        <CustomFieldsTable
          definitions={definitions}
          onEdit={openEdit}
          onDelete={(definition) => setDeleteTarget(definition)}
        />
      )}

      <CustomFieldEditorDialog
        key={`${editing?.id ?? 'create'}-${editorSession}`}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        entityType={activeTab}
        definition={editing}
        saving={saving}
        serverError={serverError}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <ConfirmDestructiveDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={deleteTarget ? `Ta bort ”${deleteTarget.label}”?` : 'Ta bort fält?'}
        description="Fältet tas bort permanent. Det här går inte att ångra."
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
