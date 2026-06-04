'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { EnvelopeSimple, Plus, Trash } from '@phosphor-icons/react';
import { listCompanyMembers, type Company } from '@shared/lib/api/companies.api';
import {
  createLeadIntakeForwarder,
  deactivateLeadIntakeForwarder,
  listLeadIntakeForwarders,
  updateLeadIntakeForwarder,
  type LeadIntakeFieldConfig,
  type LeadIntakeFieldMapping,
  type LeadIntakeFieldTarget,
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
  ModalSection,
} from '@shared/ui/dialog';

type Member = {
  userId: string;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
};

interface LeadIntakeDialogProps {
  open: boolean;
  company: Company | null;
  onOpenChange: (open: boolean) => void;
}

const TARGETS: Array<{ value: LeadIntakeFieldTarget; label: string }> = [
  { value: 'name', label: 'Namn' },
  { value: 'email', label: 'E-post' },
  { value: 'phone', label: 'Telefon' },
  { value: 'address', label: 'Adress' },
  { value: 'postalCode', label: 'Postnummer' },
  { value: 'requestedService', label: 'Tjänst' },
  { value: 'message', label: 'Meddelande' },
  { value: 'referralSource', label: 'Källa/referral' },
  { value: 'custom', label: 'Extra fält' },
];

const inputCls = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none';
const labelCls = 'mb-1.5 block text-xs font-medium text-[var(--text-secondary)]';

function displayName(user: Member['user']) {
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
}

function emptyField(order: number): LeadIntakeFieldMapping {
  return { key: `custom_${order}`, label: '', target: 'custom', order };
}

function toRecipientIds(forwarder: LeadIntakeForwarder | null) {
  return forwarder?.recipients.map((recipient) => recipient.userId) ?? [];
}

