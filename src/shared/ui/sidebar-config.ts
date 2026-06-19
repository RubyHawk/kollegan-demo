'use client';

import {
  BriefcaseIcon,
  FileTextIcon,
  ReceiptIcon,
  CreditCardIcon,
  PackageIcon,
  HomeIcon,
  UsersIcon,
  BarChart2Icon,
  ClockIcon,
  CalendarIcon,
  LinkIcon,
} from '@shared/ui/icons';
import type { IconComponent } from '@shared/nav/types';
import { SETTINGS_CRUMB_MAP } from '@shared/nav/settings-config';

// ─── Types ────────────────────────────────────────────────────────────────────

// Re-exported so existing importers of sidebar-config don't need to change.
export type { IconComponent } from '@shared/nav/types';

export interface NavLink {
  type: 'link';
  href: string;
  label: string;
  icon: IconComponent;
  exact?: boolean;
  badge?: number;
  adminOnly?: boolean;
  /** CTA shown in the topbar when the user is on this route. */
  primaryAction?: { href: string; label: string };
  moduleKey?: string;
}

export interface NavDropdown {
  type: 'dropdown';
  key: string;
  label: string;
  icon: IconComponent;
  adminOnly?: boolean;
  /**
   * Where the icon navigates when the sidebar is collapsed.
   * Defaults to items[0].href if omitted.
   */
  collapsedHref?: string;
  /** CTA shown in the topbar when the user is anywhere under this dropdown. */
  primaryAction?: { href: string; label: string };
  moduleKey?: string;
  items: Array<{ href: string; label: string; adminOnly?: boolean }>;
}

export type NavEntry = NavLink | NavDropdown;

export interface NavSection {
  section: string;
  items: NavEntry[];
  adminOnly?: boolean;
  moduleKey?: string;
}

export interface User {
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl?: string | null;
  role: string;
  orgId?: string | null;
}

/** Workspace identity shown in the shell header. Defaults to the platform brand. */
export interface ShellBrand {
  name: string;
  isPlatform: boolean;
  /**
   * Resolved portal brand key (e.g. 'platform', 'fluffys'). Surfaced on the
   * shell root as `data-brand` so a tenant skin can re-point the `--ui-*`
   * tokens for that tenant only, leaving other hosts byte-for-byte unchanged.
   */
  key?: string;
}

export interface SidebarProps {
  user: User;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  onMobileClose?: () => void;
  enabledModules?: string[];
  brand?: ShellBrand;
}

// ─── Navigation config ────────────────────────────────────────────────────────

