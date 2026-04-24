# Endpoint And Operations Security Standard

Owner: Engineering lead  
Review cadence: Quarterly and after material infrastructure or tooling changes  
Status: Baseline identified

This standard defines the baseline for endpoint/admin devices, operational monitoring, capacity review, clock consistency, and privileged administrative tooling.

## Endpoint And Administrative Device Baseline

- Use approved, access-controlled devices for repository, VPS, database, and SaaS administration.
- Keep credentials, keys, and tokens outside the repository.
- Use device/session locking and least-privilege administrative access for privileged work.
- Keep operating systems, security updates, and baseline endpoint protections current on devices used for privileged administration.

## Capacity And Monitoring Baseline

- Review service health, release healthchecks, incident outcomes, and restore-test findings as the minimum operational monitoring baseline.
- Treat failed deploy healthchecks, incident drills, and restore tests as signals for capacity, readiness, or resilience follow-up.
- Keep capacity or monitoring assumptions under review after major architecture, traffic, or supplier changes.

## Clock And Utility Baseline

- Rely on platform, OS, and provider-managed time synchronization for deployed environments.
- Restrict use of powerful administrative utilities to approved operators and the documented deploy/recovery path.

## Related Evidence

- `.github/workflows/deploy.yml`
- `scripts/deploy-release.sh`
- `docs/security/INCIDENT_RESPONSE.md`
- `docs/security/RESTORE_TEST_PLAYBOOK.md`
- `docs/security/ACCESS_CONTROL.md`
