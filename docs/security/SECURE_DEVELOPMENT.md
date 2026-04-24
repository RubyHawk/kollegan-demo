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
- Run dependency-boundary and text-encoding guards in PR CI.
- Keep security-relevant PRs linked to repo-backed security/evidence docs.
- Do not commit secrets.
- Use synthetic/redacted data in tests and prompts.
- Add tests before high-risk refactors.
- Keep deploy automation reproducible from Git-tracked workflow and script changes.

## Required Checks

```bash
npm run check:migrations
npm run check:file-size
npm run check:ai-proxies
npm run check:security-evidence
npm run check:encoding
npm run lint:deps
npm run lint
npm run typecheck
npm test
npm run build
```

If a check cannot run, record why in the PR.

Pull-request checks are the required merge gate. The production deploy workflow is a separate release process and must use Git-tracked artifacts and deploy scripts rather than manual server-only changes.
