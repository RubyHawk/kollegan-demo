import { ArrowLeft, ExternalLink, FileText, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { getOfferPdfUrl } from '@shared/lib/api/offers.api';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';
import { getSessionUser } from '@modules/supporting/auth';
import { acceptOfferOnBehalfForStaff, getStaffOfferDetail } from '@modules/supporting/offers';
import { CreateInvoiceButton } from './_components/create-invoice-button';
import { STATUS_LABEL, STATUS_TONE } from '../_lib/offers-dashboard-constants';

function fmtDate(iso?: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function fmtSEK(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function OfferDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/logga-in');

  const { id } = await params;
  const detail = await getStaffOfferDetail(id, user.id);
  if (!detail) notFound();

  const { offer, renderedDocument, pricing } = detail;

  async function acceptOnBehalfAction() {
    'use server';

    const sessionUser = await getSessionUser();
    if (!sessionUser) redirect('/logga-in');

    const result = await acceptOfferOnBehalfForStaff(id, sessionUser.id);
    if (result === 'no_org') notFound();

    revalidatePath('/offerter');
    revalidatePath(`/offerter/${id}`);
    redirect(`/offerter/${id}`);
  }

  const publicHref =
    offer.status === 'sent' || offer.status === 'viewed' || offer.status === 'accepted'
      ? `/offerter/publik/${offer.publicToken}`
      : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <Panel variant="raised" padding="lg" className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Button asChild variant="link" className="h-auto justify-start gap-2 text-sm text-[var(--ui-text-secondary)]">
              <Link href="/offerter">
                <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
                Tillbaka till offerter
              </Link>
            </Button>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={STATUS_TONE[offer.status]}>
                  {STATUS_LABEL[offer.status] ?? offer.status}
                </StatusBadge>
                <span className="text-xs font-medium uppercase text-[var(--ui-text-muted)]">
                  Offert {offer.offerNumber ? `#${offer.offerNumber}` : offer.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--ui-text)] sm:text-3xl">
                {offer.title}
              </h1>
              <p className="max-w-2xl text-sm text-[var(--ui-text-secondary)]">
                Här ser du allt som skickats till kunden, tillsammans med status, dokument och nästa steg.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(offer.status === 'sent' || offer.status === 'viewed') && (
              <form action={acceptOnBehalfAction}>
                <Button type="submit" variant="secondary">
                  <ShieldCheck size={16} strokeWidth={1.75} aria-hidden />
                  Acceptera åt kund
                </Button>
              </form>
            )}
            {offer.status === 'accepted' && <CreateInvoiceButton offerId={offer.id} />}
            {offer.generatedDocument && (
              <Button asChild variant="secondary">
                <a href={getOfferPdfUrl(offer.id)} target="_blank" rel="noreferrer">
                  <FileText size={16} strokeWidth={1.75} aria-hidden />
                  Öppna PDF
                </a>
              </Button>
            )}
            {publicHref && (
              <Button asChild>
                <Link href={publicHref} target="_blank">
                  <LinkIcon size={16} strokeWidth={1.75} aria-hidden />
                  Öppna signeringslänk
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-3 border-t border-[var(--ui-border)] pt-4 sm:grid-cols-2 xl:grid-cols-4">
          <FactCell label="Mottagare">
            <p className="mt-2 text-sm font-medium text-[var(--ui-text)]">{offer.recipientName}</p>
            <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">{offer.recipientEmail}</p>
            {offer.recipientCompany && (
              <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">{offer.recipientCompany}</p>
            )}
          </FactCell>
          <FactCell label="Värde">
            <p className="mt-2 text-lg font-semibold text-[var(--ui-text)]">{fmtSEK(pricing.totalAmount)}</p>
            <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">{pricing.displayModeLabel}</p>
          </FactCell>
          <FactCell label="Tidslinje">
            <p className="mt-2 text-sm font-medium text-[var(--ui-text)]">Skapad {fmtDate(offer.createdAt)}</p>
            <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">Skickad {fmtDate(offer.sentAt)}</p>
            <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">Giltig till {fmtDate(offer.validUntil)}</p>
          </FactCell>
          <FactCell label="Uppföljning">
            <p className="mt-2 text-sm font-medium text-[var(--ui-text)]">Påminnelser {offer.reminderCount ?? 0}</p>
            <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">Senast {fmtDate(offer.reminderSentAt)}</p>
            <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">Signerad {fmtDate(offer.acceptedAt)}</p>
          </FactCell>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel padding="lg">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--ui-text)]">Dokument</h2>
              <p className="text-sm text-[var(--ui-text-secondary)]">
                Samma innehåll som kunden ser vid granskning och signering.
              </p>
            </div>
            {renderedDocument ? <ExternalLink size={16} strokeWidth={1.75} className="text-[var(--ui-text-muted)]" aria-hidden /> : null}
          </div>

          {renderedDocument ? (
            <iframe
              srcDoc={renderedDocument}
              title="Offertdokument"
              className="min-h-[720px] w-full rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)]"
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="Dokumentet skapas när offerten skickas"
              description="Under tiden kan du fortsätta arbeta med offertinnehållet i listvyn."
            />
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel padding="lg">
            <h2 className="text-base font-semibold text-[var(--ui-text)]">Rader</h2>
            <div className="mt-4 overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)]">
              <table className="min-w-full divide-y divide-[var(--ui-border)] text-sm">
                <thead className="bg-[var(--ui-surface-subtle)]">
                  <tr className="h-10 text-left text-xs uppercase text-[var(--ui-text-muted)]">
                    <th className="px-4 py-3">Beskrivning</th>
                    <th className="px-4 py-3 text-right">Antal</th>
                    <th className="px-4 py-3 text-right">Pris</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
                  {offer.lineItems.map((item) => (
                    <tr key={item.id} className="h-10">
                      <td className="px-4 py-3 text-[var(--ui-text)]">{item.description}</td>
                      <td className="px-4 py-3 text-right text-[var(--ui-text-secondary)]">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--ui-text)]">
                        {fmtSEK(
                          offer.priceDisplayMode === 'inclusive'
                            ? item.quantity * item.unitPrice * (1 - ((item.discount ?? 0) / 100)) * (1 + item.vatRate)
                            : item.quantity * item.unitPrice * (1 - ((item.discount ?? 0) / 100)),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel padding="lg">
            <h2 className="text-base font-semibold text-[var(--ui-text)]">Meddelande</h2>
            <div className="mt-4 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-4">
              {offer.notes ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--ui-text-secondary)]">{offer.notes}</p>
              ) : (
                <p className="text-sm text-[var(--ui-text-secondary)]">
                  Ingen extra anteckning är sparad på offerten ännu.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function FactCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4">
      <p className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">{label}</p>
      {children}
    </div>
  );
}
