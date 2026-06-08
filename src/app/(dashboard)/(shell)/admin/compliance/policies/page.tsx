'use client';

import { Fragment, useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, FileText, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import {
  createPolicy,
  deletePolicy as deletePolicyRequest,
  listPolicies,
  type Policy,
  type PolicyStatus,
} from '@shared/lib/api/compliance.api';
import { Button } from '@shared/ui/button';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { EmptyState } from '@shared/ui/empty-state';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Input } from '@shared/ui/input';
import { Panel } from '@shared/ui/panel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import { Textarea } from '@shared/ui/textarea';

const STATUS_LABEL: Record<PolicyStatus, string> = {
  draft: 'Utkast',
  active: 'Aktiv',
  retired: 'Arkiverad',
};

const STATUS_TONE: Record<PolicyStatus, StatusTone> = {
  draft: 'neutral',
  active: 'success',
  retired: 'danger',
};

const POLICY_CATEGORIES = [
  'Access Control',
  'Asset Management',
  'Cryptography',
  'Data Retention',
  'Incident Response',
  'Information Classification',
  'Network Security',
  'Password Policy',
  'Physical Security',
  'Risk Assessment',
  'Secure Development',
  'Supplier Management',
  'Vulnerability Management',
];

const EMPTY_FORM = {
  name: '',
  category: '',
  content: '',
  version: '1.0',
  reviewCycleDays: 365,
  owner: '',
};

type PolicyFormState = typeof EMPTY_FORM;

