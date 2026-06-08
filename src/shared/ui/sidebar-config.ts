'use client';

import type React from 'react';
import {
  BriefcaseIcon,
  UserIcon,
  SettingsIcon,
  FileTextIcon,
  ReceiptIcon,
  CreditCardIcon,
  PackageIcon,
  CompanyIcon,
  HomeIcon,
  UsersIcon,
  BarChart2Icon,
} from '@shared/ui/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

export interface NavLink {
  type: 'link';
  href: string;
  label: string;
  icon: IconComponent;
  exact?: boolean;
  badge?: number;
  adminOnly?: boolean;
}

export interface NavDropdown {
  type: 'dropdown';
  key: string;
  label: string;
  icon: IconComponent;
  adminOnly?: boolean;
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
      { type: 'link', href: '/',        label: 'Översikt', icon: HomeIcon, exact: true },
      {
        type: 'dropdown',
        key: 'offerter',
        label: 'Offerter',
        icon: ReceiptIcon,
        items: [
          { href: '/offerter',    label: 'Alla offerter' },
          { href: '/offerter/ny', label: 'Ny offert' },
        ],
      },
      {
        type: 'dropdown',
        key: 'projekt',
        label: 'Projekt',
        icon: BriefcaseIcon,
        items: [
          { href: '/projekt',                    label: 'Alla projekt' },
          { href: '/projekt?stage=uppgifter',    label: 'Nya' },
          { href: '/projekt?stage=bestallt',     label: 'Beställda' },
        ],
      },
      {
        type: 'dropdown',
        key: 'fakturor',
        label: 'Fakturor',
        icon: CreditCardIcon,
        items: [
          { href: '/fakturor',    label: 'Alla fakturor' },
          { href: '/fakturor/ny', label: 'Ny faktura' },
        ],
      },
      { type: 'link', href: '/crm',      label: 'Kunder',   icon: UsersIcon },
      { type: 'link', href: '/analytics', label: 'Aktivitet', icon: BarChart2Icon },
    ],
  },
  {
    section: 'Verktyg',
    items: [
      { type: 'link', href: '/mallar',    label: 'Mallar',           icon: FileTextIcon },
      { type: 'link', href: '/produkter', label: 'Produktbibliotek', icon: PackageIcon },
    ],
  },
  {
    section: 'Administration',
    adminOnly: true,
    items: [
      { type: 'link', href: '/installningar/foretag',   label: 'Företag',      icon: CompanyIcon },
      { type: 'link', href: '/installningar/anvandare', label: 'Användare',    icon: UserIcon },
      {
        type: 'dropdown',
        key: 'installningar',
        label: 'Inställningar',
        icon: SettingsIcon,
        items: [
          { href: '/installningar',        label: 'Allmänt' },
          { href: '/installningar/profil', label: 'Profil' },
        ],
      },
    ],
  },
];


export const LS_DROPDOWNS_KEY = 'sidebar-open-dropdowns';
