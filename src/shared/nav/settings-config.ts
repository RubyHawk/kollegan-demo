'use client';

import type { IconComponent } from '@shared/nav/types';
import {
  UserIcon,
  ShieldIcon,
  SunIcon,
  CompanyIcon,
  MailIcon,
  BellIcon,
  LinkIcon,
  BlocksIcon,
  CreditCardIcon,
  SlidersIcon,
  UsersIcon,
  HelpCircleIcon,
} from '@shared/ui/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SettingsItem {
  href: string;
  label: string;
  icon: IconComponent;
  /** If set, only these roles can see this item. Overrides parent section roles. */
  roles?: string[];
}

export interface SettingsSection {
  key: string;
  label: string;
  icon: IconComponent;
  /** If set, only these roles can see this section (and its items). */
  roles?: string[];
  items: SettingsItem[];
}

// ─── Canonical settings config ────────────────────────────────────────────────
//
// Single source of truth for:
//   • The settings page sidebar (settings-nav.tsx)
//   • The footer popover "Konto" links in sidebar.tsx
//   • Breadcrumb label derivation in app-shell.tsx
//   • The administration sidebar entry items in sidebar-config.ts
//
// Role rules are defined ONCE here and applied everywhere.

export const SETTINGS_CONFIG: SettingsSection[] = [
  {
    key: 'konto',
    label: 'Konto',
    icon: UserIcon,
    // No roles — visible to all authenticated users
    items: [
      { href: '/installningar/profil',   label: 'Profil',   icon: UserIcon   },
      { href: '/installningar/sakerhet', label: 'Säkerhet', icon: ShieldIcon },
      { href: '/installningar/utseende', label: 'Utseende', icon: SunIcon    },
    ],
  },
  {
    key: 'organisation',
    label: 'Organisation',
    icon: CompanyIcon,
    roles: ['admin', 'super_admin'],
    items: [
      { href: '/installningar/foretag',        label: 'Företag',        icon: CompanyIcon   },
      { href: '/installningar/epost',          label: 'E-post',         icon: MailIcon      },
      { href: '/installningar/anslutningar',   label: 'Anslutningar',   icon: LinkIcon      },
      { href: '/installningar/notifieringar',  label: 'Notifieringar',  icon: BellIcon      },
      { href: '/installningar/integrationer',  label: 'Integrationer',  icon: BlocksIcon    },
      { href: '/installningar/fakturering',    label: 'Fakturering',    icon: CreditCardIcon},
      { href: '/installningar/anpassade-falt', label: 'Anpassade fält', icon: SlidersIcon   },
    ],
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: ShieldIcon,
    roles: ['admin', 'super_admin', 'helpdesk'],
    items: [
      {
        href: '/installningar/anvandare',
        label: 'Användare',
        icon: UsersIcon,
        roles: ['admin', 'super_admin'],
      },
      {
        href: '/installningar/mfa-support',
        label: 'MFA-support',
        icon: HelpCircleIcon,
        roles: ['admin', 'super_admin', 'helpdesk'],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function canSeeSettingsItem(role: string, item: SettingsItem): boolean {
  if (item.roles) return item.roles.includes(role);
  return true;
}

export function getVisibleSettings(role: string): SettingsSection[] {
  return SETTINGS_CONFIG
    .filter((s) => !s.roles || s.roles.includes(role))
    .map((s) => ({
      ...s,
      items: s.items.filter((item) => canSeeSettingsItem(role, item)),
    }))
    .filter((s) => s.items.length > 0);
}

/** Items always visible to all users — used by the sidebar footer popover. */
export const KONTO_ITEMS: SettingsItem[] =
  SETTINGS_CONFIG.find((s) => s.key === 'konto')?.items ?? [];

/**
 * Flat map of URL last-segment → display label for every settings route.
 * Consumed by app-shell.tsx to build breadcrumbs without manual maintenance.
 */
export const SETTINGS_CRUMB_MAP: Record<string, string> = Object.fromEntries(
  SETTINGS_CONFIG.flatMap((s) =>
    s.items.map((item) => {
      const seg = item.href.split('/').filter(Boolean).at(-1)!;
      return [seg, item.label];
    }),
  ),
);
