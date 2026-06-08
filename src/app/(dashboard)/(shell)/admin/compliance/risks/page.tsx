'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import {
  createRisk,
  deleteRisk as deleteRiskRequest,
  listRisks,
  type Risk,
  type RiskStatus,
  type RiskTreatment,
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

const STATUS_TABS: { key: RiskStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Alla' },
  { key: 'open', label: 'Öppna' },
  { key: 'in_progress', label: 'Pågående' },
  { key: 'resolved', label: 'Lösta' },
  { key: 'accepted', label: 'Accepterade' },
];

const STATUS_LABEL: Record<RiskStatus, string> = {
  open: 'Öppen',
  in_progress: 'Pågående',
  resolved: 'Löst',
  accepted: 'Accepterad',
};

const STATUS_TONE: Record<RiskStatus, StatusTone> = {
  open: 'danger',
  in_progress: 'warning',
  resolved: 'success',
  accepted: 'neutral',
};

const TREATMENT_LABEL: Record<RiskTreatment, string> = {
  mitigate: 'Minska',
  accept: 'Acceptera',
  transfer: 'Överför',
  avoid: 'Undvik',
};

type RiskScore = { tone: StatusTone; label: string };

function riskScore(score: number): RiskScore {
  if (score <= 6) return { tone: 'success', label: 'Låg' };
  if (score <= 14) return { tone: 'warning', label: 'Medium' };
  return { tone: 'danger', label: 'Hög' };
}

