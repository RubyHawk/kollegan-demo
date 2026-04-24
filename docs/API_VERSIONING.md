# API Versioning

Kollegan will expose stable API contracts for browser UI now and future mobile clients later.

## Strategy

- Introduce `/api/v1/**`.
- Move browser clients to `/api/v1/**`.
- Keep legacy `/api/**` routes temporarily as compatibility wrappers.
- Do not change response shapes during route migration.
- Additive fields are allowed.
- Breaking changes require an adapter or future `/api/v2`.

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
