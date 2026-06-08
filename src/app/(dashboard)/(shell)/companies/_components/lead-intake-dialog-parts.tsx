'use client';

import {
  AlertTriangle,
  CheckCircle,
  CircleUser,
  Settings,
} from 'lucide-react';
import type {
  LeadIntakeFieldTarget,
  LeadIntakeForwarder,
} from '@shared/lib/api/lead-intake-forwarders.api';
import { cn } from '@shared/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { StatusBadge } from '@shared/ui/status-badge';
import {
  displayName,
  targetMeta,
  TARGETS,
  type Member,
} from './lead-intake-dialog-model';

export function ForwarderStatus({ forwarder }: { forwarder: LeadIntakeForwarder | null }) {
  if (!forwarder) {
    return (
      <StatusBadge tone="neutral">
        <Settings size={12} strokeWidth={1.75} />
        Ny
      </StatusBadge>
    );
  }

  return forwarder.isActive ? (
    <StatusBadge tone="success">
      <CheckCircle size={12} strokeWidth={1.75} />
      Aktiv
    </StatusBadge>
  ) : (
    <StatusBadge tone="warning">
      <AlertTriangle size={12} strokeWidth={1.75} />
      Pausad
    </StatusBadge>
  );
}

export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2">
      <p className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[var(--ui-text)]">{value}</p>
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
        'h-9 rounded-[var(--ui-radius-md)] px-3 text-sm font-semibold text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
        active && 'border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)]',
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
        'w-full rounded-[var(--ui-radius-lg)] border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
        selected
          ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)]'
          : 'border-[var(--ui-border)] bg-[var(--ui-surface)] hover:bg-[var(--ui-surface-hover)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{forwarder.name}</p>
          <p className="mt-1 truncate text-xs text-[var(--ui-text-muted)]">{forwarder.intakeAddress}</p>
        </div>
        <ForwarderStatus forwarder={forwarder} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge tone="neutral">{forwarder.sourceLabel}</StatusBadge>
        <StatusBadge tone="neutral">{forwarder.recipients.length} mottagare</StatusBadge>
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
        'flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-[var(--ui-radius-lg)] border px-3 py-3 transition-colors',
        checked
          ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)]'
          : 'border-[var(--ui-border)] bg-[var(--ui-surface)] hover:bg-[var(--ui-surface-hover)]',
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-muted)]">
          <CircleUser size={18} strokeWidth={1.75} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[var(--ui-text)]">{displayName(member.user)}</span>
          <span className="block truncate text-xs text-[var(--ui-text-muted)]">{member.user.email}</span>
        </span>
      </span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-[var(--ui-accent)]"
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
      <SelectTrigger className="h-10 bg-[var(--ui-surface-subtle)]">
        <SelectValue>
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
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
