'use client';

import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockCounterClockwiseIcon,
  FileTextIcon,
  PackageIcon,
  PencilSimpleIcon,
  PlusIcon,
  TruckIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { cn } from '@shared/lib/utils';
import {
  CreatePurchaseOrderPanel,
  EditProjectDetailsPanel,
  RecordPurchaseOrderReceiptPanel,
} from '../_components/project-panels';
import { useProjectDetailStore } from '../_store/project-detail.store';
import {
  PROJECT_STAGE_LABELS,
  PROJECT_STAGES,
  type Project,
  type ProjectStage,
  type PurchaseOrder,
} from '../_store/types';

const STAGE_STYLE: Record<ProjectStage, string> = {
  details: 'bg-[var(--status-draft-bg)] text-[var(--status-draft-text)] border-[var(--status-draft-border)]',
  ordered: 'bg-[var(--status-sent-bg)] text-[var(--status-sent-text)] border-transparent',
  arrived: 'bg-[var(--status-viewed-bg)] text-[var(--status-viewed-text)] border-transparent',
  in_progress: 'bg-[var(--status-accepted-bg)] text-[var(--status-accepted-text)] border-transparent',
  completed: 'bg-[var(--surface-alt)] text-[var(--text-muted)] border-[var(--border)]',
};

const PO_LABEL: Record<string, string> = {
  draft: 'Utkast',
  submitted: 'Skickad',
  received: 'Ankommen',
  cancelled: 'Makulerad',
};

function fmtSEK(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(value);
}

