import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAttendanceShift } from '@modules/generic/workforce';
import { getSessionUser, hasPermission } from '@modules/supporting/auth';
import { listEnabledOrganizationModules } from '@modules/supporting/identity';
import { listRestaurantMenu } from '@modules/supporting/restaurant-menu';
import {
  getCurrentBusinessDay,
  getRestaurantOrderSummary,
  listRestaurantOrders,
} from '@modules/supporting/restaurant-orders';
import { Button } from '@shared/ui/button';
import { Panel } from '@shared/ui/panel';
import { KassaClient } from './kassa-client';

export const dynamic = 'force-dynamic';

export default async function KassaPage() {
  const user = await getSessionUser();
  if (!user) redirect('/logga-in');

  if (!user.orgId) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[var(--ui-bg)] p-6">
        <Panel className="max-w-md space-y-3">
          <h1 className="text-lg font-semibold text-[var(--ui-text)]">Ingen organisation vald</h1>
          <p className="text-sm text-[var(--ui-text-muted)]">Kassan kräver en aktiv restaurangportal.</p>
        </Panel>
      </main>
    );
  }

  const enabledModules = await listEnabledOrganizationModules(user.orgId);
  if (!enabledModules.includes('restaurant_orders')) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[var(--ui-bg)] p-6">
        <Panel className="max-w-md space-y-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-[var(--ui-text)]">Kassan är inte aktiverad</h1>
            <p className="text-sm text-[var(--ui-text-muted)]">Modulen behöver vara påslagen för den här restaurangen.</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/">Till översikten</Link>
          </Button>
        </Panel>
      </main>
    );
  }

  const [
    menu,
    businessDay,
    activeOrders,
    summary,
    currentShift,
    canAdmin,
  ] = await Promise.all([
    listRestaurantMenu(user.orgId).catch(() => []),
    getCurrentBusinessDay(user.orgId).catch(() => null),
    listRestaurantOrders(user.orgId, { activeOnly: true }).catch(() => []),
    getRestaurantOrderSummary(user.orgId).catch(() => null),
    getCurrentAttendanceShift(user.orgId, user.id).catch(() => null),
    hasPermission(user.roles, 'orders.admin').catch(() => false),
  ]);

  return (
    <KassaClient
      initialMenu={menu}
      initialBusinessDay={businessDay}
      initialActiveOrders={activeOrders}
      initialSummary={summary}
      initialShift={currentShift}
      canAdmin={canAdmin}
    />
  );
}
