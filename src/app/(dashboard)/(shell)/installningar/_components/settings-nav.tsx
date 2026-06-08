'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Blocks,
  BriefcaseBusiness,
  Building2,
  CircleHelp,
  CreditCard,
  Link as LinkIcon,
  Mail,
  Shield,
  Sun,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
  allowedRoles?: string[];
}

interface NavSection {
  label: string;
  icon: ReactNode;
  items: NavItem[];
}

const iconProps = { 'aria-hidden': true, size: 16, strokeWidth: 1.75 } as const;
const sectionIconProps = { 'aria-hidden': true, size: 13, strokeWidth: 2 } as const;

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Konto',
    icon: <User {...sectionIconProps} />,
    items: [
      { href: '/installningar/profil', label: 'Profil', icon: <User {...iconProps} /> },
      { href: '/installningar/sakerhet', label: 'Säkerhet', icon: <Shield {...iconProps} /> },
      { href: '/installningar/utseende', label: 'Utseende', icon: <Sun {...iconProps} /> },
    ],
  },
  {
    label: 'Organisation',
    icon: <BriefcaseBusiness {...sectionIconProps} />,
    items: [
      { href: '/installningar/epost', label: 'E-post', icon: <Mail {...iconProps} /> },
      { href: '/installningar/anslutningar', label: 'Anslutningar', icon: <LinkIcon {...iconProps} /> },
      { href: '/installningar/foretag', label: 'Företag', icon: <Building2 {...iconProps} /> },
      { href: '/installningar/integrationer', label: 'Integrationer', icon: <Blocks {...iconProps} /> },
      { href: '/installningar/notifieringar', label: 'Notifieringar', icon: <Bell {...iconProps} /> },
      { href: '/installningar/fakturering', label: 'Fakturering', icon: <CreditCard {...iconProps} /> },
    ],
  },
  {
    label: 'Admin',
    icon: <Shield {...sectionIconProps} />,
    items: [
      {
        href: '/installningar/anvandare',
        label: 'Användare',
        icon: <Users {...iconProps} />,
        adminOnly: true,
      },
      {
        href: '/installningar/mfa-support',
        label: 'MFA-support',
        icon: <CircleHelp {...iconProps} />,
        allowedRoles: ['super_admin', 'admin', 'helpdesk'],
      },
    ],
  },
];

const ALL_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

function canSeeItem(userRole: string, item: NavItem): boolean {
  if (item.allowedRoles) return item.allowedRoles.includes(userRole);
  if (item.adminOnly) return userRole === 'admin' || userRole === 'super_admin';
  return true;
}

export default function SettingsNav({ userRole }: { userRole: string }) {
  const pathname = usePathname();

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canSeeItem(userRole, item)),
  })).filter((section) => section.items.length > 0);

  const mobileItems = ALL_ITEMS.filter((item) => canSeeItem(userRole, item));

  return (
    <>
      <nav className="hidden w-48 shrink-0 pr-6 md:block">
        <div className="flex flex-col gap-5">
          {visibleSections.map((section) => (
            <div key={section.label}>
              <div className="mb-1 flex items-center gap-1.5 px-3">
                <span className="text-[var(--ui-text-muted)]">{section.icon}</span>
                <p className="text-[10px] font-semibold uppercase text-[var(--ui-text-muted)]">
                  {section.label}
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-[var(--ui-accent-subtle)] font-medium text-[var(--ui-accent)]'
                          : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-subtle)] hover:text-[var(--ui-text)]',
                      )}
                    >
                      <span className={cn('shrink-0', active ? 'text-[var(--ui-accent)]' : 'text-[var(--ui-text-muted)]')}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <nav className="grid grid-cols-2 gap-2 pb-4 sm:grid-cols-3 md:hidden">
        {mobileItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--ui-radius-control)] border px-3 py-2 text-xs font-medium transition-colors',
                active
                  ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[var(--ui-text)]'
                  : 'border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-subtle)]',
              )}
            >
              <span className={cn('shrink-0', active ? 'text-[var(--ui-text)]' : 'text-[var(--ui-text-muted)]')}>
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
