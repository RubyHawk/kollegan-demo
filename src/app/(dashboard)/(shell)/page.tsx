import { getDashboardOrganizationIdForUser, getDashboardReadModel } from '@modules/generic/dashboard';
import { getSessionUser } from '@platform/auth/session';
import DashboardView from './_components/DashboardView';

function makeGreeting(name: string | null): { greeting: string; sub: string } {
  const now = new Date();
  const hour = parseInt(
    new Intl.DateTimeFormat('sv', { hour: 'numeric', hour12: false, timeZone: 'Europe/Stockholm' }).format(now),
    10,
  );
  const dow = new Intl.DateTimeFormat('sv', { weekday: 'long', timeZone: 'Europe/Stockholm' }).format(now);
  const dowCap = dow.charAt(0).toUpperCase() + dow.slice(1);

  const prefix =
    hour < 5
      ? 'God natt'
      : hour < 12
        ? 'God morgon'
        : hour < 17
          ? 'God eftermiddag'
          : hour < 22
            ? 'God kväll'
            : 'God natt';

  const firstName = name?.split(' ')[0] ?? null;
  const greeting = firstName ? `${prefix}, ${firstName}.` : `${prefix}.`;

  const sub =
    hour < 5
      ? 'Ta det lugnt — det är mitt i natten.'
      : hour < 9
        ? `${dowCap}smorgon — kaffet är på, dags att sätta igång.`
        : hour < 12
          ? `En fin ${dow} — vad ska vi ta itu med idag?`
          : hour < 14
            ? 'Bra jobbat i morse — håll tempot uppe.'
            : hour < 17
              ? `${dowCap}seftermiddag — kolla läget på dina offerter.`
              : hour < 20
                ? 'Dagen lider mot sitt slut — se hur det gick idag.'
                : hour < 22
                  ? 'Kvällspasset — lugn och ro för att fatta beslut.'
                  : 'Sent på natten — kom ihåg att vila.';

  return { greeting, sub };
}

function makeDateLabel() {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Stockholm',
  }).format(now);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const orgId = await getDashboardOrganizationIdForUser(user.id);

  if (!orgId) {
    return (
      <div className="px-8 py-10 text-sm text-[var(--text-muted)]">
        Ingen organisation kopplad till ditt konto.
      </div>
    );
  }

  const data = await getDashboardReadModel(orgId);
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;
  const { greeting: greetingText, sub: greetingSub } = makeGreeting(displayName);

  return (
    <DashboardView
      greetingText={greetingText}
      greetingSub={greetingSub}
      dateLabel={makeDateLabel()}
      {...data}
    />
  );
}
