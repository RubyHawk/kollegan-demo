# Governance Contacts And Threat Intelligence

Owner: ISMS Manager  
Review cadence: Quarterly and after material supplier or incident changes  
Status: Baseline identified

This baseline covers authority contacts, security-interest-group contacts, and the minimum threat-intelligence inputs used for Kollegan ERP.

## Contact Baseline

- Maintain current contact paths for relevant authorities, legal/compliance support, hosting/provider escalation, and incident-response coordination outside the repository when sensitive details are involved.
- Keep ownership for those contact paths with the ISMS Manager or delegated management contact.
- Review contact ownership after major supplier, hosting, or incident-process changes.

## Security Community And Threat Inputs

- Use supplier advisories, GitHub dependency alerts, vulnerability review cycles, hosting/security provider notices, and incident/postmortem learning as the minimum ongoing threat-intelligence sources.
- Record material vulnerability or incident review outputs in the repo-backed logs and playbooks rather than storing raw sensitive feeds in the repository.
- Escalate notable changes to risk treatment through `RISK_REGISTER.md`, `VULNERABILITY_REVIEW_LOG.md`, or `INCIDENT_POSTMORTEM_LOG.md` as appropriate.

## Related Evidence

- `docs/security/VULNERABILITY_MANAGEMENT.md`
- `docs/security/VULNERABILITY_REVIEW_LOG.md`
- `docs/security/INCIDENT_RESPONSE.md`
- `docs/security/INCIDENT_POSTMORTEM_LOG.md`
- `docs/security/SUPPLIER_MANAGEMENT.md`
