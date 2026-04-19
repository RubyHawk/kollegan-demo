# Modules

Kollegan modules follow DDD-style boundaries.

```txt
core/        platform-defining capabilities
supporting/  ERP support domains such as auth, offers, products, customers
generic/     cross-cutting ERP capabilities such as projects, dashboard, portal
demos/       isolated showcase/demo verticals
```

## Standard Module Shape

```txt
module/
  domain/
  application/
  infrastructure/
  api/handlers/
  events/
  index.ts
```

## Rules

- Cross-module imports go through `index.ts`.
- Repositories own Prisma.
- Services own use cases.
- Handlers own HTTP shape.
- Events own cross-module notifications.
- ERP modules do not import demo modules.
- Browser UI does not import repositories or services.

