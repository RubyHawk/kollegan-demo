# API Versioning

Kollegan will expose stable API contracts for browser UI now and future mobile clients later.

## Strategy

- Introduce `/api/v1/**`.
- Move browser clients to `/api/v1/**`.
- Keep legacy `/api/**` routes temporarily as compatibility wrappers.
- Do not change response shapes during route migration.
- Additive fields are allowed.
- Breaking changes require an adapter or future `/api/v2`.
- Do not keep duplicate legacy and canonical product routes after a migration is proven complete.

## Route Rules

`src/app/api/**/route.ts` files must be thin re-exports from module handlers.

Handlers own:

- auth,
- authorization,
- Zod schema validation,
- rate limits,
- response shape,
- error mapping.

## Client Rules

Browser code uses feature API clients, not inline fetch.

Literal non-versioned `/api/*` references outside route files are exceptions, not the default. New exceptions are allowed only for documented public-document routes, demos, OpenAPI specs, proxy allowlists, or infrastructure/integration endpoints. Browser and ERP product flows must prefer `/api/v1/**`, and CI blocks new unapproved non-versioned literals outside route files.

## Route Lifecycle

Each API family must be one of:

- canonical `/api/v1/**`,
- an approved non-versioned exception,
- a temporary legacy/V1 overlap with explicit rollout metadata,
- or a duplicate-removal candidate.

Temporary duplicate product routes are allowed only when `scripts/api-route-overlaps.json` records:

```txt
legacyPath
canonicalPath
featureFlagKey
owner
reason
expiresOn
```

`npm run check:api-route-lifecycle` fails if a product legacy route has no canonical V1 replacement, if it coexists with that replacement without overlap metadata, if the registration expires, or if stale overlap metadata remains after the routes are gone. Feature flags are for staged behavior rollouts and rollback; they do not justify keeping duplicate external API paths forever.

Target clients:

```txt
offers.api.ts
projects.api.ts
companies.api.ts
products.api.ts
customers.api.ts
procurement.api.ts
branding.api.ts
feature-flags.api.ts
```
