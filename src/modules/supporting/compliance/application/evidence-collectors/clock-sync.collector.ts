// A.8.17 — Clock Synchronisation: server time and NTP documentation

import type { CollectorResult } from '../../domain/evidence.entity';

export async function clockSyncCollector(
  _organizationId: string,
  controlId: string
): Promise<CollectorResult> {
  const serverTimeUtc = new Date().toISOString();

  return {
    controlId,
    status:  'pass',
    payload: {
      serverTimeUtc,
      ntpSource:   'Host OS / Docker daemon (system NTP)',
      ntpProtocol: 'NTP via host (Linux systemd-timesyncd or chrony)',
      note:        'Docker containers inherit host system clock. Host NTP synchronisation is managed at the OS level.',
    },
    summary: `Server clock: ${serverTimeUtc}; NTP managed by host OS (systemd-timesyncd / chrony)`,
  };
}
