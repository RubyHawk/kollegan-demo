'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@shared/lib/utils';
import { Icon } from './shared';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/installningar/profil',
    label: 'Profil',
    icon: <Icon path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />,
  },
  {
    href: '/installningar/sakerhet',
    label: 'Säkerhet',
    icon: <Icon path={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>} />,
  },
  {
    href: '/installningar/utseende',
    label: 'Utseende',
    icon: <Icon path={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>} />,
  },
  {
    href: '/installningar/epost',
    label: 'E-post',
    icon: <Icon path={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>} />,
  },
  {
    href: '/installningar/anslutningar',
    label: 'Anslutningar',
    icon: <Icon path={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>} />,
  },
  {
    href: '/installningar/foretag',
    label: 'Företag',
    icon: <Icon path={<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h.01M7 12h.01M7 16h.01"/><path d="M11 8h6M11 12h6M11 16h6"/></>} />,
  },
  {
    href: '/installningar/integrationer',
    label: 'Integrationer',
    icon: <Icon path={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>} />,
  },
  {
    href: '/installningar/fakturering',
    label: 'Fakturering',
    icon: <Icon path={<><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>} />,
  },
  {
    href: '/installningar/anvandare',
    label: 'Användare',
    icon: <Icon path={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />,
    adminOnly: true,
  },
];

export default function SettingsNav({ userRole }: { userRole: string }) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || userRole === 'admin');

  return (
    <>
      <nav className="hidden md:block w-48 shrink-0 pr-6">
        <div className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]',
                )}
              >
                <span className={cn('shrink-0', active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <nav className="grid grid-cols-2 gap-2 pb-4 sm:grid-cols-3 md:hidden">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
                active
                  ? 'border-[color-mix(in_srgb,var(--accent)_24%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface-alt))] text-[var(--text-primary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]',
              )}
            >
              <span className={cn('shrink-0', active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
