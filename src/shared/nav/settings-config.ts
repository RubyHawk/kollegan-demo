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
  LayersIcon,
  UsersIcon,
  HelpCircleIcon,
} from '@shared/ui/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SettingsItem {
  href: string;
  label: string;
  /** Short page intro, rendered by the settings page header and the command palette. */
  description: string;
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
      {
        href: '/installningar/profil',
        label: 'Profil',
        description: 'Namn, avatar och kontaktuppgifter för ditt konto.',
        icon: UserIcon,
      },
      {
        href: '/installningar/sakerhet',
        label: 'Säkerhet',
        description: 'Lösenord, tvåfaktorsautentisering, passkeys och aktiva sessioner.',
        icon: ShieldIcon,
      },
      {
        href: '/installningar/utseende',
        label: 'Utseende',
        description: 'Tema, accentfärg, typsnitt och textstorlek.',
        icon: SunIcon,
      },
    ],
  },
  {
    key: 'organisation',
    label: 'Organisation',
    icon: CompanyIcon,
    roles: ['admin', 'super_admin'],
    items: [
      {
        href: '/installningar/foretag',
        label: 'Företag',
        description: 'Bolagsuppgifter, medlemmar och branding per företag.',
        icon: CompanyIcon,
      },
      {
        href: '/installningar/epost',
        label: 'E-post',
        description: 'Avsändarnamn och avsändaradress för utgående e-post.',
        icon: MailIcon,
      },
      {
        href: '/installningar/anslutningar',
        label: 'Anslutningar',
        description: 'Anslut Soleria till verktygen ni redan använder.',
        icon: LinkIcon,
      },
      {
        href: '/installningar/notifieringar',
        label: 'Notifieringar',
        description: 'Interna e-postmottagare för offert- och systemhändelser.',
        icon: BellIcon,
      },
      {
        href: '/installningar/integrationer',
        label: 'Integrationer',
        description: 'Aktivera och hantera tredjepartsintegrationer.',
        icon: BlocksIcon,
      },
      {
        href: '/installningar/fakturering',
        label: 'Fakturering',
        description: 'Plan, betalningsmetod och fakturahistorik.',
        icon: CreditCardIcon,
      },
      {
        href: '/installningar/anpassade-falt',
        label: 'Anpassade fält',
        description: 'Egna fält per objekttyp för extra information.',
        icon: LayersIcon,
      },
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
        description: 'Hantera personal och deras åtkomst till systemet.',
        icon: UsersIcon,
        roles: ['admin', 'super_admin'],
      },
      {
        href: '/installningar/mfa-support',
        label: 'MFA-support',
        description: 'Återställ MFA för utelåsta användare, med spårbar logg.',
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

/** Resolve the settings section + item that own a pathname (exact match or sub-route). */
export function getSettingsContextForPath(
  pathname: string,
): { section: SettingsSection; item: SettingsItem } | null {
  for (const section of SETTINGS_CONFIG) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(item.href + '/')) return { section, item };
    }
  }
  return null;
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
