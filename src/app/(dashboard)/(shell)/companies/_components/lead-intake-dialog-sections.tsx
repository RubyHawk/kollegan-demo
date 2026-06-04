'use client';

import { Clipboard, FlowArrow, Plus, Trash } from '@phosphor-icons/react';
import type { Company } from '@shared/lib/api/companies.api';
import type {
  LeadIntakeFieldConfig,
  LeadIntakeFieldMapping,
  LeadIntakeFieldTarget,
  LeadIntakeForwarder,
} from '@shared/lib/api/lead-intake-forwarders.api';
import { Button } from '@shared/ui/button';
import { ModalSection } from '@shared/ui/dialog';
import { Input } from '@shared/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/ui/tooltip';
import {
  buildSenderName,
  displayName,
  sortFields,
  type LeadIntakeFormState,
  type Member,
} from './lead-intake-dialog-model';
import {
  FieldTargetSelect,
  ForwarderCard,
  RecipientToggle,
} from './lead-intake-dialog-parts';

const inputLabelClass = 'text-xs font-semibold text-[var(--text-secondary)]';

export function ForwarderSidebar({
  loading,
  forwarders,
  selectedId,
  onSelect,
  onNew,
}: {
  loading: boolean;
  forwarders: LeadIntakeForwarder[];
  selectedId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <aside className="space-y-3">
      <ModalSection className="space-y-3 bg-[var(--surface)] p-4" tone="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Forwarders</p>
            <p className="text-xs text-[var(--text-muted)]">En adress per inkommande kalla.</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="icon" onClick={onNew} aria-label="Ny forwarder">
                <Plus size={16} weight="bold" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ny forwarder</TooltipContent>
          </Tooltip>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-24 animate-pulse rounded-2xl bg-[var(--surface-alt)]" />
            <div className="h-24 animate-pulse rounded-2xl bg-[var(--surface-alt)]" />
          </div>
        ) : forwarders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-4 py-5 text-sm text-[var(--text-muted)]">
            Ingen forwarder konfigurerad.
          </div>
        ) : (
          <div className="space-y-2">
            {forwarders.map((forwarder) => (
              <ForwarderCard
                key={forwarder.id}
                forwarder={forwarder}
                selected={selectedId === forwarder.id}
                onSelect={() => onSelect(forwarder.id)}
              />
            ))}
          </div>
        )}
      </ModalSection>

      <ModalSection className="space-y-3 bg-[var(--surface)] p-4" tone="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <FlowArrow size={16} weight="duotone" className="text-[var(--accent)]" />
          Flode
        </div>
        <div className="space-y-2 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2 rounded-xl bg-[var(--surface-alt)] px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span>Resend tar emot pa intake-adressen</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[var(--surface-alt)] px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Lead skapas och kund lankas</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[var(--surface-alt)] px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            <span>Forwarding skickas till mottagare</span>
          </div>
        </div>
      </ModalSection>
    </aside>
  );
}

export function SetupPanel({
  company,
  form,
  copyState,
  onCopyAddress,
  onFormChange,
}: {
  company: Company;
  form: LeadIntakeFormState;
  copyState: 'idle' | 'copied';
  onCopyAddress: () => void;
  onFormChange: (patch: Partial<LeadIntakeFormState>) => void;
}) {
  return (
    <ModalSection className="bg-[var(--surface)] p-4 sm:p-5" tone="card">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className={inputLabelClass}>Namn</span>
              <Input value={form.name} onChange={(event) => onFormChange({ name: event.target.value })} />
            </label>
            <label className="space-y-1.5">
              <span className={inputLabelClass}>Kalla</span>
              <Input value={form.sourceLabel} onChange={(event) => onFormChange({ sourceLabel: event.target.value })} />
            </label>
          </div>

          <label className="space-y-1.5">
            <span className={inputLabelClass}>Intake-adress</span>
            <div className="flex gap-2">
              <Input
                type="email"
                value={form.intakeAddress}
                placeholder="framer-soleria@leads.example.se"
                onChange={(event) => onFormChange({ intakeAddress: event.target.value })}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onCopyAddress}
                    disabled={!form.intakeAddress.trim()}
                    aria-label="Kopiera intake-adress"
                  >
                    <Clipboard size={16} weight="duotone" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copyState === 'copied' ? 'Kopierad' : 'Kopiera adress'}</TooltipContent>
              </Tooltip>
            </div>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className={inputLabelClass}>Avsandarnamn</span>
              <Input
                value={form.senderName}
                placeholder={buildSenderName(company)}
                onChange={(event) => onFormChange({ senderName: event.target.value })}
              />
            </label>
            <label className="space-y-1.5">
              <span className={inputLabelClass}>Avsandaradress</span>
              <Input
                type="email"
                value={form.senderEmail}
                placeholder="leads@dindoman.se"
                onChange={(event) => onFormChange({ senderEmail: event.target.value })}
              />
            </label>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-[var(--border-light)] bg-[var(--surface-alt)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Status</p>
              <p className="text-xs text-[var(--text-muted)]">{form.isActive ? 'Tar emot nya mail' : 'Pausad'}</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--accent)]"
                checked={form.isActive}
                onChange={(event) => onFormChange({ isActive: event.target.checked })}
              />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Aktiv</span>
            </label>
          </div>

          <div className="rounded-xl bg-[var(--surface)] px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Forwarding identity</p>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
              {form.senderName.trim() || buildSenderName(company)}
            </p>
            <p className="truncate text-xs text-[var(--text-muted)]">
              {form.senderEmail.trim() || 'Standard transport'}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--surface)] px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Lead origin</p>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">{form.sourceLabel || 'Framer website'}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">{company.name}</p>
          </div>
        </div>
      </div>
    </ModalSection>
  );
}

