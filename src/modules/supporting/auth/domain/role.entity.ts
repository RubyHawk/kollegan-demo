// ─── Role and permission entities ─────────────────────────────────────────────

export type RoleName =
  | 'super_admin'
  | 'admin'
  | 'user'
  | 'viewer'
  | 'customer_admin'
  | 'customer_viewer';

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
      'users.read', 'users.write', 'users.delete', 'users.admin',
      'audit.read', 'audit.export',
      'org.read', 'org.write', 'org.admin',
      'demo.read', 'demo.write',
      'analytics.read',
    ],
  },
  {
    name: 'user',
    displayName: 'User',
    permissions: [
      'workflow.read', 'leads.read', 'leads.write', 'leads.delete',
      'crm.read', 'crm.write', 'demo.read', 'demo.write', 'analytics.read',
    ],
  },
  {
    name: 'viewer',
    displayName: 'Viewer',
    permissions: [
      'workflow.read', 'leads.read', 'crm.read', 'demo.read', 'analytics.read',
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
];
