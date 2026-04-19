---
name: api-contract-safety
description: Use before changing API handlers, route files, API clients, response shapes, or public signing endpoints.
---

# API Contract Safety

Read `docs/API_VERSIONING.md`.

Rules:

- Use `/api/v1/**` for new clients.
- Keep legacy wrappers until usage is verified gone.
- Do not break response shape during route moves.
- Additive fields are allowed.
- Public routes must be explicitly documented.
- Handlers own auth, Zod validation, rate limits, and response shape.

