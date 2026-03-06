import { redirect } from 'next/navigation';
import { getSessionUser } from '@core/auth/session';
import { MailIcon, UserIcon, SettingsIcon } from '@shared/ui/icons';

// ─── Row ─────────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3.5 border-b border-[var(--border)] last:border-0">
      <span className="w-36 shrink-0 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-[var(--text-primary)]">
        {value ?? <span className="text-[var(--text-muted)] italic">Ej angivet</span>}
      </span>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-1)]/40">
        <span className="text-[var(--text-muted)]">{icon}</span>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
      </div>
      <div className="px-6 py-1">{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const initials    = displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const roleLabel: Record<string, string> = {
    admin:    'Administratör',
    manager:  'Chef',
    staff:    'Personal',
    viewer:   'Läsare',
  };

  return (
    <div className="px-6 py-10 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">Inställningar</h1>
        <p className="text-sm text-[var(--text-muted)]">Din kontoinformation och profiluppgifter.</p>
      </div>

      {/* Avatar + name banner */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-[var(--accent)]">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-[var(--text-primary)] truncate">{displayName}</p>
          <p className="text-sm text-[var(--text-muted)] capitalize">{roleLabel[user.role] ?? user.role}</p>
        </div>
      </div>

      {/* Profile section */}
      <Section title="Profil" icon={<UserIcon size={15} />}>
        <Row label="Förnamn"    value={user.firstName} />
        <Row label="Efternamn"  value={user.lastName} />
        <Row label="Visningsnamn" value={displayName} />
      </Section>

      {/* Account section */}
      <Section title="Konto" icon={<MailIcon size={15} />}>
        <Row label="E-post"     value={user.email} />
        <Row label="Roll"       value={roleLabel[user.role] ?? user.role} />
        <Row label="Kontotyp"   value={user.userType} />
      </Section>

      {/* Preferences placeholder */}
      <Section title="Preferenser" icon={<SettingsIcon size={15} />}>
        <div className="py-6 flex flex-col items-center justify-center text-center opacity-50 select-none">
          <p className="text-sm text-[var(--text-muted)]">Inga inställningar tillgängliga ännu.</p>
        </div>
      </Section>

    </div>
  );
}
