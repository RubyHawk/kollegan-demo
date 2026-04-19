# Secure Development

Owner: Engineering lead  
Review cadence: Quarterly  
Status: Draft baseline

## Rules

- Use pull requests for production changes.
- Review AI-generated code like human-written code.
- Keep Prisma in repositories and HTTP behavior in handlers.
- Run migration safety checks before schema deploys.
- Run file-size checks to prevent new monoliths.
- Do not commit secrets.
- Use synthetic/redacted data in tests and prompts.
- Add tests before high-risk refactors.

## Required Checks

```bash
npm run check:migrations
npm run check:file-size
npm run check:ai-proxies
npm run lint
npm run typecheck
npm test
npm run build
```

If a check cannot run, record why in the PR.

