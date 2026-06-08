'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail } from 'lucide-react';
import { listCompanyMembers, type Company } from '@shared/lib/api/companies.api';
import {
  createLeadIntakeForwarder,
  deactivateLeadIntakeForwarder,
  listLeadIntakeForwarders,
  updateLeadIntakeForwarder,
  type LeadIntakeFieldConfig,
  type LeadIntakeFieldMapping,
  type LeadIntakeForwarder,
} from '@shared/lib/api/lead-intake-forwarders.api';
import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ModalActionFooter,
  ModalBody,
} from '@shared/ui/dialog';
import { InlineAlert } from '@shared/ui/inline-alert';
import { StatusBadge } from '@shared/ui/status-badge';
import { TooltipProvider } from '@shared/ui/tooltip';
import {
  buildDraftName,
  buildSenderName,
  emptyField,
  formatDate,
  PANELS,
  recipientDisplayName,
  sortFields,
  toRecipientIds,
  type LeadIntakeFormState,
  type Member,
  type Panel,
} from './lead-intake-dialog-model';
import { ForwarderStatus, PanelButton, StatTile } from './lead-intake-dialog-parts';
import {
  FieldsPanel,
  ForwarderSidebar,
  RecipientsPanel,
  SetupPanel,
} from './lead-intake-dialog-sections';

interface LeadIntakeDialogProps {
  open: boolean;
  company: Company | null;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_FORM: LeadIntakeFormState = {
  name: '',
  sourceLabel: '',
  intakeAddress: '',
  senderEmail: '',
  senderName: '',
  isActive: true,
  recipientUserIds: [],
  fields: [],
};

export function LeadIntakeDialog({ open, company, onOpenChange }: LeadIntakeDialogProps) {
  const [forwarders, setForwarders] = useState<LeadIntakeForwarder[]>([]);
  const [defaultFieldConfig, setDefaultFieldConfig] = useState<LeadIntakeFieldConfig | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [activePanel, setActivePanel] = useState<Panel>('setup');
  const [form, setForm] = useState<LeadIntakeFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => forwarders.find((forwarder) => forwarder.id === selectedId) ?? null,
    [forwarders, selectedId],
  );

