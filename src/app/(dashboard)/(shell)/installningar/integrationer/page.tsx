import { Button } from '@shared/ui/button';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';

import { INTEGRATIONS, type Integration } from './_data';

function IntegrationIcon({ integration }: { integration: Integration }) {
  const Icon = integration.Icon;

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-secondary)]">
      <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
    </div>
  );
}

function IntegrationCategory({ category }: { category: string }) {
  return (
    <StatusBadge tone="neutral" className="text-[10px]">
      {category}
    </StatusBadge>
  );
}

function IntegrationCard({ integration, connected }: { integration: Integration; connected: boolean }) {
  return (
    <Panel padding="lg" className={connected ? 'border-[var(--ui-success-border)]' : undefined}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <IntegrationIcon integration={integration} />
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[var(--ui-text)]">{integration.name}</p>
              <IntegrationCategory category={integration.category} />
            </div>
            <p className="text-xs leading-relaxed text-[var(--ui-text-muted)]">{integration.desc}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
          {connected ? (
            <>
              <StatusBadge tone="success">{integration.connectedLabel}</StatusBadge>
              <Button type="button" variant="secondary" size="compact" disabled>
                Hantera
              </Button>
            </>
          ) : (
            <Button type="button" size="compact" disabled>
              Anslut
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}

export default function IntegrationsPage() {
  const connected = INTEGRATIONS.filter((integration) => integration.connected);
  const available = INTEGRATIONS.filter((integration) => !integration.connected);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Anslutna</h2>
        <div className="space-y-3">
          {connected.map((integration) => (
            <IntegrationCard key={integration.name} integration={integration} connected />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Tillgängliga</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {available.map((integration) => (
            <IntegrationCard key={integration.name} integration={integration} connected={false} />
          ))}
        </div>
      </section>
    </div>
  );
}
