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
  items: Array<{ href: string; label: string; adminOnly?: boolean }>;
}

export type NavEntry = NavLink | NavDropdown;

export interface NavSection {
  section: string;
  items: NavEntry[];
  adminOnly?: boolean;
}

export interface User {
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl?: string | null;
  role: string;
}

export interface SidebarProps {
  user: User;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  onMobileClose?: () => void;
}

// ─── Navigation config ────────────────────────────────────────────────────────

export const NAV_CONFIG: NavSection[] = [
  {
    section: 'Huvudmeny',
    items: [
      { type: 'link', href: '/', label: 'Översikt', icon: HomeIcon, exact: true },
      {
        type: 'dropdown',
        key: 'offerter',
        label: 'Offerter',
        icon: ReceiptIcon,
        primaryAction: { href: '/offerter/ny', label: 'Ny offert' },
        items: [
          { href: '/offerter',    label: 'Alla offerter' },
          { href: '/offerter/ny', label: 'Ny offert'     },
        ],
      },
      // Single link — no sub-pages warrant a dropdown today.
      // Convert back to dropdown when project phases get dedicated routes.
      { type: 'link', href: '/projekt', label: 'Projekt', icon: BriefcaseIcon },
      {
        type: 'dropdown',
        key: 'fakturor',
        label: 'Fakturor',
        icon: CreditCardIcon,
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
        items: [
          { href: '/crm',          label: 'Översikt'  },
          { href: '/crm/contacts', label: 'Kontakter' },
          { href: '/crm/leads',    label: 'Leads'     },
        ],
      },
      { type: 'link', href: '/analytics', label: 'Aktivitet', icon: BarChart2Icon },
    ],
  },
  {
    section: 'Verktyg',
    items: [
      { type: 'link', href: '/mallar',    label: 'Mallar',           icon: FileTextIcon },
      { type: 'link', href: '/produkter', label: 'Produktbibliotek', icon: PackageIcon  },
    ],
  },
  // Settings/administration are not part of the main nav — they're reached via the
  // settings cog in the account footer (see sidebar.tsx) and the in-settings sub-rail.
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
