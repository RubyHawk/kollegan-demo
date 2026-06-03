-- Migration: 20260603000001_seed_all_system_roles_and_permissions
--
-- Seeds all system roles and their permissions into the RBAC tables.
-- Safe to re-apply: all inserts use ON CONFLICT DO NOTHING.
-- Adds ERP resource permissions (offers, companies, products, projects,
-- procurement) that were missing from the role definitions.
--
-- Roles seeded: super_admin, admin, helpdesk, user, viewer,
--               customer_admin, customer_viewer
--
-- No schema changes — data-only migration.

-- ─── 1. Roles ─────────────────────────────────────────────────────────────────

INSERT INTO "usr_roles" ("id", "name", "displayName", "description", "isSystem", "createdAt")
VALUES
  (gen_random_uuid()::TEXT, 'super_admin',      'Super Admin',      'System-level administrator — VPS assignment only.', TRUE, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'admin',             'Admin',            'Full ERP access within the organisation.',          TRUE, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'helpdesk',          'Helpdesk',         'Organisation-scoped MFA recovery operator.',        TRUE, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'user',              'User',             'Standard staff member.',                            TRUE, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'viewer',            'Viewer',           'Read-only access to ERP data.',                     TRUE, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'customer_admin',    'Customer Admin',   'Customer portal administrator.',                    TRUE, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'customer_viewer',   'Customer Viewer',  'Customer portal read-only access.',                 TRUE, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- ─── 2. Permissions ───────────────────────────────────────────────────────────
-- Format: resource.action
-- Resources: workflow, leads, crm, portal, users, audit, org, demo, analytics,
--            offers, products, companies, projects, procurement

INSERT INTO "usr_permissions" ("id", "resource", "action", "createdAt")
VALUES
  -- workflow
  (gen_random_uuid()::TEXT, 'workflow',    'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'workflow',    'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'workflow',    'delete',  CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'workflow',    'admin',   CURRENT_TIMESTAMP),
  -- leads
  (gen_random_uuid()::TEXT, 'leads',       'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'leads',       'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'leads',       'delete',  CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'leads',       'admin',   CURRENT_TIMESTAMP),
  -- crm
  (gen_random_uuid()::TEXT, 'crm',         'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'crm',         'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'crm',         'admin',   CURRENT_TIMESTAMP),
  -- portal
  (gen_random_uuid()::TEXT, 'portal',      'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'portal',      'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'portal',      'admin',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'portal',      'provision', CURRENT_TIMESTAMP),
  -- users
  (gen_random_uuid()::TEXT, 'users',       'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'users',       'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'users',       'delete',  CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'users',       'admin',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'users',       'mfa_reset', CURRENT_TIMESTAMP),
  -- audit
  (gen_random_uuid()::TEXT, 'audit',       'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'audit',       'export',  CURRENT_TIMESTAMP),
  -- org
  (gen_random_uuid()::TEXT, 'org',         'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'org',         'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'org',         'admin',   CURRENT_TIMESTAMP),
  -- demo
  (gen_random_uuid()::TEXT, 'demo',        'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'demo',        'write',   CURRENT_TIMESTAMP),
  -- analytics
  (gen_random_uuid()::TEXT, 'analytics',   'read',    CURRENT_TIMESTAMP),
  -- offers (ERP — was missing)
  (gen_random_uuid()::TEXT, 'offers',      'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'offers',      'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'offers',      'delete',  CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'offers',      'admin',   CURRENT_TIMESTAMP),
  -- products (ERP — was missing)
  (gen_random_uuid()::TEXT, 'products',    'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'products',    'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'products',    'delete',  CURRENT_TIMESTAMP),
  -- companies (ERP — was missing)
  (gen_random_uuid()::TEXT, 'companies',   'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'companies',   'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'companies',   'delete',  CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'companies',   'admin',   CURRENT_TIMESTAMP),
  -- projects (ERP — was missing)
  (gen_random_uuid()::TEXT, 'projects',    'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'projects',    'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'projects',    'delete',  CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'projects',    'admin',   CURRENT_TIMESTAMP),
  -- procurement (ERP — was missing)
  (gen_random_uuid()::TEXT, 'procurement', 'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'procurement', 'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'procurement', 'delete',  CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'procurement', 'admin',   CURRENT_TIMESTAMP)
ON CONFLICT ("resource", "action") DO NOTHING;

-- ─── 3. Role → Permission mappings ───────────────────────────────────────────
-- super_admin: wildcard enforced in RBAC service code — no DB rows needed.

-- admin: full ERP access
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('workflow', 'read'),   ('workflow', 'write'),  ('workflow', 'delete'), ('workflow', 'admin'),
  ('leads',    'read'),   ('leads',    'write'),  ('leads',    'delete'), ('leads',    'admin'),
  ('crm',      'read'),   ('crm',      'write'),  ('crm',      'admin'),
  ('portal',   'read'),   ('portal',   'write'),  ('portal',   'admin'),  ('portal',   'provision'),
  ('users',    'read'),   ('users',    'write'),  ('users',    'delete'), ('users',    'admin'), ('users', 'mfa_reset'),
  ('audit',    'read'),   ('audit',    'export'),
  ('org',      'read'),   ('org',      'write'),  ('org',      'admin'),
  ('demo',     'read'),   ('demo',     'write'),
  ('analytics','read'),
  ('offers',   'read'),   ('offers',   'write'),  ('offers',   'delete'), ('offers',   'admin'),
  ('products', 'read'),   ('products', 'write'),  ('products', 'delete'),
  ('companies','read'),   ('companies','write'),   ('companies','delete'), ('companies','admin'),
  ('projects', 'read'),   ('projects', 'write'),  ('projects', 'delete'), ('projects', 'admin'),
  ('procurement','read'), ('procurement','write'), ('procurement','delete'),('procurement','admin')
)
WHERE r."name" = 'admin'
ON CONFLICT DO NOTHING;

-- helpdesk: MFA recovery only
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('users', 'read'),
  ('users', 'mfa_reset')
)
WHERE r."name" = 'helpdesk'
ON CONFLICT DO NOTHING;

-- user: standard ERP operator
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('workflow',     'read'),
  ('leads',        'read'),   ('leads',    'write'),  ('leads',    'delete'),
  ('crm',          'read'),   ('crm',      'write'),
  ('demo',         'read'),   ('demo',     'write'),
  ('analytics',    'read'),
  ('offers',       'read'),   ('offers',   'write'),
  ('products',     'read'),
  ('companies',    'read'),
  ('projects',     'read'),   ('projects', 'write'),
  ('procurement',  'read')
)
WHERE r."name" = 'user'
ON CONFLICT DO NOTHING;

-- viewer: read-only
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('workflow',    'read'),
  ('leads',       'read'),
  ('crm',         'read'),
  ('demo',        'read'),
  ('analytics',   'read'),
  ('offers',      'read'),
  ('products',    'read'),
  ('companies',   'read'),
  ('projects',    'read'),
  ('procurement', 'read')
)
WHERE r."name" = 'viewer'
ON CONFLICT DO NOTHING;

-- customer_admin: portal management
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('workflow', 'read'),
  ('portal',   'read'), ('portal', 'write'),
  ('users',    'read')
)
WHERE r."name" = 'customer_admin'
ON CONFLICT DO NOTHING;

-- customer_viewer: portal read-only
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('workflow', 'read'),
  ('portal',   'read')
)
WHERE r."name" = 'customer_viewer'
ON CONFLICT DO NOTHING;
