/**
 * Dependency Cruiser configuration.
 *
 * Enforces the domain dependency rules described in ARCHITECTURE.md.
 * Run: npx depcruise --validate .dependency-cruiser.cjs src
 *
 * Install: npm install --save-dev dependency-cruiser
 *
 * Rules follow the DDD classification hierarchy:
 *   generic → supporting → core → infrastructure/shared
 *
 * During Phase 1 migration, rules target both src/modules/ (new) and
 * src/features/ (existing) paths to catch violations early.
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
        path: ['^src/modules/core', '^src/features/(automation|voice)'],
      },
      to: {
        path: [
          '^src/modules/supporting',
          '^src/features/(crm|leads|offers|identity)',
        ],
      },
    },
    {
      name: 'core-no-generic',
      severity: 'error',
      comment:
        'Core domains must not depend on generic domains (hotel, team-hub, billing, analytics).',
      from: {
        path: ['^src/modules/core', '^src/features/(automation|voice)'],
      },
      to: {
        path: [
          '^src/modules/generic',
          '^src/features/(hotel|team-hub)',
        ],
      },
    },

    // ─── Supporting isolation ────────────────────────────────────────────────────
    {
      name: 'supporting-no-generic',
      severity: 'error',
      comment:
        'Supporting domains (crm, leads, identity) must not depend on generic domains (hotel, team-hub). ' +
        'Use the event bus for cross-domain communication.',
      from: {
        path: [
          '^src/modules/supporting',
          '^src/features/(crm|leads|offers|identity)',
        ],
      },
      to: {
        path: [
          '^src/modules/generic',
          '^src/features/(hotel|team-hub)',
        ],
      },
    },

    // ─── Shared/ domain-free ─────────────────────────────────────────────────────
    {
      name: 'shared-no-features',
      severity: 'warn',
      comment:
        'shared/ must not import from feature or module domains. ' +
        'If this is domain state, move it to the owning feature module.',
      from: {
        path: '^src/shared',
        // Allow the re-export shim in realtime-store.ts (deprecated)
        pathNot: '^src/shared/stores/realtime-store\\.ts',
      },
      to: {
        path: ['^src/features', '^src/modules'],
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
        // Allow intra-module deep imports (a module can import its own internals)
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
