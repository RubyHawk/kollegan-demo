'use client';

import {
  CheckCircle,
  GearSix,
  UserCircle,
  WarningCircle,
} from '@phosphor-icons/react';
import type {
  LeadIntakeFieldTarget,
  LeadIntakeForwarder,
} from '@shared/lib/api/lead-intake-forwarders.api';
import { cn } from '@shared/lib/utils';
import { Badge } from '@shared/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import {
  displayName,
  targetMeta,
  TARGETS,
  type Member,
} from './lead-intake-dialog-model';

export function ForwarderStatus({ forwarder }: { forwarder: LeadIntakeForwarder | null }) {
  if (!forwarder) {
    return (
      <Badge variant="secondary" className="gap-1.5 rounded-full">
        <GearSix size={12} weight="bold" />
        Ny
      </Badge>
    );
  }

  return forwarder.isActive ? (
    <Badge className="gap-1.5 rounded-full bg-emerald-600 text-white">
      <CheckCircle size={12} weight="bold" />
      Aktiv
    </Badge>
  ) : (
    <Badge variant="warning" className="gap-1.5 rounded-full">
      <WarningCircle size={12} weight="bold" />
      Pausad
    </Badge>
  );
}

export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--surface-alt)] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export function PanelButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-9 rounded-lg px-3 text-sm font-semibold transition-colors',
        active
          ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--border)]'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
      )}
    >
      {label}
    </button>
  );
}

export function ForwarderCard({
  forwarder,
  selected,
  onSelect,
}: {
  forwarder: LeadIntakeForwarder;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-2xl border p-3 text-left transition-colors',
        selected
          ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-sm'
          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{forwarder.name}</p>
          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{forwarder.intakeAddress}</p>
        </div>
        <ForwarderStatus forwarder={forwarder} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-[var(--border-light)] bg-[var(--surface-alt)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
          {forwarder.sourceLabel}
        </span>
        <span className="rounded-full border border-[var(--border-light)] bg-[var(--surface-alt)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
          {forwarder.recipients.length} mottagare
        </span>
      </div>
    </button>
  );
}

export function RecipientToggle({
  member,
  checked,
  onCheckedChange,
}: {
  member: Member;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        'flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3 py-3 transition-colors',
        checked
          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]',
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-light)] bg-[var(--surface-alt)] text-[var(--text-muted)]">
          <UserCircle size={18} weight="duotone" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{displayName(member.user)}</span>
          <span className="block truncate text-xs text-[var(--text-muted)]">{member.user.email}</span>
        </span>
      </span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-[var(--accent)]"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
    </label>
  );
}

export function FieldTargetSelect({
  value,
  onChange,
}: {
  value: LeadIntakeFieldTarget;
  onChange: (value: LeadIntakeFieldTarget) => void;
}) {
  const meta = targetMeta(value);
  return (
    <Select value={value} onValueChange={(next) => onChange(next as LeadIntakeFieldTarget)}>
      <SelectTrigger className="h-10 bg-[var(--surface-alt)]">
        <SelectValue>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold ring-1', meta.tone)}>
            {meta.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TARGETS.map((target) => (
          <SelectItem key={target.value} value={target.value}>
            {target.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