function fmtDate(iso: string | null) {
  if (!iso) return 'Ej satt';
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function nextStage(stage: ProjectStage): ProjectStage | null {
  const index = PROJECT_STAGES.indexOf(stage);
  return index >= 0 ? PROJECT_STAGES[index + 1] ?? null : null;
}

function canAdvance(project: Project) {
  const target = nextStage(project.stage);
  if (!target) return { target: null, allowed: false, reason: 'Projektet är klart.' };
  const activePOs = (project.purchaseOrders ?? []).filter((po) => po.status !== 'cancelled');
  if (project.stage === 'details' && !activePOs.some((po) => po.status === 'submitted' || po.status === 'received')) {
    return { target, allowed: false, reason: 'Skapa och skicka minst en inköpsorder.' };
  }
  if (project.stage === 'ordered' && (!activePOs.length || activePOs.some((po) => po.status !== 'received'))) {
    return { target, allowed: false, reason: 'Alla aktiva inköpsorder måste vara ankomna.' };
  }
  return { target, allowed: true, reason: null };
}

function StageStepper({ project }: { project: Project }) {
  const currentIndex = PROJECT_STAGES.indexOf(project.stage);
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="grid grid-cols-5 gap-2">
        {PROJECT_STAGES.map((stage, index) => {
          const complete = index < currentIndex;
          const current = index === currentIndex;
          return (
            <div key={stage} className="min-w-0">
              <div className={cn('h-2 rounded-full', complete || current ? 'bg-[var(--accent)]' : 'bg-[var(--surface-alt)]')} />
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold',
                    complete && 'border-[var(--accent)] bg-[var(--accent)] text-white',
                    current && 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]',
                    !complete && !current && 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-muted)]',
                  )}
                >
                  {complete ? <CheckCircleIcon size={15} weight="fill" /> : index + 1}
                </span>
                <span className={cn('truncate text-xs font-semibold', current ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>
                  {PROJECT_STAGE_LABELS[stage]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[var(--surface-alt)] px-3 py-2">
      <p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p>
      <div className="mt-1 text-sm text-[var(--text-primary)]">{value || 'Ej satt'}</div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const project = useProjectDetailStore((s) => s.project);
  const loading = useProjectDetailStore((s) => s.loading);
  const error = useProjectDetailStore((s) => s.error);
  const acting = useProjectDetailStore((s) => s.acting);
  const setError = useProjectDetailStore((s) => s.setError);
  const loadProject = useProjectDetailStore((s) => s.loadProject);
  const loadSuppliers = useProjectDetailStore((s) => s.loadSuppliers);
  const advanceStage = useProjectDetailStore((s) => s.advanceStage);
  const submitPO = useProjectDetailStore((s) => s.submitPO);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [poOpen, setPoOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptPO, setReceiptPO] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    if (!projectId) return;
    void loadProject(projectId);
    void loadSuppliers();
  }, [loadProject, loadSuppliers, projectId]);

  const gate = useMemo(() => project ? canAdvance(project) : { target: null, allowed: false, reason: null }, [project]);

  async function onAdvance() {
    if (!gate.target) return;
    await advanceStage(gate.target);
  }

  if (loading) {
    return (
      <div className="grid min-h-[620px] place-items-center px-8 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/projekt"><ArrowLeftIcon /> Till projekt</Link>
        </Button>
        <Card className="border-[var(--border)]">
          <CardContent className="p-8 text-center">
            <p className="font-semibold text-[var(--text-primary)]">Projektet hittades inte</p>
            {error && <p className="mt-2 text-sm text-[var(--text-muted)]">{error}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  const customer = project.customer;
  const purchaseOrders = project.purchaseOrders ?? [];

  return (
    <div className="mx-auto max-w-[1320px] space-y-6 px-8 py-10">
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/projekt"><ArrowLeftIcon /> Till projekt</Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className={cn('border', STAGE_STYLE[project.stage])}>{PROJECT_STAGE_LABELS[project.stage]}</Badge>
            {project.offerNumber && <Badge variant="secondary">Offert {project.offerNumber}</Badge>}
          </div>
          <h1 className="font-heading text-3xl font-semibold text-[var(--text-primary)]">{project.name}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {customer?.company || customer?.name || 'Kund saknas'} · {fmtSEK(project.totalIncVat)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setDetailsOpen(true)}>
            <PencilSimpleIcon />
            Redigera uppgifter
          </Button>
          {project.stage !== 'completed' && (
            <Button onClick={onAdvance} disabled={!gate.allowed || acting}>
              {acting ? 'Flyttar...' : gate.target ? `Flytta till ${PROJECT_STAGE_LABELS[gate.target]}` : 'Klart'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm text-[var(--text-primary)]">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>Stäng</Button>
        </div>
      )}

      {gate.reason && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm text-[var(--text-primary)]">
          <WarningCircleIcon size={18} />
          <span>{gate.reason}</span>
        </div>
      )}

      <StageStepper project={project} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="border-[var(--border)]">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Kund och installation</CardTitle>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Uppgifter för montage och kontakt på plats.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setDetailsOpen(true)}>
                <PencilSimpleIcon />
                Redigera
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow label="Kund" value={customer?.name} />
                <InfoRow label="Företag" value={customer?.company} />
                <InfoRow label="Kontakt" value={[project.onsiteContactPhone, project.onsiteContactEmail].filter(Boolean).join(' · ')} />
                <InfoRow label="Adress" value={[project.siteAddress, project.sitePostalCode, project.siteCity].filter(Boolean).join(', ')} />
                <InfoRow label="Kvadratmeter" value={project.squareMeters ? `${project.squareMeters} m²` : null} />
                <InfoRow label="Önskat datum" value={project.wishedInstallDateText || fmtDate(project.wishedInstallDate)} />
                <InfoRow label="Objekt" value={[project.objectType, project.objectDescription].filter(Boolean).join(' · ')} />
                <InfoRow label="Tillträde" value={project.accessNotes} />
                <InfoRow label="Intern notering" value={project.internalNotes} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)]">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Accepterad offert</CardTitle>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Snapshot från accepttillfället.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/offerter/${project.offerId}`}><FileTextIcon /> Öppna offert</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                <div className="grid grid-cols-[1.6fr_0.55fr_0.55fr_0.75fr_0.8fr] gap-3 bg-[var(--surface-alt)] px-4 py-3 text-xs font-semibold text-[var(--text-secondary)]">
                  <span>Produkt</span>
                  <span>Antal</span>
                  <span>Enhet</span>
                  <span>À-pris</span>
                  <span className="text-right">Summa</span>
                </div>
                {(project.lineItems ?? []).map((line) => (
                  <div key={line.id} className="grid grid-cols-[1.6fr_0.55fr_0.55fr_0.75fr_0.8fr] gap-3 border-t border-[var(--border-light)] px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--text-primary)]">{line.productName}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">{line.description}</p>
                    </div>
                    <span className="text-[var(--text-primary)]">{line.quantity}</span>
                    <span className="text-[var(--text-secondary)]">{line.unit}</span>
                    <span className="text-[var(--text-secondary)]">{fmtSEK(line.unitPrice)}</span>
                    <span className="text-right font-semibold text-[var(--text-primary)]">{fmtSEK(line.lineTotalIncVat)}</span>
                  </div>
                ))}
                {(project.lineItems ?? []).length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Offerten saknade produktrader.</div>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-8 text-sm">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Exkl. moms</p>
                  <p className="font-semibold text-[var(--text-primary)]">{fmtSEK(project.totalExVat)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Inkl. moms</p>
                  <p className="font-semibold text-[var(--text-primary)]">{fmtSEK(project.totalIncVat)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)]">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Inköpsorder</CardTitle>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Leverantörsbeställningar och materialankomst.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPoOpen(true)}>
                <PlusIcon />
                Ny inköpsorder
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {purchaseOrders.map((po) => (
                <div key={po.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <PackageIcon size={17} />
                        <p className="font-semibold text-[var(--text-primary)]">
                          {po.poNumber ? `IO-${String(po.poNumber).padStart(4, '0')}` : 'Inköpsorder'}
                        </p>
                        <Badge variant="secondary">{PO_LABEL[po.status] ?? po.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{po.supplier?.name ?? 'Leverantör saknas'} · {fmtSEK(po.totalIncVat)}</p>
                    </div>
                    <div className="flex gap-2">
                      {po.status === 'draft' && (
                        <Button variant="outline" size="sm" onClick={() => void submitPO(po.id)}>
                          <TruckIcon />
                          Skicka
                        </Button>
                      )}
                      {po.status === 'submitted' && (
                        <Button size="sm" onClick={() => { setReceiptPO(po); setReceiptOpen(true); }}>
                          <TruckIcon />
                          Registrera ankomst
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {(po.lineItems ?? []).map((line) => (
                      <div key={line.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-[var(--text-primary)]">{line.description}</span>
                        <span className="shrink-0 text-[var(--text-muted)]">
                          {line.receivedQuantity}/{line.quantity} {line.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {purchaseOrders.length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  Ingen inköpsorder skapad.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-lg">Aktivitet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {(project.stageEvents ?? []).map((event) => (
                    <motion.div key={event.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 rounded-xl bg-[var(--surface-alt)] p-3">
                      <ClockCounterClockwiseIcon size={16} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{PROJECT_STAGE_LABELS[event.toStage]}</p>
                        <p className="text-xs text-[var(--text-muted)]">{fmtDate(event.createdAt)} · {event.actorId ?? 'system'}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <EditProjectDetailsPanel open={detailsOpen} onOpenChange={setDetailsOpen} />
      <CreatePurchaseOrderPanel open={poOpen} onOpenChange={setPoOpen} />
      <RecordPurchaseOrderReceiptPanel open={receiptOpen} onOpenChange={setReceiptOpen} purchaseOrder={receiptPO} />
    </div>
  );
}
