'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Download, FileText, LoaderCircle, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import {
  collectComplianceEvidence,
  getComplianceReport,
  listComplianceControls,
  type ControlsResponse,
  type EvidenceStatus,
} from '@shared/lib/api/compliance.api';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Panel } from '@shared/ui/panel';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';

const STATUS_LABEL: Record<EvidenceStatus, string> = {
  pass: 'Pass',
  warn: 'Varning',
  fail: 'Fel',
  unknown: 'Ingen data',
};

const STATUS_TONE: Record<EvidenceStatus, StatusTone> = {
  pass: 'success',
  warn: 'warning',
  fail: 'danger',
  unknown: 'neutral',
};

const STAT_LABEL: Record<EvidenceStatus, string> = {
  pass: 'Godkänd',
  warn: 'Varning',
  fail: 'Fel',
  unknown: 'Okänd',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'just nu';
  if (hours < 24) return `${hours}h sedan`;
  return `${Math.floor(hours / 24)}d sedan`;
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function CompliancePage() {
  const [data, setData] = useState<ControlsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await listComplianceControls());
    } catch (event: unknown) {
      const status = typeof event === 'object' && event && 'status' in event ? (event as { status?: number }).status : undefined;
      setError(status === 403 ? 'Åtkomst nekad, admin-roll krävs.' : 'Kunde inte ladda compliance-data. Kontrollera anslutningen och försök igen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const collectEvidence = useCallback(async () => {
    setCollecting(true);
    try {
      await collectComplianceEvidence();
      await load();
    } catch {
      setError('Kunde inte ladda compliance-data. Kontrollera anslutningen och försök igen.');
    } finally {
      setCollecting(false);
    }
  }, [load]);

  const exportReport = useCallback(async () => {
    setExporting(true);
    try {
      const report = await getComplianceReport();
      downloadJson(report, `iso27001-evidence-${new Date().toISOString().split('T')[0]}.json`);
    } catch {
      setError('Kunde inte ladda rapport. Kontrollera anslutningen och försök igen.');
    } finally {
      setExporting(false);
    }
  }, []);

  const summary = data
    ? data.controls.reduce(
        (acc, control) => {
          acc[control.latestEvidence?.status ?? 'unknown']++;
          return acc;
        },
        { pass: 0, fail: 0, warn: 0, unknown: 0 } as Record<EvidenceStatus, number>,
      )
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-success-text)]">
              <ShieldCheck size={18} strokeWidth={1.75} />
            </span>
            <h1 className="text-xl font-semibold text-[var(--ui-text)]">Security Controls</h1>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-[var(--ui-text-muted)]">
            ISO 27001 Annex A, automatisk insamling och verifiering av bevis.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="link" size="compact">
              <Link href="/admin/compliance/risks">Riskregister</Link>
            </Button>
            <Button asChild variant="link" size="compact">
              <Link href="/admin/compliance/policies">Policyer</Link>
            </Button>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void collectEvidence()} disabled={collecting || loading} loading={collecting}>
            {!collecting ? <RefreshCw size={16} strokeWidth={1.75} /> : null}
            Samla in bevis
          </Button>
          <Button type="button" onClick={() => void exportReport()} disabled={exporting || !data} loading={exporting}>
            {!exporting ? <Download size={16} strokeWidth={1.75} /> : null}
            Exportera rapport
          </Button>
        </div>
      </header>

      {error ? (
        <InlineAlert tone="danger" title="Compliance-data kunde inte uppdateras">
          {error}
        </InlineAlert>
      ) : null}

      {summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['pass', 'warn', 'fail', 'unknown'] as EvidenceStatus[]).map((status) => (
            <Panel key={status} variant={panelVariant(status)} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-current">{STAT_LABEL[status]}</p>
                <StatusBadge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusBadge>
              </div>
              <p className="text-3xl font-bold tabular-nums text-current">{summary[status]}</p>
              <p className="text-xs text-[var(--ui-text-muted)]">av {data?.total ?? 0} kontroller</p>
            </Panel>
          ))}
        </div>
      ) : null}

      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.controls.map((control) => {
            const evidence = control.latestEvidence;
            const status = evidence?.status ?? 'unknown';

            return (
              <Panel key={control.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-2 py-1 font-mono text-xs font-semibold text-[var(--ui-text-secondary)]">
                    {control.controlId}
                  </span>
                  <StatusBadge tone={STATUS_TONE[status]}>
                    {status === 'fail' ? <TriangleAlert size={12} strokeWidth={1.75} /> : null}
                    {STATUS_LABEL[status]}
                  </StatusBadge>
                </div>
                <p className="text-sm font-semibold text-[var(--ui-text)]">{control.name}</p>
                {evidence ? (
                  <div className="space-y-1">
                    <p className="line-clamp-2 text-xs leading-5 text-[var(--ui-text-muted)]">{evidence.summary}</p>
                    <p className="flex items-center gap-1 text-xs text-[var(--ui-text-muted)]">
                      <Clock size={12} strokeWidth={1.75} />
                      Kontrollerat {timeAgo(evidence.collectedAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--ui-text-muted)]">Inga bevis insamlade ännu.</p>
                )}
              </Panel>
            );
          })}
        </div>
      ) : null}

      {loading && !data ? (
        <Panel className="grid min-h-64 place-items-center">
          <div className="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
            <LoaderCircle size={18} strokeWidth={1.75} className="animate-spin" />
            Laddar kontroller...
          </div>
        </Panel>
      ) : null}

      {!loading && data?.controls.length === 0 ? (
        <Panel>
          <EmptyState icon={FileText} title="Inga kontroller hittades" description="Samla in bevis eller kontrollera admin-konfigurationen." />
        </Panel>
      ) : null}
    </div>
  );
}

function panelVariant(status: EvidenceStatus): 'base' | 'warning' | 'danger' | 'info' {
  if (status === 'warn') return 'warning';
  if (status === 'fail') return 'danger';
  if (status === 'pass') return 'info';
  return 'base';
}
