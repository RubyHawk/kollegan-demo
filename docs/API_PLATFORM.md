# API Platform

Kollegan APIs are internal product contracts for the browser UI today and future mobile clients later.

## Versioning

Use `/api/v1/**` for new clients. Keep legacy `/api/**` wrappers temporarily to protect the current app while clients migrate.

Policy:

- Additive fields are allowed.
- Response-shape breaking changes require an adapter or future `/api/v2`.
- Route migration PRs must not change response shape.
- Public routes must be explicitly documented and tested.
- Product routes need a canonical `/api/v1/**` replacement before legacy retirement. Temporary legacy/V1 overlap must be registered in `scripts/api-route-overlaps.json` with a feature flag key, owner, reason, and expiry date; missing replacements, expired overlaps, or unregistered duplicate product routes fail CI.
- Feature-flagged implementation overlap and duplicate external routes are separate concerns: a rollout may keep one route while switching internal behavior behind a flag.

See [API versioning](API_VERSIONING.md).

## Handler Pattern

Handlers live in modules:

```txt
src/modules/supporting/offers/api/handlers/offer.handler.ts
```

Route files re-export handlers:

```ts
export { handleListOffers as GET } from '@modules/supporting/offers';
```

Handlers own:

- authentication,
- authorization,
- Zod schemas,
- rate limits,
- response shape,
- error mapping.

## Browser Client Pattern

Browser code should call feature API clients, not inline `fetch`:

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

Feature API clients wrap the shared client in `src/shared/lib/api-client.ts`.

## Contract Tests

Critical contracts need tests:

- offers list/detail/public/sign/decline,
- projects list/detail/advance,
- companies,
- products/categories,
- auth-sensitive admin routes.
