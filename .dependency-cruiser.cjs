/**
 * Dependency Cruiser configuration.
 *
 * Enforces the domain dependency rules described in ARCHITECTURE.md.
 * Run: npx depcruise --validate .dependency-cruiser.cjs src
 *
 * Install: npm install --save-dev dependency-cruiser
 *
 * Dependency hierarchy:
 *   demos      → can import modules, core, platform, shared
 *   generic    → can import supporting, core, platform, shared
 *   supporting → can import core, platform, shared
 *   core       → can import platform, shared only
 *   platform   → can import shared only (no module deps)
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [

    // ─── Core isolation ─────────────────────────────────────────────────────────
    {
      name: 'core-no-supporting',
      severity: 'error',
      comment:
        'Core domains (automation, voice) must not depend on supporting domains (crm, leads, identity, offers, etc.). ' +
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
        'Core domains must not depend on generic domains (team-hub, dashboard, projects) or demos.',
      from: {
        path: '^src/modules/core',
      },
      to: {
        path: ['^src/modules/generic', '^src/modules/demos'],
      },
    },

    // ─── Supporting isolation ────────────────────────────────────────────────────
    {
      name: 'supporting-no-generic',
      severity: 'error',
      comment:
        'Supporting domains must not depend on generic domains. ' +
        'Use the event bus for cross-domain communication.',
      from: {
        path: '^src/modules/supporting',
      },
      to: {
        path: '^src/modules/generic',
      },
    },
    {
      name: 'supporting-no-cross-supporting',
      severity: 'error',
      comment:
        'Supporting modules must not import directly from each other. ' +
        'Cross-supporting communication must go through domain events (event bus). ' +
        'Exception: auth handlers import audit for audit logging.',
      from: {
        path: '^src/modules/supporting/([^/]+)',
      },
      to: {
        path: '^src/modules/supporting',
        pathNot: '^src/modules/supporting/$1',
      },
    },
    {
      name: 'supporting-no-demos',
      severity: 'error',
      comment:
        'Supporting modules must not depend on demo modules.',
      from: {
        path: '^src/modules/supporting',
      },
      to: {
        path: '^src/modules/demos',
      },
    },
    {
      name: 'generic-no-demos',
      severity: 'warn',
      comment:
        'Generic modules should not import from demo verticals. ' +
        'Move shared types to a shared/ location or the owning module\'s index.ts.',
      from: {
        path: '^src/modules/generic',
      },
      to: {
        path: '^src/modules/demos',
      },
    },

    // ─── Platform isolation ─────────────────────────────────────────────────────
    {
      name: 'platform-no-modules',
      severity: 'error',
      comment:
        'Platform layer must not import from any business modules or demos.',
      from: {
        path: '^src/platform',
      },
      to: {
        path: ['^src/modules'],
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
        path: ['^src/modules'],
      },
    },

    // ─── Module encapsulation ────────────────────────────────────────────────────
    {
      name: 'no-intra-module-deep-imports-outside-entrypoints',
      severity: 'warn',
      comment:
        'Within a module, import domain/application/infrastructure internals only from that module\'s public entrypoints. ' +
        'Other source files should depend on the module contract.',
      from: {
        path: '^src/modules/([^/]+)/([^/]+)/(?!index\\.ts$|server\\.ts$)',
      },
      to: {
        path: '^src/modules/$1/$2/(domain|application|infrastructure)/',
      },
    },
    {
      name: 'no-cross-module-deep-imports',
      severity: 'warn',
      comment:
        'Import other modules through their public entrypoint, not their domain/application/infrastructure internals.',
      from: {
        path: '^src/modules/([^/]+)/([^/]+)',
      },
      to: {
        path: '^src/modules/[^/]+/[^/]+/(domain|application|infrastructure)/',
        pathNot: '^src/modules/$1/$2/',
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
        collapsePattern: '^(node_modules|src/(shared|platform))/[^/]+',
      },
    },
  },
};
