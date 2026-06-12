import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';
import { KpiStrip } from '@shared/ui/kpi-strip';
import { StatusBadge } from '@shared/ui/status-badge';
import { ClockIcon, CalendarIcon, PackageIcon, NoteIcon } from '@shared/ui/icons';
import { getCurrentAttendanceShift, listTodayAttendance } from '@modules/generic/workforce';
import { listRestaurantOpeningHours, listRestaurantMenu } from '@modules/supporting/restaurant-menu';
import { AttendanceControls } from '../narvaro/attendance-controls';

function staffName(shift: Awaited<ReturnType<typeof listTodayAttendance>>[number]) {
  return [shift.user.firstName, shift.user.lastName].filter(Boolean).join(' ') || shift.user.email;
}

function todayOpeningLabel(hours: Awaited<ReturnType<typeof listRestaurantOpeningHours>>) {
  const isoDay = new Date().getDay() || 7;
  const hour = hours.find((item) => item.dayOfWeek === isoDay);
  if (!hour) return 'Ej angivet';
  if (hour.isClosed) return hour.label ?? 'Stängt';
  return `${hour.opensAt} - ${hour.closesAt}`;
}

export async function RestaurantDashboard({ organizationId, userId }: { organizationId: string; userId: string }) {
  const [currentShift, todayShifts, hours, categories] = await Promise.all([
    getCurrentAttendanceShift(organizationId, userId).catch(() => null),
    listTodayAttendance(organizationId).catch(() => []),
    listRestaurantOpeningHours(organizationId).catch(() => []),
    listRestaurantMenu(organizationId).catch(() => []),
  ]);
  const activeStaff = todayShifts.filter((shift) => shift.status === 'active');
  const menuItems = categories.reduce((sum, category) => sum + category.items.length, 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Restaurangportal"
        title="Dagens drift"
        description="Snabb överblick över bemanning, öppettider, meny och dagens viktigaste arbetsflöden."
      />

      <KpiStrip
        items={[
          { id: 'staff', label: 'Incheckade', value: activeStaff.length, detail: 'Aktiv personal just nu', tone: activeStaff.length > 0 ? 'success' : 'neutral' },
          { id: 'hours', label: 'Öppet idag', value: todayOpeningLabel(hours), detail: 'Publika öppettider' },
          { id: 'menu', label: 'Menyrader', value: menuItems, detail: `${categories.length} kategorier`, tone: menuItems > 0 ? 'info' : 'warning' },
          { id: 'tasks', label: 'Uppgifter', value: 'MVP', detail: 'Checklistor kommer i nästa steg' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel className="space-y-4">
          <div className="flex items-center gap-2">
            <ClockIcon />
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Stampla tid</h2>
          </div>
          <AttendanceControls initialShift={currentShift} />
        </Panel>

        <Panel className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarIcon />
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Personal idag</h2>
          </div>
          <div className="divide-y divide-[var(--ui-border)]">
            {todayShifts.length === 0 ? (
              <p className="py-4 text-sm text-[var(--ui-text-muted)]">Ingen har stämplat in ännu.</p>
            ) : todayShifts.map((shift) => (
              <div key={shift.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--ui-text)]">{staffName(shift)}</p>
                  <p className="text-xs text-[var(--ui-text-muted)]">
                    {new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(new Date(shift.clockInAt))}
                    {shift.clockOutAt ? ` - ${new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(new Date(shift.clockOutAt))}` : ''}
                  </p>
                </div>
                <StatusBadge tone={shift.status === 'active' ? 'success' : 'neutral'}>{shift.status === 'active' ? 'Aktiv' : 'Klar'}</StatusBadge>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-3">
          <div className="flex items-center gap-2">
            <PackageIcon />
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Meny</h2>
          </div>
          <p className="text-sm text-[var(--ui-text-muted)]">Hantera kategorier och rätter via Meny-sidan. Publika sidan läser samma data.</p>
        </Panel>
        <Panel className="space-y-3">
          <div className="flex items-center gap-2">
            <NoteIcon />
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Dagliga anteckningar</h2>
          </div>
          <p className="text-sm text-[var(--ui-text-muted)]">Checklistor, lagernoteringar och leverantörsnoteringar är nästa modulskiva.</p>
        </Panel>
      </div>
    </div>
  );
}