  const resetForm = useCallback((forwarder: LeadIntakeForwarder | null, fallback?: LeadIntakeFieldConfig | null, nextCompany?: Company | null) => {
    const draftCompany = nextCompany ?? company;
    setForm({
      name: forwarder?.name ?? (draftCompany ? buildDraftName(draftCompany) : 'Website'),
      sourceLabel: forwarder?.sourceLabel ?? 'Framer website',
      intakeAddress: forwarder?.intakeAddress ?? '',
      senderEmail: forwarder?.senderEmail ?? '',
      senderName: forwarder?.senderName ?? (draftCompany ? buildSenderName(draftCompany) : ''),
      isActive: forwarder?.isActive ?? true,
      recipientUserIds: toRecipientIds(forwarder),
      fields: sortFields(forwarder?.fieldConfig.fields ?? fallback?.fields ?? []),
    });
  }, [company]);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    setError(null);
    try {
      const [forwarderPayload, memberPayload] = await Promise.all([
        listLeadIntakeForwarders(company.id),
        listCompanyMembers(company.id),
      ]);
      const nextSelected = forwarderPayload.forwarders[0] ?? null;
      setForwarders(forwarderPayload.forwarders);
      setDefaultFieldConfig(forwarderPayload.defaultFieldConfig);
      setMembers(memberPayload.members as Member[]);
      setSelectedId(nextSelected?.id ?? '');
      resetForm(nextSelected, forwarderPayload.defaultFieldConfig, company);
    } catch {
      setError('Kunde inte ladda intresseanmälan-inställningar.');
    } finally {
      setLoading(false);
    }
  }, [company, resetForm]);

  useEffect(() => {
    if (!open) return;
    setActivePanel('setup');
    void load();
  }, [load, open]);

  useEffect(() => {
    if (!open) return;
    resetForm(selected, defaultFieldConfig);
  }, [defaultFieldConfig, open, resetForm, selected]);

  const selectedMembers = useMemo(() => {
    const ids = new Set(form.recipientUserIds);
    return members.filter((member) => ids.has(member.userId));
  }, [form.recipientUserIds, members]);

  const requiredCount = useMemo(() => form.fields.filter((field) => field.required).length, [form.fields]);
  const customCount = useMemo(() => form.fields.filter((field) => field.target === 'custom').length, [form.fields]);
  const canSave = Boolean(form.name.trim() && form.sourceLabel.trim() && form.intakeAddress.trim() && form.fields.some((field) => field.key.trim() && field.label.trim()));

  const patchForm = (patch: Partial<LeadIntakeFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const updateField = (index: number, patch: Partial<LeadIntakeFieldMapping>) => {
    setForm((current) => ({
      ...current,
      fields: current.fields.map((field, idx) => idx === index ? { ...field, ...patch } : field),
    }));
  };

  const copyAddress = async () => {
    if (!form.intakeAddress.trim()) return;
    await navigator.clipboard.writeText(form.intakeAddress.trim());
    setCopyState('copied');
    window.setTimeout(() => setCopyState('idle'), 1400);
  };

  const save = async () => {
    if (!company) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        sourceLabel: form.sourceLabel.trim(),
        intakeAddress: form.intakeAddress.trim(),
        senderEmail: form.senderEmail.trim() || null,
        senderName: form.senderName.trim() || null,
        isActive: form.isActive,
        recipientUserIds: form.recipientUserIds,
        fieldConfig: {
          version: 1 as const,
          fields: form.fields
            .filter((field) => field.key.trim() && field.label.trim())
            .map((field, index) => ({
              ...field,
              key: field.key.trim(),
              label: field.label.trim(),
              order: index * 10 + 10,
            })),
        },
      };
      const saved = selected
        ? await updateLeadIntakeForwarder(company.id, selected.id, payload)
        : await createLeadIntakeForwarder(company.id, payload);
      await load();
      setSelectedId(saved.id);
    } catch {
      setError('Kunde inte spara forwardern. Kontrollera adress, fält och mottagare.');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    if (!company || !selected) return;
    setSaving(true);
    setError(null);
    try {
      await deactivateLeadIntakeForwarder(company.id, selected.id);
      await load();
    } catch {
      setError('Kunde inte inaktivera forwardern.');
    } finally {
      setSaving(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="fullscreen" size="xl" showMobileClose className="sm:h-[min(92dvh,900px)]">
        <TooltipProvider>
          <div className="flex h-full flex-col overflow-hidden">
            <DialogHeader className="border-b border-[var(--ui-border)] pr-12">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-accent)]">
                    <Mail size={19} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <DialogTitle>Intresseanmälan</DialogTitle>
                      <ForwarderStatus forwarder={selected} />
                    </div>
                    <DialogDescription className="mt-1">
                      {company.name} · Resend Inbound · {forwarders.length} konfigurationer
                    </DialogDescription>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 lg:min-w-[360px]">
                  <StatTile label="Aktiva" value={forwarders.filter((forwarder) => forwarder.isActive).length} />
                  <StatTile label="Mottagare" value={selectedMembers.length} />
                  <StatTile label="Fält" value={form.fields.length} />
                </div>
              </div>
            </DialogHeader>

            <ModalBody className="space-y-4 bg-[var(--ui-surface-subtle)]">
              {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

              <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                <ForwarderSidebar
                  loading={loading}
                  forwarders={forwarders}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id);
                    setActivePanel('setup');
                  }}
                  onNew={() => {
                    setSelectedId('');
                    resetForm(null, defaultFieldConfig, company);
                    setActivePanel('setup');
                  }}
                />

                <section className="min-w-0 space-y-4">
                  <div className="flex flex-col gap-3 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-subtle)] p-1">
                      {PANELS.map((panel) => (
                        <PanelButton
                          key={panel.value}
                          active={activePanel === panel.value}
                          label={panel.label}
                          onClick={() => setActivePanel(panel.value)}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="neutral">{requiredCount} krav</StatusBadge>
                      <StatusBadge tone="neutral">{customCount} extra</StatusBadge>
                      {selected?.updatedAt ? (
                        <StatusBadge tone="neutral">
                          Uppdaterad {formatDate(selected.updatedAt)}
                        </StatusBadge>
                      ) : null}
                    </div>
                  </div>

                  {activePanel === 'setup' ? (
                    <SetupPanel company={company} form={form} copyState={copyState} onCopyAddress={() => void copyAddress()} onFormChange={patchForm} />
                  ) : null}
                  {activePanel === 'recipients' ? (
                    <RecipientsPanel
                      members={members}
                      selectedMembers={selectedMembers}
                      recipientUserIds={form.recipientUserIds}
                      onRecipientIdsChange={(recipientUserIds) => patchForm({ recipientUserIds })}
                    />
                  ) : null}
                  {activePanel === 'fields' ? (
                    <FieldsPanel
                      fields={form.fields}
                      defaultFieldConfig={defaultFieldConfig}
                      onFieldsChange={(fields) => patchForm({ fields })}
                      onUpdateField={updateField}
                      onAddField={() => patchForm({ fields: [...form.fields, emptyField(form.fields.length * 10 + 10)] })}
                    />
                  ) : null}
                </section>
              </div>
            </ModalBody>

            <ModalActionFooter>
              <div className="mr-auto hidden min-w-0 items-center gap-2 text-xs text-[var(--ui-text-muted)] sm:flex">
                {selected ? (
                  <>
                    <span className="truncate">
                      {selected.recipients[0] ? recipientDisplayName(selected.recipients[0]) : 'Ingen mottagare'}
                    </span>
                    {selected.recipients.length > 1 ? <span>+{selected.recipients.length - 1}</span> : null}
                  </>
                ) : (
                  <span>Ny forwarder</span>
                )}
              </div>
              {selected ? (
                <Button type="button" variant="outline" onClick={() => void deactivate()} disabled={saving}>
                  Inaktivera
                </Button>
              ) : null}
              <Button type="button" onClick={() => void save()} disabled={saving || !canSave}>
                {saving ? 'Sparar...' : selected ? 'Spara ändringar' : 'Skapa forwarder'}
              </Button>
            </ModalActionFooter>
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
