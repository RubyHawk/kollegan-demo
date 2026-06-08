import { CreditCard, Download } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';

import { INVOICES, PAYMENT_METHOD, PLAN, USAGE_STATS } from './_data';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <Panel variant="selected" padding="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase text-[var(--ui-accent)]">Nuvarande plan</span>
              <StatusBadge tone="success">{PLAN.status}</StatusBadge>
            </div>
            <h2 className="text-xl font-bold text-[var(--ui-text)]">{PLAN.name}</h2>
            <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{PLAN.price} - {PLAN.billing}</p>
          </div>
          <Button type="button" variant="secondary" disabled>
            Byt plan
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {USAGE_STATS.map((usage) => (
            <div key={usage.label} className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--ui-text-muted)]">{usage.label}</span>
                <span className="text-xs font-semibold text-[var(--ui-text-secondary)]">{usage.used}/{usage.limit}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--ui-surface-subtle)]">
                <div
                  className="h-1.5 rounded-full bg-[var(--ui-accent)]"
                  style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel padding="lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--ui-text)]">Betalningsmetod</h2>
          <Button type="button" variant="ghost" size="compact" disabled>
            Byt kort
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-11 items-center justify-center rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-muted)]">
            <CreditCard aria-hidden="true" size={18} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--ui-text)]">**** **** **** {PAYMENT_METHOD.last4}</p>
            <p className="text-xs text-[var(--ui-text-muted)]">Utgår {PAYMENT_METHOD.expires}</p>
          </div>
        </div>
      </Panel>

      <Panel padding="none" className="overflow-hidden">
        <div className="border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--ui-text)]">Fakturahistorik</h2>
        </div>
        <table className="min-w-full divide-y divide-[var(--ui-border-subtle)] text-sm">
          <thead className="bg-[var(--ui-surface-subtle)]">
            <tr>
              {['Faktura', 'Datum', 'Belopp', 'Status', ''].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--ui-text-muted)]">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ui-border-subtle)] bg-[var(--ui-surface)]">
            {INVOICES.map((invoice) => (
              <tr key={invoice.id} className="transition-colors hover:bg-[var(--ui-surface-hover)]">
                <td className="px-4 py-3.5 font-mono text-xs text-[var(--ui-text-secondary)]">{invoice.id}</td>
                <td className="px-4 py-3.5 text-[var(--ui-text-secondary)]">{invoice.date}</td>
                <td className="px-4 py-3.5 font-medium text-[var(--ui-text)]">{invoice.amount}</td>
                <td className="px-4 py-3.5">
                  <StatusBadge tone="success">{invoice.status}</StatusBadge>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Button type="button" variant="ghost" size="compact" disabled>
                    <Download aria-hidden="true" size={16} strokeWidth={1.75} />
                    Ladda ner PDF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel variant="danger" padding="lg">
        <h2 className="mb-1 text-sm font-semibold">Farlig zon</h2>
        <p className="mb-4 text-xs">Avsluta prenumerationen och radera all data permanent.</p>
        <Button type="button" variant="danger" disabled>
          Avsluta prenumeration
        </Button>
      </Panel>
    </div>
  );
}
