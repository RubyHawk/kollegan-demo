import Link from 'next/link';
import { getSessionUser, hasPermission } from '@modules/supporting/auth';
import { listEnabledOrganizationModules } from '@modules/supporting/identity';
import {
  getRestaurantOrderSummary,
  listRestaurantOrders,
} from '@modules/supporting/restaurant-orders';
import { Button } from '@shared/ui/button';
import { Panel } from '@shared/ui/panel';
import { RestaurantOrdersPageClient } from './restaurant-orders-page-client';

export const dynamic = 'force-dynamic';

export default async function RestaurantOrdersPage() {
  const user = await getSessionUser();
  const orgId = user?.orgId ?? null;

  if (!user || !orgId) {
    return (
      <div className="p-4 md:p-6">
        <Panel className="max-w-lg space-y-3">
          <h1 className="text-lg font-semibold text-[var(--ui-text)]">Ordrar</h1>
          <p className="text-sm text-[var(--ui-text-muted)]">Logga in i en restaurangportal för att se ordrar.</p>
        </Panel>
      </div>
    );
  }

  const [enabledModules, canReadOrders, canReadReports, canMarkPaid, canAdmin] = await Promise.all([
    listEnabledOrganizationModules(orgId),
    hasPermission(user.roles, 'orders.read').catch(() => false),
    hasPermission(user.roles, 'restaurant_reports.read').catch(() => false),
    hasPermission(user.roles, 'orders.payment').catch(() => false),
    hasPermission(user.roles, 'orders.admin').catch(() => false),
  ]);

  if (!enabledModules.includes('restaurant_orders') || !canReadOrders) {
    return (
      <div className="p-4 md:p-6">
        <Panel className="max-w-lg space-y-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-[var(--ui-text)]">Ordrar är inte tillgängligt</h1>
            <p className="text-sm text-[var(--ui-text-muted)]">Din roll eller organisation saknar åtkomst till restaurangordrar.</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/">Till översikten</Link>
          </Button>
        </Panel>
      </div>
    );
  }

  const [orders, summary] = await Promise.all([
    listRestaurantOrders(orgId, {}).catch(() => []),
    canReadReports ? getRestaurantOrderSummary(orgId).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <RestaurantOrdersPageClient
      initialOrders={orders}
      initialSummary={summary}
      canMarkPaid={canMarkPaid}
      canAdmin={canAdmin}
      canReadReports={canReadReports}
    />
  );
}
