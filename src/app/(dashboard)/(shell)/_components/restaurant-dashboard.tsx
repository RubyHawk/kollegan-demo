import Image from 'next/image';
import Link from 'next/link';
import { Panel } from '@shared/ui/panel';
import { KpiStrip } from '@shared/ui/kpi-strip';
import { StatusBadge } from '@shared/ui/status-badge';
import { Button } from '@shared/ui/button';
import { ClockIcon, CalendarIcon, PackageIcon, NoteIcon } from '@shared/ui/icons';
import { hasPermission } from '@modules/supporting/auth';
import {
  getCurrentAttendanceShift,
  listChecklistTasks,
  listScheduleShifts,
  listTodayAttendance,
} from '@modules/generic/workforce';
import {
  listReservationRequests,
  listRestaurantOpeningHours,
  listRestaurantMenu,
  type RestaurantReservationRequestView,
} from '@modules/supporting/restaurant-menu';
import { AttendanceControls } from '../narvaro/attendance-controls';
import { RestaurantReservationsDashboardPanel } from './restaurant-reservations-dashboard-panel';

const RESTAURANT_TIME_ZONE = 'Europe/Stockholm';

function staffName(shift: Awaited<ReturnType<typeof listTodayAttendance>>[number]) {
  return [shift.user.firstName, shift.user.lastName].filter(Boolean).join(' ') || shift.user.email;
}

function scheduledStaffName(shift: Awaited<ReturnType<typeof listScheduleShifts>>[number]) {
  return [shift.user.firstName, shift.user.lastName].filter(Boolean).join(' ') || shift.user.email;
}

function stockholmDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: RESTAURANT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function timeZoneOffsetMs(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: RESTAURANT_TIME_ZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const hour = values.hour === '24' ? '00' : values.hour;
  const zonedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(hour),
    Number(values.minute),
    Number(values.second),
  );

  return zonedAsUtc - date.getTime();
}

function stockholmLocalDateTimeToUtc(year: number, month: number, day: number) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const firstOffset = timeZoneOffsetMs(utcGuess);
  const adjusted = new Date(utcGuess.getTime() - firstOffset);
  const finalOffset = timeZoneOffsetMs(adjusted);

  return new Date(utcGuess.getTime() - finalOffset);
}

function stockholmDayBounds(date: Date) {
  const { year, month, day } = stockholmDateParts(date);
  const start = stockholmLocalDateTimeToUtc(year, month, day);
  const nextStart = stockholmLocalDateTimeToUtc(year, month, day + 1);

  return { start, end: new Date(nextStart.getTime() - 1), nextStart };
}

function stockholmIsoDay(date: Date) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: RESTAURANT_TIME_ZONE,
    weekday: 'short',
  }).format(date);
  const days: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };

  return days[weekday] ?? 1;
}

function todayOpeningLabel(hours: Awaited<ReturnType<typeof listRestaurantOpeningHours>>, now: Date) {
  const isoDay = stockholmIsoDay(now);
  const hour = hours.find((item) => item.dayOfWeek === isoDay);
  if (!hour) return 'Ej angivet';
  if (hour.isClosed) return hour.label ?? 'Stängt';
  return `${hour.opensAt} - ${hour.closesAt}`;
}

function formatClock(value: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: RESTAURANT_TIME_ZONE,
  }).format(new Date(value));
}

