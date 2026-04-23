/**
 * Dependency Cruiser configuration.
 *
 * Enforces the domain dependency rules described in docs/ARCHITECTURE.md.
 * Run: npm run lint:deps
 *
 * Dependency hierarchy:
 *   demos      -> can import modules, core, platform, shared
 *   generic    -> can import supporting, core, platform, shared
 *   supporting -> can import core, platform, shared
 *   core       -> can import platform, shared only
 *   platform   -> can import shared only
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // Core isolation
    {
      name: 'core-no-supporting',
      severity: 'warn',
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
      severity: 'warn',
      comment:
        'Core domains must not depend on generic domains (team-hub, dashboard, projects) or demos.',
      from: {
        path: '^src/modules/core',
      },
      to: {
        path: ['^src/modules/generic', '^src/modules/demos'],
      },
    },

    // Supporting isolation
    {
      name: 'supporting-no-generic',
      severity: 'warn',
      comment:
        'Supporting domains must not depend on generic domains. Use the event bus for cross-domain communication.',
      from: {
        path: '^src/modules/supporting',
      },
      to: {
        path: '^src/modules/generic',
      },
    },
    {
      name: 'supporting-no-cross-supporting',
      severity: 'warn',
      comment:
        'Supporting modules must not import directly from each other. Cross-supporting communication must go through domain events or module public contracts.',
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
      severity: 'warn',
      comment: 'Supporting modules must not depend on demo modules.',
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
        'Generic modules should not import from demo verticals. Move shared types to shared/ or the owning module public contract.',
      from: {
        path: '^src/modules/generic',
      },
      to: {
        path: '^src/modules/demos',
      },
    },

    // Platform and shared isolation
    {
      name: 'platform-no-modules',
      severity: 'warn',
      comment: 'Platform layer must not import from any business modules or demos.',
      from: {
        path: '^src/platform',
      },
      to: {
        path: '^src/modules',
      },
    },
    {
      name: 'shared-no-modules',
      severity: 'warn',
      comment:
        'shared/ must not import from module domains or demos. If this is domain state, move it to the owning module.',
      from: {
        path: '^src/shared',
      },
      to: {
        path: '^src/modules',
      },
    },

    // App and browser boundaries
    {
      name: 'app-no-prisma-client',
      severity: 'error',
      comment:
        'Next.js app routes and pages must not import Prisma directly. Keep database access in module repositories.',
      from: {
        path: '^src/app',
      },
      to: {
        path: '^node_modules/@prisma/client',
      },
    },
    {
      name: 'app-no-platform-database',
      severity: 'error',
      comment:
        'Next.js app routes and pages must not import platform database helpers directly. Use module handlers/services.',
      from: {
        path: '^src/app',
      },
      to: {
        path: '^src/platform/database',
      },
    },
    {
      name: 'app-no-module-infrastructure',
      severity: 'error',
      comment:
        'Next.js app routes and pages must not import module repositories directly. API route files should thinly re-export handlers.',
      from: {
        path: '^src/app',
      },
      to: {
        path: '^src/modules/[^/]+/[^/]+/infrastructure/',
      },
    },
    {
      name: 'browser-no-module-application',
      severity: 'error',
      comment:
        'Browser-facing app code must use HTTP API clients instead of importing module application services.',
      from: {
        path: '^src/app/(?!api/)',
      },
      to: {
        path: '^src/modules/[^/]+/[^/]+/application/',
      },
    },

    // Module encapsulation across module boundaries.
    // Same-module layer imports are allowed: application services may use their own repositories,
    // handlers may use their own services, and helpers may share local module internals.
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