function fmt(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = {
  asset: '',
  threat: '',
  vulnerability: '',
  likelihood: 3,
  impact: 3,
  treatment: 'mitigate' as RiskTreatment,
  treatmentDesc: '',
  owner: '',
  dueDate: '',
};

type RiskFormState = typeof EMPTY_FORM;

export default function RisksPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<RiskStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RiskFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingRiskId, setDeletingRiskId] = useState<string | null>(null);
  const [confirmDeleteRisk, setConfirmDeleteRisk] = useState<Risk | null>(null);

  const load = useCallback(async (status?: RiskStatus) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listRisks({ status, limit: 50, offset: 0 });
      setRisks(result.risks);
      setTotal(result.total);
    } catch {
      setError('Kunde inte ladda risker. Kontrollera anslutningen och försök igen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab === 'all' ? undefined : tab);
  }, [load, tab]);

  const saveRisk = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await createRisk({
        asset: form.asset,
        threat: form.threat,
        vulnerability: form.vulnerability,
        likelihood: form.likelihood,
        impact: form.impact,
        treatment: form.treatment,
        treatmentDesc: form.treatmentDesc || undefined,
        owner: form.owner || undefined,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load(tab === 'all' ? undefined : tab);
    } catch {
      setError('Kunde inte spara. Kontrollera anslutningen och försök igen.');
    } finally {
      setSaving(false);
    }
  }, [form, load, tab]);

  const deleteRisk = useCallback(async (id: string) => {
    setDeletingRiskId(id);
    try {
      await deleteRiskRequest(id);
      await load(tab === 'all' ? undefined : tab);
    } catch {
      setError('Kunde inte ta bort. Försök igen.');
    } finally {
      setDeletingRiskId(null);
      setConfirmDeleteRisk(null);
    }
  }, [load, tab]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" aria-label="Till compliance">
              <Link href="/admin/compliance"><ArrowLeft size={16} strokeWidth={1.75} /></Link>
            </Button>
            <h1 className="text-xl font-semibold text-[var(--ui-text)]">Riskregister</h1>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-[var(--ui-text-muted)]">
            ISO 27001, riskbedömning och hantering av informationssäkerhet.
          </p>
          <StatusBadge tone="neutral">{total} risker totalt</StatusBadge>
        </div>
        <Button type="button" onClick={() => setShowForm(true)}>
          <Plus size={16} strokeWidth={1.75} />
          Ny risk
        </Button>
      </header>

      {error ? <InlineAlert tone="danger" title="Riskregistret kunde inte uppdateras">{error}</InlineAlert> : null}

      <Panel padding="sm">
        <div className="flex gap-1 overflow-x-auto rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-1">
          {STATUS_TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                'h-8 whitespace-nowrap rounded-[var(--ui-radius-sm)] px-3 text-sm font-medium text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2',
                tab === item.key && 'border border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-text)]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Panel>

      {showForm ? (
        <RiskForm
          form={form}
          saving={saving}
          onChange={setForm}
          onCancel={() => {
            setShowForm(false);
            setForm(EMPTY_FORM);
          }}
          onSave={() => void saveRisk()}
        />
      ) : null}

      {loading ? (
        <Panel className="grid min-h-64 place-items-center">
          <div className="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
            <LoaderCircle size={18} strokeWidth={1.75} className="animate-spin" />
            Laddar risker...
          </div>
        </Panel>
      ) : (
        <Panel padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--ui-border)] text-sm">
              <thead className="sticky top-0 bg-[var(--ui-surface-subtle)]">
                <tr>
                  {['Tillgång', 'Hot', 'Poäng', 'Åtgärd', 'Ägare', 'Förfall', 'Status', ''].map((header) => (
                    <th key={header} className="h-10 px-4 text-left text-xs font-semibold uppercase text-[var(--ui-text-muted)]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
                {risks.map((risk) => {
                  const score = riskScore(risk.riskScore);
                  return (
                    <tr key={risk.id} className="h-10 transition-colors hover:bg-[var(--ui-surface-hover)] focus-within:bg-[var(--ui-surface-selected)]">
                      <td className="max-w-40 truncate px-4 py-3 font-medium text-[var(--ui-text)]">{risk.asset}</td>
                      <td className="max-w-56 truncate px-4 py-3 text-[var(--ui-text-secondary)]">{risk.threat}</td>
                      <td className="px-4 py-3"><StatusBadge tone={score.tone}>{risk.riskScore} {score.label}</StatusBadge></td>
                      <td className="px-4 py-3 text-[var(--ui-text-secondary)]">{TREATMENT_LABEL[risk.treatment]}</td>
                      <td className="px-4 py-3 text-[var(--ui-text-muted)]">{risk.owner ?? '-'}</td>
                      <td className="px-4 py-3 text-[var(--ui-text-muted)]">{fmt(risk.dueDate)}</td>
                      <td className="px-4 py-3"><StatusBadge tone={STATUS_TONE[risk.status]}>{STATUS_LABEL[risk.status]}</StatusBadge></td>
                      <td className="px-4 py-3 text-right">
                        <Button type="button" variant="ghost" size="compact" onClick={() => setConfirmDeleteRisk(risk)} disabled={deletingRiskId === risk.id}>
                          <Trash2 size={16} strokeWidth={1.75} />
                          Ta bort
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {risks.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon={ShieldAlert}
                        title="Inga risker hittades"
                        description={tab !== 'all' ? `Det finns inga risker med status ${STATUS_LABEL[tab].toLowerCase()}.` : 'Skapa den första risken för registret.'}
                        actionLabel="Ny risk"
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
        open={Boolean(confirmDeleteRisk)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteRisk(null);
        }}
        title="Ta bort risk?"
        description={
          confirmDeleteRisk
            ? `Risken för "${confirmDeleteRisk.asset}" tas bort från registret. Det här går inte att ångra.`
            : 'Risken tas bort från registret. Det här går inte att ångra.'
        }
        confirmLabel="Ta bort risk"
        loading={Boolean(confirmDeleteRisk && deletingRiskId === confirmDeleteRisk.id)}
        onConfirm={() => {
          if (!confirmDeleteRisk) return;
          void deleteRisk(confirmDeleteRisk.id);
        }}
      />
    </div>
  );
}

function RiskForm({
  form,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  form: RiskFormState;
  saving: boolean;
  onChange: (next: RiskFormState | ((current: RiskFormState) => RiskFormState)) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const setField = <Key extends keyof RiskFormState>(key: Key, value: RiskFormState[Key]) => {
    onChange((current) => ({ ...current, [key]: value }));
  };
  const preview = riskScore(form.likelihood * form.impact);

  return (
    <Panel variant="selected" className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--ui-text)]">Ny risk</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tillgång"><Input value={form.asset} onChange={(event) => setField('asset', event.target.value)} /></Field>
        <Field label="Hot"><Input value={form.threat} onChange={(event) => setField('threat', event.target.value)} /></Field>
        <Field label="Sårbarhet" className="sm:col-span-2"><Input value={form.vulnerability} onChange={(event) => setField('vulnerability', event.target.value)} /></Field>
        <Field label="Sannolikhet (1-5)">
          <Input type="number" min={1} max={5} value={form.likelihood} onChange={(event) => setField('likelihood', parseInt(event.target.value, 10))} />
        </Field>
        <Field label="Påverkan (1-5)">
          <Input type="number" min={1} max={5} value={form.impact} onChange={(event) => setField('impact', parseInt(event.target.value, 10))} />
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <p className="text-xs text-[var(--ui-text-muted)]">Riskpoäng:</p>
          <StatusBadge tone={preview.tone}>{form.likelihood * form.impact} {preview.label}</StatusBadge>
        </div>
        <Field label="Åtgärd">
          <Select value={form.treatment} onValueChange={(value) => setField('treatment', value as RiskTreatment)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(TREATMENT_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Ägare"><Input value={form.owner} onChange={(event) => setField('owner', event.target.value)} /></Field>
        <Field label="Förfallodatum"><Input type="date" value={form.dueDate} onChange={(event) => setField('dueDate', event.target.value)} /></Field>
        <Field label="Åtgärdsbeskrivning" className="sm:col-span-2">
          <Textarea rows={2} value={form.treatmentDesc} onChange={(event) => setField('treatmentDesc', event.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSave} disabled={saving} loading={saving}>Spara risk</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Avbryt</Button>
      </div>
    </Panel>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return <label className={cn('space-y-1.5 text-xs font-semibold text-[var(--ui-text-secondary)]', className)}><span>{label}</span>{children}</label>;
}