export function RecipientsPanel({
  members,
  selectedMembers,
  recipientUserIds,
  onRecipientIdsChange,
}: {
  members: Member[];
  selectedMembers: Member[];
  recipientUserIds: string[];
  onRecipientIdsChange: (ids: string[]) => void;
}) {
  return (
    <ModalSection className="bg-[var(--surface)] p-4 sm:p-5" tone="card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Mottagare</p>
          <p className="text-xs text-[var(--text-muted)]">{selectedMembers.length} valda av {members.length} medlemmar</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRecipientIdsChange(members.map((member) => member.userId))}
            disabled={members.length === 0}
          >
            Valj alla
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRecipientIdsChange([])}
            disabled={recipientUserIds.length === 0}
          >
            Rensa
          </Button>
        </div>
      </div>

      {selectedMembers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((member) => (
            <span key={member.userId} className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              {displayName(member.user)}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid gap-2 md:grid-cols-2">
        {members.map((member) => (
          <RecipientToggle
            key={member.userId}
            member={member}
            checked={recipientUserIds.includes(member.userId)}
            onCheckedChange={(checked) => {
              onRecipientIdsChange(checked
                ? [...recipientUserIds, member.userId]
                : recipientUserIds.filter((id) => id !== member.userId));
            }}
          />
        ))}
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-4 py-6 text-sm text-[var(--text-muted)]">
          Lagg till foretagsmedlemmar forst.
        </div>
      ) : null}
    </ModalSection>
  );
}

export function FieldsPanel({
  fields,
  defaultFieldConfig,
  onFieldsChange,
  onUpdateField,
  onAddField,
}: {
  fields: LeadIntakeFieldMapping[];
  defaultFieldConfig: LeadIntakeFieldConfig | null;
  onFieldsChange: (fields: LeadIntakeFieldMapping[]) => void;
  onUpdateField: (index: number, patch: Partial<LeadIntakeFieldMapping>) => void;
  onAddField: () => void;
}) {
  return (
    <ModalSection className="bg-[var(--surface)] p-4 sm:p-5" tone="card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Faltmappning</p>
          <p className="text-xs text-[var(--text-muted)]">{fields.length} etiketter matchas mot inkommande mail</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onFieldsChange(sortFields(defaultFieldConfig?.fields ?? []))}
            disabled={!defaultFieldConfig}
          >
            Framer-mall
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onAddField}>
            <Plus size={14} weight="bold" />
            Falt
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
        <div className="hidden grid-cols-[1.05fr_0.9fr_180px_86px_44px] gap-2 border-b border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] lg:grid">
          <span>Label i mail</span>
          <span>Nyckel</span>
          <span>CRM-falt</span>
          <span>Krav</span>
          <span />
        </div>
        <div className="divide-y divide-[var(--border)]">
          {fields.map((field, index) => (
            <div key={`${field.key}:${index}`} className="grid gap-2 bg-[var(--surface)] p-3 lg:grid-cols-[1.05fr_0.9fr_180px_86px_44px] lg:items-center">
              <label className="space-y-1 lg:space-y-0">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] lg:hidden">Label i mail</span>
                <Input value={field.label} placeholder="Namn" onChange={(event) => onUpdateField(index, { label: event.target.value })} />
              </label>
              <label className="space-y-1 lg:space-y-0">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] lg:hidden">Nyckel</span>
                <Input value={field.key} placeholder="name" onChange={(event) => onUpdateField(index, { key: event.target.value })} />
              </label>
              <FieldTargetSelect value={field.target} onChange={(value: LeadIntakeFieldTarget) => onUpdateField(index, { target: value })} />
              <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--accent)]"
                  checked={Boolean(field.required)}
                  onChange={(event) => onUpdateField(index, { required: event.target.checked })}
                />
                Krav
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onFieldsChange(fields.filter((_, idx) => idx !== index))}
                aria-label="Ta bort falt"
                className="text-[var(--text-muted)] hover:text-red-600"
              >
                <Trash size={16} weight="duotone" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </ModalSection>
  );
}
