import Link from 'next/link';
import { getSessionUser, hasPermission } from '@modules/supporting/auth';
import { listEnabledOrganizationModules } from '@modules/supporting/identity';
import { listRestaurantOrders } from '@modules/supporting/restaurant-orders';
import { Button } from '@shared/ui/button';
import { Panel } from '@shared/ui/panel';
import { KitchenOrdersClient } from './kitchen-orders-client';

export const dynamic = 'force-dynamic';

export default async function KitchenOrdersPage() {
  const user = await getSessionUser();
  const orgId = user?.orgId ?? null;

  if (!user || !orgId) {
    return (
      <div className="p-4 md:p-6">
        <Panel className="max-w-lg space-y-3">
          <h1 className="text-lg font-semibold text-[var(--ui-text)]">Kök</h1>
          <p className="text-sm text-[var(--ui-text-muted)]">Logga in i en restaurangportal för att se köksflödet.</p>
        </Panel>
      </div>
    );
  }

  const [enabledModules, canReadOrders, canUpdateOrders] = await Promise.all([
    listEnabledOrganizationModules(orgId),
    hasPermission(user.roles, 'orders.read').catch(() => false),
    hasPermission(user.roles, 'orders.write').catch(() => false),
  ]);

  if (!enabledModules.includes('restaurant_orders') || !canReadOrders) {
    return (
      <div className="p-4 md:p-6">
        <Panel className="max-w-lg space-y-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-[var(--ui-text)]">Kök är inte tillgängligt</h1>
            <p className="text-sm text-[var(--ui-text-muted)]">Din roll eller organisation saknar åtkomst till restaurangordrar.</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/">Till översikten</Link>
          </Button>
        </Panel>
      </div>
    );
  }

  const orders = await listRestaurantOrders(orgId, { activeOnly: true }).catch(() => []);

  return <KitchenOrdersClient initialOrders={orders} canUpdate={canUpdateOrders} />;
}
