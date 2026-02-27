/**
 * Dependency Cruiser configuration.
 *
 * Enforces the domain dependency rules described in ARCHITECTURE.md.
 * Run: npx depcruise --validate .dependency-cruiser.cjs src
 *
 * Install: npm install --save-dev dependency-cruiser
 *
 * Dependency hierarchy:
 *   demos      → can import modules, core, infrastructure, shared
 *   generic    → can import supporting, core, infrastructure, shared
 *   supporting → can import core, infrastructure, shared
 *   core       → can import infrastructure, shared only
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [

    // ─── Core isolation ─────────────────────────────────────────────────────────
    {
      name: 'core-no-supporting',
      severity: 'error',
      comment:
        'Core domains (automation, voice) must not depend on supporting domains (crm, leads, identity, offers). ' +
        'Use the event bus with string event types instead.',
      from: {
        path: '^src/modules/core',
      },
      to: {
        path: '^src/modules/supporting',
      },
    },
    {
      name: 'core-no-generic',
      severity: 'error',
      comment:
        'Core domains must not depend on generic domains (team-hub, dashboard) or demos (hotel).',
      from: {
        path: '^src/modules/core',
      },
      to: {
        path: ['^src/modules/generic', '^src/demos'],
      },
    },

    // ─── Supporting isolation ────────────────────────────────────────────────────
    {
      name: 'supporting-no-generic',
      severity: 'error',
      comment:
        'Supporting domains (crm, leads, identity) must not depend on generic domains (team-hub, dashboard). ' +
        'Use the event bus for cross-domain communication.',
      from: {
        path: '^src/modules/supporting',
      },
      to: {
        path: '^src/modules/generic',
      },
    },

    // ─── Shared/ domain-free ─────────────────────────────────────────────────────
    {
      name: 'shared-no-modules',
      severity: 'warn',
      comment:
        'shared/ must not import from module domains or demos. ' +
        'If this is domain state, move it to the owning module.',
      from: {
        path: '^src/shared',
      },
      to: {
        path: ['^src/modules', '^src/demos'],
      },
    },

    // ─── Module encapsulation ────────────────────────────────────────────────────
    {
      name: 'no-deep-module-imports',
      severity: 'warn',
      comment:
        'Import from a module\'s public index.ts barrel only. ' +
        'Deep imports into domain/, application/, or infrastructure/ break encapsulation.',
      from: {
        path: '^src/modules',
      },
      to: {
        path: '^src/modules/[^/]+/[^/]+/(domain|application|infrastructure)/',
      },
    },

  ],

  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
      },
      archi: {
        collapsePattern: '^(node_modules|src/(shared|infrastructure))/[^/]+',
      },
    },
  },
};
