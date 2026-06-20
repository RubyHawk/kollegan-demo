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

  const [
    enabledModules,
    canReadOrders,
    canWriteOrders,
    canMarkPaid,
    canAdmin,
    canReadReports,
  ] = await Promise.all([
    listEnabledOrganizationModules(user.orgId),
    hasPermission(user.roles, 'orders.read').catch(() => false),
    hasPermission(user.roles, 'orders.write').catch(() => false),
    hasPermission(user.roles, 'orders.payment').catch(() => false),
    hasPermission(user.roles, 'orders.admin').catch(() => false),
    hasPermission(user.roles, 'restaurant_reports.read').catch(() => false),
  ]);
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

  if (!canReadOrders || !canWriteOrders || !canMarkPaid) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[var(--ui-bg)] p-6">
        <Panel className="max-w-md space-y-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-[var(--ui-text)]">Kassan är inte tillgänglig</h1>
            <p className="text-sm text-[var(--ui-text-muted)]">Din roll saknar kassabehörighet för att ta betalt och skapa order vid disken.</p>
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
  ] = await Promise.all([
    listRestaurantMenu(user.orgId).catch(() => []),
    getCurrentBusinessDay(user.orgId).catch(() => null),
    listRestaurantOrders(user.orgId, { activeOnly: true }).catch(() => []),
    canReadReports ? getRestaurantOrderSummary(user.orgId).catch(() => null) : Promise.resolve(null),
    getCurrentAttendanceShift(user.orgId, user.id).catch(() => null),
  ]);

  return (
    <KassaClient
      initialMenu={menu}
      initialBusinessDay={businessDay}
      initialActiveOrders={activeOrders}
      initialSummary={summary}
      initialShift={currentShift}
      employeeName={[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
      employeeEmail={user.email}
      canMarkPaid={canMarkPaid}
      canAdmin={canAdmin}
      canReadReports={canReadReports}
    />
  );
}