export const NAV_CONFIG: NavSection[] = [
  {
    section: 'Huvudmeny',
    items: [
      { type: 'link', href: '/', label: 'Översikt', icon: HomeIcon, exact: true, moduleKey: 'offers' },
      {
        type: 'dropdown',
        key: 'offerter',
        label: 'Offerter',
        icon: ReceiptIcon,
        moduleKey: 'offers',
        primaryAction: { href: '/offerter/ny', label: 'Ny offert' },
        items: [
          { href: '/offerter',    label: 'Alla offerter' },
          { href: '/offerter/ny', label: 'Ny offert'     },
        ],
      },
      // Single link — no sub-pages warrant a dropdown today.
      // Convert back to dropdown when project phases get dedicated routes.
      { type: 'link', href: '/projekt', label: 'Projekt', icon: BriefcaseIcon, moduleKey: 'projects' },
      {
        type: 'dropdown',
        key: 'fakturor',
        label: 'Fakturor',
        icon: CreditCardIcon,
        moduleKey: 'invoicing',
        primaryAction: { href: '/fakturor/ny', label: 'Ny faktura' },
        items: [
          { href: '/fakturor',    label: 'Alla fakturor' },
          { href: '/fakturor/ny', label: 'Ny faktura'    },
        ],
      },
      {
        type: 'dropdown',
        key: 'kunder',
        label: 'Kunder',
        icon: UsersIcon,
        moduleKey: 'offers',
        items: [
          { href: '/crm',          label: 'Översikt'  },
          { href: '/crm/contacts', label: 'Kontakter' },
          { href: '/crm/leads',    label: 'Leads'     },
        ],
      },
      { type: 'link', href: '/analytics', label: 'Aktivitet', icon: BarChart2Icon, moduleKey: 'offers' },
    ],
  },
  {
    section: 'Restaurang',
    items: [
      { type: 'link', href: '/', label: 'Dagens drift', icon: HomeIcon, exact: true, moduleKey: 'restaurant_public_site' },
      { type: 'link', href: '/kassa', label: 'Kassa', icon: ReceiptIcon, moduleKey: 'restaurant_orders' },
      { type: 'link', href: '/kok', label: 'Kök', icon: PackageIcon, moduleKey: 'restaurant_orders' },
      { type: 'link', href: '/ordrar', label: 'Ordrar', icon: BarChart2Icon, moduleKey: 'restaurant_orders' },
      { type: 'link', href: '/bokningar', label: 'Bokningar', icon: CalendarIcon, moduleKey: 'restaurant_public_site' },
      { type: 'link', href: '/narvaro', label: 'Närvaro', icon: ClockIcon, moduleKey: 'clock_in' },
      { type: 'link', href: '/personal', label: 'Personal', icon: UsersIcon, moduleKey: 'clock_in' },
      { type: 'link', href: '/schema', label: 'Schema', icon: CalendarIcon, moduleKey: 'staff_schedule' },
      { type: 'link', href: '/meny', label: 'Meny', icon: PackageIcon, moduleKey: 'restaurant_menu' },
      { type: 'link', href: '/webbplats', label: 'Webbplats', icon: LinkIcon, moduleKey: 'restaurant_public_site' },
      { type: 'link', href: '/uppgifter', label: 'Uppgifter', icon: FileTextIcon, moduleKey: 'tasks' },
    ],
  },
  {
    section: 'Verktyg',
    items: [
      { type: 'link', href: '/mallar',    label: 'Mallar',           icon: FileTextIcon, moduleKey: 'offers' },
      { type: 'link', href: '/produkter', label: 'Produktbibliotek', icon: PackageIcon, moduleKey: 'offers' },
    ],
  },
  // Settings/administration are not part of the main nav — they're reached via the
  // settings cog in the account footer (see sidebar.tsx) and the in-settings rail.
];

// ─── Breadcrumb label map ─────────────────────────────────────────────────────
//
// Built from NAV_CONFIG + SETTINGS_CRUMB_MAP so that adding a new nav entry
// or settings route automatically produces the correct breadcrumb label.
// Only truly ambiguous cases (crm path vs kunder label, root segment) are
// handled manually below.

function buildNavCrumbMap(): Record<string, string> {
  const map: Record<string, string> = {};

  for (const section of NAV_CONFIG) {
    for (const entry of section.items) {
      if (entry.type === 'link') {
        const seg = entry.href.split('/').filter(Boolean).at(-1);
        if (seg) map[seg] = entry.label;
      } else {
        // Dropdown parent: map the key as the top-level segment label
        map[entry.key] = entry.label;
        for (const child of entry.items) {
          const seg = child.href.split('/').filter(Boolean).at(-1);
          if (seg && !map[seg]) map[seg] = child.label;
        }
      }
    }
  }

  return map;
}

/**
 * Complete breadcrumb label map, derived from navigation config.
 * Consumed by app-shell.tsx — do not maintain manually.
 */
export const NAV_CRUMB_MAP: Record<string, string> = {
  // Derived from NAV_CONFIG
  ...buildNavCrumbMap(),
  // Derived from SETTINGS_CONFIG (all settings routes)
  ...SETTINGS_CRUMB_MAP,
  // Manual overrides for segments that can't be cleanly derived:
  installningar: 'Inställningar', // top-level prefix segment
  crm:           'CRM',           // sidebar labels it "Kunder"; path segment is "crm"
};

export const LS_DROPDOWNS_KEY = 'sidebar-open-dropdowns';

function navEntryEnabled(entry: NavEntry, enabledModules: string[]): boolean {
  return !entry.moduleKey || enabledModules.includes(entry.moduleKey);
}

export function getNavConfigForModules(enabledModules: string[]): NavSection[] {
  if (enabledModules.length === 0) return NAV_CONFIG;

  return NAV_CONFIG
    .map((section) => ({
      ...section,
      items: section.items.filter((entry) => navEntryEnabled(entry, enabledModules)),
    }))
    .filter((section) => section.items.length > 0);
}