function stockholmLongDate(date: Date) {
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: RESTAURANT_TIME_ZONE,
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export async function RestaurantDashboard({
  organizationId,
  userId,
  roles,
}: {
  organizationId: string;
  userId: string;
  roles: string[];
}) {
  const [canReadReservations, canWriteReservations, canReadSchedule, canReadTasks] = await Promise.all([
    hasPermission(roles, 'reservations.read').catch(() => false),
    hasPermission(roles, 'reservations.write').catch(() => false),
    hasPermission(roles, 'schedule.read').catch(() => false),
    hasPermission(roles, 'tasks.read').catch(() => false),
  ]);
  const now = new Date();
  const { start: todayStart, end: todayEnd, nextStart: tomorrowStart } = stockholmDayBounds(now);
  const emptyReservations = Promise.resolve<RestaurantReservationRequestView[]>([]);
  const emptySchedule = Promise.resolve<Awaited<ReturnType<typeof listScheduleShifts>>>([]);
  const emptyTasks = Promise.resolve<Awaited<ReturnType<typeof listChecklistTasks>>>([]);

  const [
    currentShift,
    todayShifts,
    hours,
    categories,
    pendingReservations,
    confirmedToday,
    upcomingConfirmed,
    scheduledToday,
    openTasks,
  ] = await Promise.all([
    getCurrentAttendanceShift(organizationId, userId).catch(() => null),
    listTodayAttendance(organizationId).catch(() => []),
    listRestaurantOpeningHours(organizationId).catch(() => []),
    listRestaurantMenu(organizationId).catch(() => []),
    canReadReservations
      ? listReservationRequests(organizationId, { status: 'new' }).catch(() => [])
      : emptyReservations,
    canReadReservations
      ? listReservationRequests(organizationId, {
        status: 'confirmed',
        from: todayStart.toISOString(),
        to: todayEnd.toISOString(),
      }).catch(() => [])
      : emptyReservations,
    canReadReservations
      ? listReservationRequests(organizationId, {
        status: 'confirmed',
        from: now.toISOString(),
      }).catch(() => [])
      : emptyReservations,
    canReadSchedule
      ? listScheduleShifts(organizationId, {
        from: todayStart.toISOString(),
        to: tomorrowStart.toISOString(),
      }).catch(() => [])
      : emptySchedule,
    canReadTasks
      ? listChecklistTasks(organizationId, { includeCompleted: false }).catch(() => [])
      : emptyTasks,
  ]);
  const activeStaff = todayShifts.filter((shift) => shift.status === 'active');
  const menuItems = categories.reduce((sum, category) => sum + category.items.length, 0);
  const overdueTasks = openTasks.filter((task) => task.dueAt && new Date(task.dueAt).getTime() < now.getTime());
  const taskPreview = openTasks.slice(0, 4);
  const schedulePreview = scheduledToday.filter((shift) => shift.status !== 'cancelled').slice(0, 4);
  const dateLabel = stockholmLongDate(now);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="relative overflow-hidden rounded-[var(--ui-radius-panel)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 md:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--ui-accent-subtle)] via-transparent to-transparent"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Image
              src="/fluffys/favicon.svg"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-[12px] shadow-sm"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-accent-active)]">
                Fluffy’s · Personalportal
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-[var(--ui-text)]">Dagens drift</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--ui-text-muted)]">
                Snabb överblick över bemanning, öppettider, meny och dagens viktigaste arbetsflöden.
              </p>
            </div>
          </div>
          <p className="shrink-0 text-sm font-medium text-[var(--ui-text-secondary)]">{dateLabel}</p>
        </div>
      </header>

      <KpiStrip
        items={[
          { id: 'staff', label: 'Incheckade', value: activeStaff.length, detail: 'Aktiv personal just nu', tone: activeStaff.length > 0 ? 'success' : 'neutral' },
          { id: 'hours', label: 'Öppet idag', value: todayOpeningLabel(hours, now), detail: 'Publika öppettider' },
          {
            id: 'schedule',
            label: 'Pass idag',
            value: canReadSchedule ? scheduledToday.filter((shift) => shift.status !== 'cancelled').length : '-',
            detail: canReadSchedule ? 'Planerade schemapass' : 'Begränsad åtkomst',
            tone: schedulePreview.length > 0 ? 'info' : 'neutral',
          },
          {
            id: 'reservations',
            label: 'Nya bokningar',
            value: canReadReservations ? pendingReservations.length : '-',
            detail: canReadReservations ? 'Väntar på svar' : 'Begränsad åtkomst',
            tone: pendingReservations.length > 0 ? 'warning' : 'neutral',
          },
          { id: 'menu', label: 'Menyrader', value: menuItems, detail: `${categories.length} kategorier`, tone: menuItems > 0 ? 'info' : 'warning' },
          {
            id: 'tasks',
            label: 'Öppna uppgifter',
            value: canReadTasks ? openTasks.length : '-',
            detail: canReadTasks ? `${overdueTasks.length} försenade` : 'Begränsad åtkomst',
            tone: overdueTasks.length > 0 ? 'warning' : 'neutral',
          },
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
                    {formatClock(shift.clockInAt)}
                    {shift.clockOutAt ? ` - ${formatClock(shift.clockOutAt)}` : ''}
                  </p>
                </div>
                <StatusBadge tone={shift.status === 'active' ? 'success' : 'neutral'}>{shift.status === 'active' ? 'Aktiv' : 'Klar'}</StatusBadge>
              </div>
            ))}
          </div>
          {canReadSchedule ? (
            <section className="space-y-3 border-t border-[var(--ui-border)] pt-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Planerade pass</h3>
                <Button asChild variant="ghost" size="compact">
                  <Link href="/schema">Schema</Link>
                </Button>
              </div>
              <div className="divide-y divide-[var(--ui-border)]">
                {schedulePreview.length === 0 ? (
                  <p className="py-3 text-sm text-[var(--ui-text-muted)]">Inga schemalagda pass idag.</p>
                ) : schedulePreview.map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ui-text)]">{scheduledStaffName(shift)}</p>
                      <p className="text-xs text-[var(--ui-text-muted)]">
                        {formatClock(shift.startsAt)} - {formatClock(shift.endsAt)}
                        {shift.roleLabel ? ` · ${shift.roleLabel}` : ''}
                      </p>
                    </div>
                    <StatusBadge tone="info">Planerad</StatusBadge>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="space-y-3">
          <div className="flex items-center gap-2">
            <PackageIcon />
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Meny</h2>
          </div>
          <p className="text-sm text-[var(--ui-text-muted)]">Hantera kategorier och rätter via Meny-sidan. Publika sidan läser samma data.</p>
          <Button asChild variant="secondary" size="compact">
            <Link href="/meny">Öppna meny</Link>
          </Button>
        </Panel>
        <RestaurantReservationsDashboardPanel
          canReadReservations={canReadReservations}
          canWriteReservations={canWriteReservations}
          initialSummary={{
            pending: pendingReservations,
            confirmedToday,
            upcomingConfirmed,
          }}
        />
        <Panel className="space-y-3">
          <div className="flex items-center gap-2">
            <NoteIcon />
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Uppgifter</h2>
          </div>
          {!canReadTasks ? (
            <p className="text-sm text-[var(--ui-text-muted)]">Uppgifter visas för roller med uppgiftsåtkomst.</p>
          ) : taskPreview.length === 0 ? (
            <p className="text-sm text-[var(--ui-text-muted)]">Inga öppna uppgifter just nu.</p>
          ) : (
            <div className="divide-y divide-[var(--ui-border)]">
              {taskPreview.map((task) => {
                const overdue = task.dueAt ? new Date(task.dueAt).getTime() < now.getTime() : false;

                return (
                  <div key={task.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ui-text)]">{task.title}</p>
                      <p className="text-xs text-[var(--ui-text-muted)]">
                        {task.area ?? 'Allmänt'}
                        {task.dueAt ? ` · senast ${formatClock(task.dueAt)}` : ''}
                      </p>
                    </div>
                    {overdue ? <StatusBadge tone="warning">Försenad</StatusBadge> : null}
                  </div>
                );
              })}
            </div>
          )}
          {canReadTasks ? (
            <Button asChild variant="secondary" size="compact">
              <Link href="/uppgifter">Visa uppgifter</Link>
            </Button>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
