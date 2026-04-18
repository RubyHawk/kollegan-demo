import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".claude/**",
    ".codex-artifacts/**",
    "out/**",
    "build/**",
    "deliverables/**",
    "deliveries/**",
    "preview-changes/**",
    "next-env.d.ts",
  ]),

  // ─── Architecture: Core domain isolation ─────────────────────────────────────
  // Core modules (automation, voice) must NEVER import from supporting or generic.
  // They communicate cross-domain via the event bus (string-based event types only).
  {
    files: [
      "src/modules/core/**/*.ts",
      "src/modules/core/**/*.tsx",
      // Guard the current src/features/ equivalents during migration
      "src/features/automation/**/*.ts",
      "src/features/automation/**/*.tsx",
      "src/features/voice/**/*.ts",
      "src/features/voice/**/*.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: [
                "@modules/supporting/*",
                "@modules/generic/*",
                "@features/crm/*",
                "@features/leads/*",
                "@features/offers/*",
                "@features/identity/*",
                "@features/hotel/*",
                "@features/team-hub/*",
              ],
              message:
                "Core domains (automation, voice) cannot depend on supporting or generic modules. " +
                "Use string-based event bus subscriptions instead. See ARCHITECTURE.md.",
            },
          ],
        },
      ],
    },
  },

  // ─── Architecture: Supporting domain isolation ────────────────────────────────
  // Supporting modules (crm, leads, etc.) must NOT import from generic modules.
  {
    files: [
      "src/modules/supporting/**/*.ts",
      "src/modules/supporting/**/*.tsx",
      // Guard src/features/ equivalents during migration
      "src/features/crm/**/*.ts",
      "src/features/crm/**/*.tsx",
      "src/features/leads/**/*.ts",
      "src/features/leads/**/*.tsx",
      "src/features/offers/**/*.ts",
      "src/features/offers/**/*.tsx",
      "src/features/identity/**/*.ts",
      "src/features/identity/**/*.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: [
                "@modules/generic/*",
                "@features/hotel/*",
                "@features/team-hub/*",
              ],
              message:
                "Supporting domains (crm, leads, identity) cannot depend on generic modules (hotel, team-hub). " +
                "Use events for cross-domain communication. See ARCHITECTURE.md.",
            },
          ],
        },
      ],
    },
  },

  // ─── Architecture: Shared/ must stay domain-free ─────────────────────────────
  // shared/ contains only UI primitives, utilities, and infrastructure-agnostic helpers.
  // It must not import from any feature or domain module.
  {
    files: [
      "src/shared/**/*.ts",
      "src/shared/**/*.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@features/*", "@modules/*"],
              message:
                "shared/ must not import from feature or domain modules. " +
                "If this is domain state, move it to the owning feature module. " +
                "See ARCHITECTURE.md for the shared/ decision tree.",
            },
          ],
        },
      ],
    },
  },

  // ─── Architecture: Module encapsulation ──────────────────────────────────────
  // External code must only import from a module's public index.ts barrel.
  {
    files: [
      "src/modules/**/*.ts",
      "src/modules/**/*.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: [
                "@modules/core/*/domain/*",
                "@modules/core/*/application/*",
                "@modules/core/*/infrastructure/*",
                "@modules/supporting/*/domain/*",
                "@modules/supporting/*/application/*",
                "@modules/supporting/*/infrastructure/*",
                "@modules/generic/*/domain/*",
                "@modules/generic/*/application/*",
                "@modules/generic/*/infrastructure/*",
              ],
              message:
                "Import from a module's public index.ts only, not from internal layers. " +
                "Deep imports break module encapsulation. See ARCHITECTURE.md.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
