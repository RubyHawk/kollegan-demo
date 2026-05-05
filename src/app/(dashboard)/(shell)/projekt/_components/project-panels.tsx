'use client';

import { useEffect } from 'react';
import type React from 'react';
import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { useProjectDetailStore } from '../_store/project-detail.store';
import type { PurchaseOrder } from '../_store/types';

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'min-h-24 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none',
        props.className,
      )}
    />
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-xs font-semibold text-[var(--text-secondary)]">{label}</Label>
      {children}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        {description ? <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function formatVatRatePercent(vatRate: string) {
  const parsed = Number(vatRate);
  return Number.isFinite(parsed) ? String(parsed * 100) : '';
}

function parseVatRatePercentInput(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? String(parsed / 100) : fallback;
}

export function EditProjectDetailsPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const draft = useProjectDetailStore((s) => s.detailsDraft);
  const setDraft = useProjectDetailStore((s) => s.setDetailsDraft);
  const saveDetails = useProjectDetailStore((s) => s.saveDetails);
  const saving = useProjectDetailStore((s) => s.saving);

  async function onSave() {
    await saveDetails();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="fullscreen" className="sm:max-w-4xl">
        <DialogHeader className="border-b border-[var(--border)] pb-4">
          <DialogTitle>Installationsuppgifter</DialogTitle>
          <p className="text-sm text-[var(--text-muted)]">
            {'Samla platsinfo, kontaktperson och interna noteringar p\u00E5 ett st\u00E4lle.'}
          </p>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto bg-[var(--surface-alt)] px-5 py-5">
          <div className="grid gap-4">
            <Section
              title="Plats och objekt"
              description={'Det som beh\u00F6vs f\u00F6r att planera bes\u00F6k, m\u00E4tning och montage.'}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Adress">
                  <Input value={draft.siteAddress} onChange={(e) => setDraft({ siteAddress: e.target.value })} />
                </Field>
                <div className="grid grid-cols-[0.8fr_1.2fr] gap-3">
                  <Field label="Postnummer">
                    <Input value={draft.sitePostalCode} onChange={(e) => setDraft({ sitePostalCode: e.target.value })} />
                  </Field>
                  <Field label="Ort">
                    <Input value={draft.siteCity} onChange={(e) => setDraft({ siteCity: e.target.value })} />
                  </Field>
                </div>
                <Field label="Kvadratmeter">
                  <Input
                    type="number"
                    min={0}
                    value={draft.squareMeters}
                    onChange={(e) => setDraft({ squareMeters: e.target.value })}
                  />
                </Field>
                <Field label="Objekttyp">
                  <Input
                    value={draft.objectType}
                    onChange={(e) => setDraft({ objectType: e.target.value })}
                    placeholder="Fordon, fastighet, butik..."
                  />
                </Field>
                <Field label="Objektbeskrivning" className="sm:col-span-2">
                  <Textarea
                    value={draft.objectDescription}
                    onChange={(e) => setDraft({ objectDescription: e.target.value })}
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Tid och kontakt"
              description={'Vem som m\u00F6ter upp, n\u00E4r arbetet \u00F6nskas och hur teamet kommer in.'}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={'\u00D6nskat datum'}>
                  <Input
                    type="date"
                    value={draft.wishedInstallDate}
                    onChange={(e) => setDraft({ wishedInstallDate: e.target.value })}
                  />
                </Field>
                <Field label="Datumtext">
                  <Input
                    value={draft.wishedInstallDateText}
                    onChange={(e) => setDraft({ wishedInstallDateText: e.target.value })}
                    placeholder="t.ex. vecka 24"
                  />
                </Field>
                <Field label={'Kontakt p\u00E5 plats'}>
                  <Input
                    value={draft.onsiteContactName}
                    onChange={(e) => setDraft({ onsiteContactName: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Telefon">
                    <Input
                      value={draft.onsiteContactPhone}
                      onChange={(e) => setDraft({ onsiteContactPhone: e.target.value })}
                    />
                  </Field>
                  <Field label="E-post">
                    <Input
                      type="email"
                      value={draft.onsiteContactEmail}
                      onChange={(e) => setDraft({ onsiteContactEmail: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label={'Tilltr\u00E4de och montage'} className="sm:col-span-2">
                  <Textarea value={draft.accessNotes} onChange={(e) => setDraft({ accessNotes: e.target.value })} />
                </Field>
              </div>
            </Section>

            <Section
              title="Interna anteckningar"
              description="Saker som bara teamet ska se och komma ihåg under projektet."
            >
              <Field label="Intern notering">
                <Textarea value={draft.internalNotes} onChange={(e) => setDraft({ internalNotes: e.target.value })} />
              </Field>
            </Section>
          </div>
        </div>

        <DialogFooter className="border-t border-[var(--border)] pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Sparar...' : 'Spara uppgifter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreatePurchaseOrderPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const draft = useProjectDetailStore((s) => s.poDraft);
  const suppliers = useProjectDetailStore((s) => s.suppliers);
  const setDraft = useProjectDetailStore((s) => s.setPoDraft);
  const setLine = useProjectDetailStore((s) => s.setPoLine);
  const addLine = useProjectDetailStore((s) => s.addPoLine);
  const removeLine = useProjectDetailStore((s) => s.removePoLine);
  const loadSuppliers = useProjectDetailStore((s) => s.loadSuppliers);
  const createPO = useProjectDetailStore((s) => s.createPO);
  const saving = useProjectDetailStore((s) => s.saving);

  useEffect(() => {
    if (open) void loadSuppliers();
  }, [loadSuppliers, open]);

  async function onCreate() {
    await createPO();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="fullscreen" className="sm:max-w-5xl">
        <DialogHeader className="border-b border-[var(--border)] pb-4">
          <DialogTitle>{'Ink\u00F6psorder'}</DialogTitle>
          <p className="text-sm text-[var(--text-muted)]">
            {'V\u00E4lj leverant\u00F6r, s\u00E4tt leveransf\u00F6rv\u00E4ntan och fyll raderna som ska best\u00E4llas.'}
          </p>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto bg-[var(--surface-alt)] px-5 py-5">
          <div className="grid gap-4">
            <Section
              title={'Leverant\u00F6r och leverans'}
              description="Basuppgifter f\u00F6r best\u00E4llningen och vem som ska ta emot den."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={'Leverant\u00F6r'}>
                  <Select
                    value={draft.supplierId || '__new__'}
                    onValueChange={(value) => setDraft({ supplierId: value === '__new__' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__new__">{'Ny leverant\u00F6r'}</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={'F\u00F6rv\u00E4ntad leverans'}>
                  <Input
                    type="date"
                    value={draft.expectedDeliveryDate}
                    onChange={(e) => setDraft({ expectedDeliveryDate: e.target.value })}
                  />
                </Field>

                {!draft.supplierId && (
                  <>
                    <Field label={'Leverant\u00F6rsnamn'}>
                      <Input value={draft.supplierName} onChange={(e) => setDraft({ supplierName: e.target.value })} />
                    </Field>
                    <Field label="E-post">
                      <Input
                        type="email"
                        value={draft.supplierEmail}
                        onChange={(e) => setDraft({ supplierEmail: e.target.value })}
                      />
                    </Field>
                    <Field label="Telefon">
                      <Input value={draft.supplierPhone} onChange={(e) => setDraft({ supplierPhone: e.target.value })} />
                    </Field>
                    <Field label="Org.nr">
                      <Input
                        value={draft.supplierOrgNumber}
                        onChange={(e) => setDraft({ supplierOrgNumber: e.target.value })}
                      />
                    </Field>
                  </>
                )}
              </div>
            </Section>

            <Section
              title="Best\u00E4llningsrader"
              description="H\u00E5ll varje rad kompakt och tydlig s\u00E5 den blir enkel att skicka och f\u00F6lja upp."
            >
              <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                <div className="grid grid-cols-[1.7fr_0.65fr_0.55fr_0.75fr_0.6fr_2.5rem] gap-2 border-b border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
                  <span>Rad</span>
                  <span>Antal</span>
                  <span>Enhet</span>
                  <span>Kostnad</span>
                  <span>Moms %</span>
                  <span />
                </div>

                {draft.items.map((line, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1.7fr_0.65fr_0.55fr_0.75fr_0.6fr_2.5rem] gap-2 border-b border-[var(--border-light)] bg-[var(--surface)] px-3 py-2 last:border-b-0"
                  >
                    <Input
                      value={line.description}
                      onChange={(e) => setLine(index, { description: e.target.value })}
                    />
                    <Input
                      type="number"
                      min={0}
                      value={line.quantity}
                      onChange={(e) => setLine(index, { quantity: e.target.value })}
                    />
                    <Input value={line.unit} onChange={(e) => setLine(index, { unit: e.target.value })} />
                    <Input
                      type="number"
                      min={0}
                      value={line.unitCost}
                      onChange={(e) => setLine(index, { unitCost: e.target.value })}
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      placeholder="25"
                      value={formatVatRatePercent(line.vatRate)}
                      onChange={(e) =>
                        setLine(index, { vatRate: parseVatRatePercentInput(e.target.value, line.vatRate) })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(index)}
                      disabled={draft.items.length === 1}
                      aria-label="Ta bort rad"
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" className="mt-4 w-fit" onClick={() => addLine()}>
                <PlusIcon />
                {'L\u00E4gg till rad'}
              </Button>
            </Section>

            <Section
              title="Anteckningar"
              description="Information till leverant\u00F6r eller internt sammanhang f\u00F6r ordern."
            >
              <Field label="Best\u00E4llningsnotering">
                <Textarea value={draft.notes} onChange={(e) => setDraft({ notes: e.target.value })} />
              </Field>
            </Section>
          </div>
        </div>

        <DialogFooter className="border-t border-[var(--border)] pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={onCreate} disabled={saving}>
            {saving ? 'Skickar...' : 'Skapa och skicka'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RecordPurchaseOrderReceiptPanel({
  open,
  onOpenChange,
  purchaseOrder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder | null;
}) {
  const receiptDraft = useProjectDetailStore((s) => s.receiptDraft);
  const setReceiptDraft = useProjectDetailStore((s) => s.setReceiptDraft);
  const setReceiptLine = useProjectDetailStore((s) => s.setReceiptLine);
  const receivePO = useProjectDetailStore((s) => s.receivePO);
  const acting = useProjectDetailStore((s) => s.acting);

  useEffect(() => {
    if (!open || !purchaseOrder) return;
    setReceiptDraft(
      (purchaseOrder.lineItems ?? []).map((line) => ({
        lineItemId: line.id,
        description: line.description,
        quantity: line.quantity,
        receivedQuantity: String(line.quantity),
        unit: line.unit,
      })),
    );
  }, [open, purchaseOrder, setReceiptDraft]);

  async function onReceive() {
    if (!purchaseOrder) return;
    await receivePO(purchaseOrder);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="sheet" className="sm:max-w-2xl">
        <DialogHeader className="border-b border-[var(--border)] pb-4">
          <DialogTitle>Registrera ankomst</DialogTitle>
          <p className="text-sm text-[var(--text-muted)]">
            {'Bekr\u00E4fta vad som faktiskt har kommit fram innan projektet flyttas vidare.'}
          </p>
        </DialogHeader>

        <div className="max-h-[64vh] overflow-y-auto bg-[var(--surface-alt)] px-5 py-5">
          <div className="space-y-3">
            {receiptDraft.map((line) => (
              <div
                key={line.lineItemId}
                className="grid grid-cols-[1fr_8rem] items-end gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{line.description}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {'Best\u00E4llt: '}
                    {line.quantity} {line.unit}
                  </p>
                </div>
                <Field label="Mottaget">
                  <Input
                    type="number"
                    min={0}
                    value={line.receivedQuantity}
                    onChange={(e) => setReceiptLine(line.lineItemId, e.target.value)}
                  />
                </Field>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t border-[var(--border)] pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={onReceive} disabled={acting}>
            {acting ? 'Sparar...' : 'Markera ankommet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
