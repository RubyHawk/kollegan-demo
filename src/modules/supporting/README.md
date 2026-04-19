# Supporting Modules

Supporting modules implement ERP support domains such as auth, offers, leads, customers, products, procurement, compliance, meetings, messaging, and integrations.

Rules:

- Use the standard module shape.
- Do not import generic or demo internals.
- Prefer events or public module contracts for cross-domain communication.
- Keep Prisma in `infrastructure`.
- Keep HTTP behavior in `api/handlers`.