export function LeadIntakeDialog({ open, company, onOpenChange }: LeadIntakeDialogProps) {
  const [forwarders, setForwarders] = useState<LeadIntakeForwarder[]>([]);
  const [defaultFieldConfig, setDefaultFieldConfig] = useState<LeadIntakeFieldConfig | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => forwarders.find((forwarder) => forwarder.id === selectedId) ?? null,
    [forwarders, selectedId],
  );

  const [form, setForm] = useState({
    name: 'Framer website',
    sourceLabel: 'Framer website',
    intakeAddress: '',
    senderEmail: '',
    senderName: '',
    isActive: true,
    recipientUserIds: [] as string[],
    fields: [] as LeadIntakeFieldMapping[],
  });

  const resetForm = useCallback((forwarder: LeadIntakeForwarder | null, fallback?: LeadIntakeFieldConfig | null) => {
    setForm({
      name: forwarder?.name ?? 'Framer website',
      sourceLabel: forwarder?.sourceLabel ?? 'Framer website',
      intakeAddress: forwarder?.intakeAddress ?? '',
      senderEmail: forwarder?.senderEmail ?? '',
      senderName: forwarder?.senderName ?? '',
      isActive: forwarder?.isActive ?? true,
      recipientUserIds: toRecipientIds(forwarder),
      fields: [...(forwarder?.fieldConfig.fields ?? fallback?.fields ?? [])].sort((a, b) => a.order - b.order),
    });
  }, []);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    setError(null);
    try {
      const [forwarderPayload, memberPayload] = await Promise.all([
        listLeadIntakeForwarders(company.id),
        listCompanyMembers(company.id),
      ]);
      setForwarders(forwarderPayload.forwarders);
      setDefaultFieldConfig(forwarderPayload.defaultFieldConfig);
      setMembers(memberPayload.members as Member[]);
      const nextSelected = forwarderPayload.forwarders[0] ?? null;
      setSelectedId(nextSelected?.id ?? '');
      resetForm(nextSelected, forwarderPayload.defaultFieldConfig);
    } catch {
      setError('Kunde inte ladda intresseanmälan-inställningar.');
    } finally {
      setLoading(false);
    }
  }, [company, resetForm]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [load, open]);

  useEffect(() => {
    if (!open) return;
    resetForm(selected, defaultFieldConfig);
  }, [defaultFieldConfig, open, resetForm, selected]);

  const updateField = (index: number, patch: Partial<LeadIntakeFieldMapping>) => {
    setForm((current) => ({
      ...current,
      fields: current.fields.map((field, idx) => idx === index ? { ...field, ...patch } : field),
    }));
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
            .map((field, index) => ({ ...field, order: index * 10 + 10 })),
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
      <DialogContent mobileVariant="right-panel" size="right-panel" showMobileClose>
        <div className="flex h-full flex-col overflow-hidden">
          <DialogHeader className="border-b border-[var(--border)] pr-12">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                <EnvelopeSimple size={19} weight="duotone" />
              </div>
              <div>
                <DialogTitle>Intresseanmälan</DialogTitle>
                <DialogDescription className="mt-1">
                  Styr inkommande formulär, fält och mottagare för {company.name}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ModalBody className="space-y-4">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            ) : null}

            <ModalSection tone="subtle" className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Forwarders</p>
                  <p className="text-xs text-[var(--text-muted)]">En unik intake-adress per källa/företag.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedId('');
                    resetForm(null, defaultFieldConfig);
                  }}
                >
                  <Plus size={14} weight="bold" />
                  Ny
                </Button>
              </div>
              {loading ? (
                <div className="h-16 animate-pulse rounded-xl bg-[var(--surface)]" />
              ) : forwarders.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">Ingen forwarder konfigurerad ännu.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {forwarders.map((forwarder) => (
                    <button
                      key={forwarder.id}
                      type="button"
                      onClick={() => setSelectedId(forwarder.id)}
                      className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                        selectedId === forwarder.id
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]'
                      }`}
                    >
                      <span className="block font-semibold">{forwarder.name}</span>
                      <span className="block truncate">{forwarder.intakeAddress}</span>
                    </button>
                  ))}
                </div>
              )}
            </ModalSection>

            <ModalSection className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Namn</label>
                  <input className={inputCls} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Källa</label>
                  <input className={inputCls} value={form.sourceLabel} onChange={(event) => setForm((current) => ({ ...current, sourceLabel: event.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Intake-adress</label>
                  <input className={inputCls} type="email" value={form.intakeAddress} placeholder="framer-soleria@leads.example.se" onChange={(event) => setForm((current) => ({ ...current, intakeAddress: event.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Avsändarnamn</label>
                  <input className={inputCls} value={form.senderName} placeholder={`${company.name} Intresseanmälan`} onChange={(event) => setForm((current) => ({ ...current, senderName: event.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Avsändaradress</label>
                  <input className={inputCls} type="email" value={form.senderEmail} placeholder="leads@dindoman.se" onChange={(event) => setForm((current) => ({ ...current, senderEmail: event.target.value }))} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                />
                Aktiv forwarder
              </label>
            </ModalSection>

            <ModalSection tone="subtle" className="space-y-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Mottagare</p>
              <div className="space-y-2">
                {members.map((member) => (
                  <label key={member.userId} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface)] px-3 py-2 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-[var(--text-primary)]">{displayName(member.user)}</span>
                      <span className="block truncate text-xs text-[var(--text-muted)]">{member.user.email}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={form.recipientUserIds.includes(member.userId)}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          recipientUserIds: event.target.checked
                            ? [...current.recipientUserIds, member.userId]
                            : current.recipientUserIds.filter((id) => id !== member.userId),
                        }));
                      }}
                    />
                  </label>
                ))}
                {members.length === 0 ? <p className="text-sm text-[var(--text-muted)]">Lägg till företagsanvändare först.</p> : null}
              </div>
            </ModalSection>

            <ModalSection className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Fältmappning</p>
                  <p className="text-xs text-[var(--text-muted)]">Etiketterna matchas mot raderna i Framer-mejlet.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm((current) => ({ ...current, fields: [...current.fields, emptyField(current.fields.length * 10 + 10)] }))}
                >
                  <Plus size={14} weight="bold" />
                  Fält
                </Button>
              </div>

              <div className="space-y-2">
                {form.fields.map((field, index) => (
                  <div key={`${field.key}:${index}`} className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
                    <input className={inputCls} value={field.key} placeholder="key" onChange={(event) => updateField(index, { key: event.target.value })} />
                    <input className={inputCls} value={field.label} placeholder="Label i mejlet" onChange={(event) => updateField(index, { label: event.target.value })} />
                    <select className={inputCls} value={field.target} onChange={(event) => updateField(index, { target: event.target.value as LeadIntakeFieldTarget })}>
                      {TARGETS.map((target) => <option key={target.value} value={target.value}>{target.label}</option>)}
                    </select>
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <input type="checkbox" checked={Boolean(field.required)} onChange={(event) => updateField(index, { required: event.target.checked })} />
                        Krävs
                      </label>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600"
                        onClick={() => setForm((current) => ({ ...current, fields: current.fields.filter((_, idx) => idx !== index) }))}
                        title="Ta bort fält"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </ModalSection>
          </ModalBody>

          <ModalActionFooter>
            {selected ? (
              <Button type="button" variant="outline" onClick={() => void deactivate()} disabled={saving}>
                Inaktivera
              </Button>
            ) : <span />}
            <Button type="button" onClick={() => void save()} disabled={saving || !form.name || !form.sourceLabel || !form.intakeAddress}>
              {saving ? 'Sparar...' : 'Spara forwarder'}
            </Button>
          </ModalActionFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