function fmt(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function reviewDueTone(iso: string | null): StatusTone {
  if (!iso) return 'neutral';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'danger';
  if (diff < 30 * 86_400_000) return 'warning';
  return 'neutral';
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PolicyFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null);
  const [confirmDeletePolicy, setConfirmDeletePolicy] = useState<Policy | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listPolicies({ limit: 50, offset: 0 });
      setPolicies(result.policies);
    } catch {
      setError('Kunde inte ladda policyer. Kontrollera anslutningen och försök igen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const savePolicy = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await createPolicy({
        name: form.name,
        category: form.category,
        content: form.content,
        version: form.version,
        reviewCycleDays: form.reviewCycleDays,
        owner: form.owner || undefined,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch {
      setError('Kunde inte spara. Kontrollera anslutningen och försök igen.');
    } finally {
      setSaving(false);
    }
  }, [form, load]);

  const deletePolicy = useCallback(async (id: string) => {
    setDeletingPolicyId(id);
    try {
      await deletePolicyRequest(id);
      await load();
    } catch {
      setError('Kunde inte ta bort. Försök igen.');
    } finally {
      setDeletingPolicyId(null);
      setConfirmDeletePolicy(null);
    }
  }, [load]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" aria-label="Till compliance">
              <Link href="/admin/compliance"><ArrowLeft size={16} strokeWidth={1.75} /></Link>
            </Button>
            <h1 className="text-xl font-semibold text-[var(--ui-text)]">Policyer</h1>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-[var(--ui-text-muted)]">
            ISO 27001, informationssäkerhetspolicyer och granskningsschema.
          </p>
          <StatusBadge tone="neutral">{policies.length} policyer</StatusBadge>
        </div>
        <Button type="button" onClick={() => setShowForm(true)}>
          <Plus size={16} strokeWidth={1.75} />
          Ny policy
        </Button>
      </header>

      {error ? <InlineAlert tone="danger" title="Policyvalvet kunde inte uppdateras">{error}</InlineAlert> : null}

      {showForm ? (
        <PolicyForm
          form={form}
          saving={saving}
          onChange={setForm}
          onCancel={() => {
            setShowForm(false);
            setForm(EMPTY_FORM);
          }}
          onSave={() => void savePolicy()}
        />
      ) : null}

      {loading ? (
        <Panel className="grid min-h-64 place-items-center">
          <div className="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
            <LoaderCircle size={18} strokeWidth={1.75} className="animate-spin" />
            Laddar policyer...
          </div>
        </Panel>
      ) : (
        <Panel padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--ui-border)] text-sm">
              <thead className="sticky top-0 bg-[var(--ui-surface-subtle)]">
                <tr>
                  {['Namn', 'Kategori', 'Version', 'Status', 'Ägare', 'Nästa granskning', 'Godkänd', ''].map((header) => (
                    <th key={header} className="h-10 px-4 text-left text-xs font-semibold uppercase text-[var(--ui-text-muted)]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
                {policies.map((policy) => (
                  <Fragment key={policy.id}>
                    <tr
                      className="h-10 cursor-pointer transition-colors hover:bg-[var(--ui-surface-hover)] focus-within:bg-[var(--ui-surface-selected)]"
                      onClick={() => setExpanded(expanded === policy.id ? null : policy.id)}
                    >
                      <td className="px-4 py-3 font-medium text-[var(--ui-text)]">
                        <div className="flex items-center gap-2">
                          <ChevronRight size={14} strokeWidth={1.75} className={cn('text-[var(--ui-text-muted)] transition-transform', expanded === policy.id && 'rotate-90')} />
                          {policy.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--ui-text-secondary)]">{policy.category}</td>
                      <td className="px-4 py-3"><StatusBadge tone="neutral">v{policy.version}</StatusBadge></td>
                      <td className="px-4 py-3"><StatusBadge tone={STATUS_TONE[policy.status]}>{STATUS_LABEL[policy.status]}</StatusBadge></td>
                      <td className="px-4 py-3 text-[var(--ui-text-muted)]">{policy.owner ?? '-'}</td>
                      <td className="px-4 py-3"><StatusBadge tone={reviewDueTone(policy.nextReviewDate)}>{fmt(policy.nextReviewDate)}</StatusBadge></td>
                      <td className="px-4 py-3 text-[var(--ui-text-muted)]">{fmt(policy.approvedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="compact"
                          onClick={(event) => {
                            event.stopPropagation();
                            setConfirmDeletePolicy(policy);
                          }}
                          disabled={deletingPolicyId === policy.id}
                        >
                          <Trash2 size={16} strokeWidth={1.75} />
                          Ta bort
                        </Button>
                      </td>
                    </tr>
                    {expanded === policy.id ? (
                      <tr>
                        <td colSpan={8} className="bg-[var(--ui-surface-subtle)] px-6 py-5">
                          <p className="mb-2 text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Innehåll</p>
                          <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 font-mono text-xs leading-5 text-[var(--ui-text-secondary)]">
                            {policy.content}
                          </pre>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
                {policies.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon={FileText}
                        title="Inga policyer ännu"
                        description="Lägg till den första policyn för policyvalvet."
                        actionLabel="Ny policy"
                        onAction={() => setShowForm(true)}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <ConfirmDestructiveDialog
        open={Boolean(confirmDeletePolicy)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeletePolicy(null);
        }}
        title="Ta bort policy?"
        description={
          confirmDeletePolicy
            ? `"${confirmDeletePolicy.name}" tas bort från policyvalvet. Det här går inte att ångra.`
            : 'Policyn tas bort från policyvalvet. Det här går inte att ångra.'
        }
        confirmLabel="Ta bort policy"
        loading={Boolean(confirmDeletePolicy && deletingPolicyId === confirmDeletePolicy.id)}
        onConfirm={() => {
          if (!confirmDeletePolicy) return;
          void deletePolicy(confirmDeletePolicy.id);
        }}
      />
    </div>
  );
}

function PolicyForm({
  form,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  form: PolicyFormState;
  saving: boolean;
  onChange: (next: PolicyFormState | ((current: PolicyFormState) => PolicyFormState)) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const setField = <Key extends keyof PolicyFormState>(key: Key, value: PolicyFormState[Key]) => {
    onChange((current) => ({ ...current, [key]: value }));
  };

  return (
    <Panel variant="selected" className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--ui-text)]">Ny policy</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Namn"><Input value={form.name} onChange={(event) => setField('name', event.target.value)} /></Field>
        <Field label="Kategori">
          <Select value={form.category} onValueChange={(value) => setField('category', value)}>
            <SelectTrigger><SelectValue placeholder="Välj kategori..." /></SelectTrigger>
            <SelectContent>{POLICY_CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Version"><Input value={form.version} onChange={(event) => setField('version', event.target.value)} /></Field>
        <Field label="Granskningscykel (dagar)">
          <Input type="number" min={30} max={730} value={form.reviewCycleDays} onChange={(event) => setField('reviewCycleDays', parseInt(event.target.value, 10))} />
        </Field>
        <Field label="Ägare"><Input value={form.owner} onChange={(event) => setField('owner', event.target.value)} /></Field>
        <Field label="Innehåll (Markdown)" className="sm:col-span-2">
          <Textarea
            value={form.content}
            rows={6}
            onChange={(event) => setField('content', event.target.value)}
            placeholder="# Policy Title&#10;&#10;## Syfte&#10;&#10;## Räckvidd&#10;&#10;## Policy"
            className="font-mono"
          />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSave} disabled={saving} loading={saving}>Spara policy</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Avbryt</Button>
      </div>
    </Panel>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return <label className={cn('space-y-1.5 text-xs font-semibold text-[var(--ui-text-secondary)]', className)}><span>{label}</span>{children}</label>;
}
