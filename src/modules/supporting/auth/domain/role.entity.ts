// ─── Role and permission entities ─────────────────────────────────────────────

export type RoleName =
  | 'super_admin'
  | 'admin'
  | 'helpdesk'
  | 'user'
  | 'viewer'
  | 'customer_admin'
  | 'customer_viewer'
  | 'restaurant_owner'
  | 'restaurant_manager'
  | 'restaurant_staff'
  | 'restaurant_kitchen'
  | 'restaurant_accountant';

export interface Role {
  id: string;
  name: RoleName;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  createdAt: Date;
}

// All system permissions: resource.action
export const SYSTEM_ROLES: Array<{ name: RoleName; displayName: string; permissions: string[] }> = [
  {
    name: 'super_admin',
    displayName: 'Super Admin',
    permissions: ['*.*'], // wildcard — enforced in RBAC service
  },
  {
    name: 'admin',
    displayName: 'Admin',
    permissions: [
      'workflow.read', 'workflow.write', 'workflow.delete', 'workflow.admin',
      'leads.read', 'leads.write', 'leads.delete', 'leads.admin',
      'crm.read', 'crm.write', 'crm.admin',
      'portal.read', 'portal.write', 'portal.admin', 'portal.provision',
      'users.read', 'users.write', 'users.delete', 'users.admin', 'users.mfa_reset',
      'audit.read', 'audit.export',
      'org.read', 'org.write', 'org.admin',
      'demo.read', 'demo.write',
      'analytics.read',
      // ERP resources
      'offers.read', 'offers.write', 'offers.delete', 'offers.admin',
      'products.read', 'products.write', 'products.delete',
      'companies.read', 'companies.write', 'companies.delete', 'companies.admin',
      'projects.read', 'projects.write', 'projects.delete', 'projects.admin',
      'procurement.read', 'procurement.write', 'procurement.delete', 'procurement.admin',
    ],
  },
  {
    name: 'helpdesk',
    displayName: 'Helpdesk',
    permissions: [
      'users.read',
      'users.mfa_reset',
    ],
  },
  {
    name: 'user',
    displayName: 'User',
    permissions: [
      'workflow.read', 'leads.read', 'leads.write', 'leads.delete',
      'crm.read', 'crm.write', 'demo.read', 'demo.write', 'analytics.read',
      // ERP resources
      'offers.read', 'offers.write',
      'products.read',
      'companies.read',
      'projects.read', 'projects.write',
      'procurement.read',
    ],
  },
  {
    name: 'viewer',
    displayName: 'Viewer',
    permissions: [
      'workflow.read', 'leads.read', 'crm.read', 'demo.read', 'analytics.read',
      // ERP resources
      'offers.read', 'products.read', 'companies.read', 'projects.read', 'procurement.read',
    ],
  },
  {
    name: 'customer_admin',
    displayName: 'Customer Admin',
    permissions: [
      'workflow.read', 'portal.read', 'portal.write', 'users.read',
    ],
  },
  {
    name: 'customer_viewer',
    displayName: 'Customer Viewer',
    permissions: ['workflow.read', 'portal.read'],
  },
  {
    name: 'restaurant_owner',
    displayName: 'Restaurant Owner',
    permissions: [
      'clock_in.self',
      'attendance.read', 'attendance.correct',
      'reservations.read', 'reservations.write',
      'menu.read', 'menu.write',
      'schedule.read', 'schedule.write',
      'tasks.read', 'tasks.write',
      'restaurant_reports.read',
      'users.read', 'users.write',
    ],
  },
  {
    name: 'restaurant_manager',
    displayName: 'Restaurant Manager',
    permissions: [
      'clock_in.self',
      'attendance.read', 'attendance.correct',
      'reservations.read', 'reservations.write',
      'menu.read', 'menu.write',
      'schedule.read', 'schedule.write',
      'tasks.read', 'tasks.write',
      'restaurant_reports.read',
      'users.read', 'users.write',
    ],
  },
  {
    name: 'restaurant_staff',
    displayName: 'Restaurant Staff',
    permissions: ['clock_in.self', 'menu.read', 'schedule.read', 'tasks.read', 'tasks.write'],
  },
  {
    name: 'restaurant_kitchen',
    displayName: 'Restaurant Kitchen',
    permissions: ['clock_in.self', 'menu.read', 'schedule.read', 'tasks.read', 'tasks.write'],
  },
  {
    name: 'restaurant_accountant',
    displayName: 'Restaurant Accountant',
    permissions: ['attendance.read', 'reservations.read', 'menu.read', 'schedule.read', 'restaurant_reports.read'],
  },
];
