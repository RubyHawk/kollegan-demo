'use client';

import { useState } from 'react';
import { Button } from '@shared/ui/button';
import { StatusBadge } from '@shared/ui/status-badge';
import { SectionCard } from '../_components/shared';
import { CONNECTIONS, type Connection } from './_data';

function ConnectionIcon({ connection }: { connection: Connection }) {
  const Icon = connection.Icon;

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-secondary)]">
      <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
    </div>
  );
}

export default function AnslutningarPage() {
  const [connections, setConnections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(CONNECTIONS.map((connection) => [connection.id, false])),
  );
  const [connecting, setConnecting] = useState<string | null>(null);

  function toggle(id: string) {
    if (connecting) return;
    if (connections[id]) {
      setConnections((prev) => ({ ...prev, [id]: false }));
      return;
    }
    setConnecting(id);
    setTimeout(() => {
      setConnections((prev) => ({ ...prev, [id]: true }));
      setConnecting(null);
    }, 900);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Integrationer" description="Anslut Soleria till de verktyg du redan använder.">
        <div className="flex flex-col divide-y divide-[var(--ui-border-subtle)]">
          {CONNECTIONS.map((integration) => {
            const isConnected = connections[integration.id];
            const isConnecting = connecting === integration.id;

            return (
              <div key={integration.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <ConnectionIcon connection={integration} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--ui-text)]">{integration.name}</p>
                    {integration.badge ? <StatusBadge tone="accent">{integration.badge}</StatusBadge> : null}
                    {isConnected ? <StatusBadge tone="success">Ansluten</StatusBadge> : null}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--ui-text-muted)]">{integration.description}</p>
                </div>
                <Button
                  type="button"
                  variant={isConnected ? 'danger' : 'secondary'}
                  size="compact"
                  onClick={() => toggle(integration.id)}
                  disabled={isConnecting}
                  loading={isConnecting}
                  className="shrink-0"
                >
                  {isConnecting ? 'Ansluter...' : isConnected ? 'Koppla från' : 'Anslut'}
                </Button>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
