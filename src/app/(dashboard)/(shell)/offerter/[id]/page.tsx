import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@platform/auth/session';
import { acceptOfferOnBehalfForStaff, getStaffOfferDetail } from '@modules/supporting/offers';

function fmtDate(iso?: string) {
  if (!iso) return '—';
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

const STATUS_LABEL: Record<string, string> = {
  draft: 'Utkast',
  sent: 'Skickad',
  viewed: 'Visad',
  accepted: 'Accepterad',
  declined: 'Avvisad',
  expired: 'Utgången',
};

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
      <div className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface-0)] p-6 shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link
              href="/offerter"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <span aria-hidden="true">←</span>
              Tillbaka till offerter
            </Link>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--accent-subtle)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                  {STATUS_LABEL[offer.status] ?? offer.status}
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Offert {offer.offerNumber ? `#${offer.offerNumber}` : offer.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {offer.title}
              </h1>
              <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
                Här ser du allt som skickats till kunden, tillsammans med status, dokument och nästa steg.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(offer.status === 'sent' || offer.status === 'viewed') && (
              <form action={acceptOnBehalfAction}>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  Acceptera åt kund
                </button>
              </form>
            )}
            {offer.generatedDocument && (
              <a
                href={`/api/offers/${offer.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
              >
                Öppna PDF
              </a>
            )}
            {publicHref && (
              <Link
                href={publicHref}
                target="_blank"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Öppna signeringslänk
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mottagare</p>
            <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{offer.recipientName}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{offer.recipientEmail}</p>
            {offer.recipientCompany && (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{offer.recipientCompany}</p>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Värde</p>
            <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{fmtSEK(pricing.totalAmount)}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {pricing.displayModeLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Tidslinje</p>
            <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">Skapad {fmtDate(offer.createdAt)}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Skickad {fmtDate(offer.sentAt)}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Giltig till {fmtDate(offer.validUntil)}</p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Uppföljning</p>
            <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
              Påminnelser {offer.reminderCount ?? 0}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Senast {fmtDate(offer.reminderSentAt)}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Signerad {fmtDate(offer.acceptedAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-[0_4px_18px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Dokument</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Samma innehåll som kunden ser vid granskning och signering.
              </p>
            </div>
          </div>

          {renderedDocument ? (
            <iframe
              srcDoc={renderedDocument}
              title="Offertdokument"
              className="min-h-[720px] w-full rounded-2xl border border-[var(--border)] bg-white"
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center">
              <p className="text-sm font-medium text-[var(--text-primary)]">Dokumentet skapas när offerten skickas</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Under tiden kan du fortsätta arbeta med offertinnehållet i listvyn.
              </p>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-[0_4px_18px_rgba(15,23,42,0.05)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Rader</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)]">
              <table className="min-w-full divide-y divide-[var(--border)] text-sm">
                <thead className="bg-[var(--surface)]">
                  <tr className="text-left text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    <th className="px-4 py-3">Beskrivning</th>
                    <th className="px-4 py-3 text-right">Antal</th>
                    <th className="px-4 py-3 text-right">Pris</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] bg-[var(--surface-0)]">
                  {offer.lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-[var(--text-primary)]">{item.description}</td>
                      <td className="px-4 py-3 text-right text-[var(--text-secondary)]">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--text-primary)]">
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
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-[0_4px_18px_rgba(15,23,42,0.05)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Meddelande</h2>
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              {offer.notes ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{offer.notes}</p>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  Ingen extra anteckning är sparad på offerten ännu.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
