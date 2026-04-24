# Configuration And Application Security Standard

Owner: Engineering lead  
Review cadence: Quarterly and after material architecture or release-process changes  
Status: Baseline identified

This standard defines the baseline for configuration management, software installation on operational systems, application security requirements, and protection during audit or verification testing.

## Configuration Management

- Keep application, workflow, and release logic versioned in Git wherever practical.
- Review configuration-changing changes through pull requests and quality gates.
- Keep secrets and environment-specific credentials outside the repository.
- Prefer reproducible workflows and tracked scripts over manual one-off operational steps.

## Installation Of Software On Operational Systems

- Production changes should flow through the tracked deployment path rather than unreviewed direct installation.
- Deploy the exact merged Git revision and tracked deploy script.
- Treat emergency or manual changes as exceptions that must be documented after the fact through the incident/change process.

## Application Security Requirements

- Treat offers, signing, auth, production data, and admin/support access as high-impact workflows.
- Preserve architecture boundaries: Prisma in repositories, HTTP in handlers, browser code through API clients.
- Use pull-request checks, dependency guards, file-size guards, and evidence requirements as part of the application security baseline.

## Protection During Audit Or Verification Testing

- Prefer non-production, redacted, or synthetic information for audit validation, testing, and evidence preparation.
- Keep raw sensitive artifacts external when needed, and reference them from repo-backed evidence instead of committing them directly.
- Protect production systems from intrusive or ad hoc testing by using the documented restore-test and review playbooks.

## Related Evidence

- `.github/workflows/quality-gates.yml`
- `.github/workflows/deploy.yml`
- `scripts/deploy-release.sh`
- `docs/security/CHANGE_MANAGEMENT.md`
- `docs/security/RESTORE_TEST_PLAYBOOK.md`
- `docs/AI_ENGINEERING.md`
