# Information Transfer Standard

Owner: ISMS Manager  
Review cadence: Quarterly and after major workflow or supplier changes  
Status: Baseline identified

This standard defines approved transfer paths for Kollegan information and the minimum controls expected when information leaves one system, person, or trust boundary for another.

## Approved Transfer Paths

- Application traffic through Kollegan ERP HTTP APIs and public-offer/signing flows.
- Transactional customer communication through approved suppliers listed in `SUPPLIER_MANAGEMENT.md`.
- Repository collaboration through GitHub pull requests and issues when content is redacted and does not include restricted raw data.
- Operational evidence sharing through repo-backed security documents when secrets and restricted raw data are excluded.
- Backup references and restore-test coordination through approved operational channels outside the repository, with only redacted evidence committed back to the repo.

## Prohibited Transfers

- Copying production customer data, signatures, secrets, tokens, backup files, or database exports into repository files, PR comments, tickets, chat logs, or AI prompts.
- Sending restricted production data through ad hoc personal accounts or unapproved file-sharing channels.
- Using demo data paths, seed flows, or test fixtures to overwrite or replace production information.

## Transfer Controls

- Validate recipient, purpose, and minimum necessary data before transferring restricted or internal information.
- Prefer links, references, or redacted summaries over copying sensitive payloads.
- Keep customer-facing communication on approved product paths or approved transactional providers.
- Record incidents, restore tests, or supplier reviews in the appropriate repo-backed logs after the fact, but keep sensitive artifacts themselves outside the repository when needed.

## Related Evidence

- `docs/security/SUPPLIER_MANAGEMENT.md`
- `docs/security/INCIDENT_RESPONSE.md`
- `docs/security/BACKUP_AND_RESTORE.md`
- `docs/PRODUCTION_DATA_SAFETY.md`
