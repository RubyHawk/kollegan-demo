# Annex A Control Tracker

Owner: ISMS Manager  
Review cadence: Quarterly and after major risk-treatment changes  
Status: Structured baseline

This tracker lists all 93 ISO/IEC 27001:2022 Annex A controls so the Statement of Applicability has a repo-backed place for detailed inclusion, exclusion, ownership, and evidence decisions.

## Usage Rules

- Set `Applicability` to `Included`, `Excluded`, or `Review required`.
- Set `Implementation status` to `Baseline evidence linked`, `Open gap`, or `Excluded`.
- Keep evidence links short and repo-backed where possible.
- Do not claim certification readiness until every control has an applicability decision and supporting rationale.

## A.5 Organizational Controls

| Control | Title | Applicability | Implementation status | Owner | Evidence or notes |
| --- | --- | --- | --- | --- | --- |
| 5.1 | Policies for information security | Included | Baseline evidence linked | ISMS Manager | `docs/security/ISMS_SCOPE.md`, `docs/security/SECURE_DEVELOPMENT.md` |
| 5.2 | Information security roles and responsibilities | Included | Baseline evidence linked | ISMS Manager | `docs/security/ACCESS_CONTROL.md`, `docs/security/CHANGE_MANAGEMENT.md` |
| 5.3 | Segregation of duties | Included | Baseline evidence linked | ISMS Manager | `docs/security/SEGREGATION_OF_DUTIES.md`, `.github/workflows/quality-gates.yml`, `.github/workflows/deploy.yml` |
| 5.4 | Management responsibilities | Included | Baseline evidence linked | Management | `docs/security/MANAGEMENT_REVIEW_LOG.md`, `docs/security/MANAGEMENT_REVIEW_AGENDA.md` |
| 5.5 | Contact with authorities | Included | Baseline evidence linked | ISMS Manager | `docs/security/GOVERNANCE_CONTACTS_AND_THREAT_INTELLIGENCE.md`, `docs/security/INCIDENT_RESPONSE.md` |
| 5.6 | Contact with special interest groups | Included | Baseline evidence linked | ISMS Manager | `docs/security/GOVERNANCE_CONTACTS_AND_THREAT_INTELLIGENCE.md`, `docs/security/SUPPLIER_MANAGEMENT.md` |
| 5.7 | Threat intelligence | Included | Baseline evidence linked | ISMS Manager | `docs/security/GOVERNANCE_CONTACTS_AND_THREAT_INTELLIGENCE.md`, `docs/security/VULNERABILITY_REVIEW_LOG.md` |
| 5.8 | Information security in project management | Included | Baseline evidence linked | Engineering lead | `docs/security/CHANGE_MANAGEMENT.md`, `docs/REFACTORING_PLAYBOOK.md` |
| 5.9 | Inventory of information and other associated assets | Included | Baseline evidence linked | ISMS Manager | `docs/security/ASSET_INVENTORY.md`, `docs/security/ISMS_SCOPE.md` |
| 5.10 | Acceptable use of information and other associated assets | Included | Baseline evidence linked | ISMS Manager | `docs/security/INFORMATION_HANDLING_STANDARD.md`, `docs/AI_ENGINEERING.md` |
| 5.11 | Return of assets | Included | Baseline evidence linked | ISMS Manager | `docs/security/PEOPLE_AND_EMPLOYMENT_SECURITY_STANDARD.md`, `docs/security/ACCESS_REVIEW_CHECKLIST.md` |
| 5.12 | Classification of information | Included | Baseline evidence linked | ISMS Manager | `docs/security/INFORMATION_HANDLING_STANDARD.md`, `docs/security/ASSET_INVENTORY.md` |
| 5.13 | Labelling of information | Included | Baseline evidence linked | ISMS Manager | `docs/security/INFORMATION_HANDLING_STANDARD.md` |
| 5.14 | Information transfer | Included | Baseline evidence linked | ISMS Manager | `docs/security/INFORMATION_TRANSFER_STANDARD.md`, `docs/PRODUCTION_DATA_SAFETY.md` |
| 5.15 | Access control | Included | Baseline evidence linked | ISMS Manager | `docs/security/ACCESS_CONTROL.md`, `docs/security/ACCESS_REVIEW_LOG.md` |
| 5.16 | Identity management | Included | Baseline evidence linked | Engineering lead | `docs/security/ACCESS_CONTROL.md`, `docs/security/AUDIT_EVIDENCE_INDEX.md` |
| 5.17 | Authentication information | Included | Baseline evidence linked | Engineering lead | `docs/security/ACCESS_CONTROL.md`, `docs/security/AUDIT_EVIDENCE_INDEX.md` |
| 5.18 | Access rights | Included | Baseline evidence linked | ISMS Manager | `docs/security/ACCESS_CONTROL.md`, `docs/security/ACCESS_REVIEW_CHECKLIST.md` |
| 5.19 | Information security in supplier relationships | Included | Baseline evidence linked | ISMS Manager | `docs/security/SUPPLIER_MANAGEMENT.md`, `docs/security/SUPPLIER_REVIEW_LOG.md` |
| 5.20 | Addressing information security within supplier agreements | Included | Baseline evidence linked | ISMS Manager | `docs/security/SUPPLIER_ASSURANCE_STANDARD.md`, `docs/security/SUPPLIER_REVIEW_PLAYBOOK.md` |
| 5.21 | Managing information security in the ICT supply chain | Included | Baseline evidence linked | ISMS Manager | `docs/security/SUPPLIER_ASSURANCE_STANDARD.md`, `docs/security/SUPPLIER_MANAGEMENT.md` |
| 5.22 | Monitoring, review and change management of supplier services | Included | Baseline evidence linked | ISMS Manager | `docs/security/SUPPLIER_REVIEW_LOG.md`, `docs/security/SUPPLIER_REVIEW_PLAYBOOK.md` |
| 5.23 | Information security for use of cloud services | Included | Baseline evidence linked | Engineering lead | `docs/security/SUPPLIER_MANAGEMENT.md`, `docs/security/SUPPLIER_REVIEW_LOG.md`, `.github/workflows/deploy.yml` |
| 5.24 | Information security incident management planning and preparation | Included | Baseline evidence linked | ISMS Manager | `docs/security/INCIDENT_RESPONSE.md` |
| 5.25 | Assessment and decision on information security events | Included | Baseline evidence linked | ISMS Manager | `docs/security/INCIDENT_RESPONSE.md`, `docs/security/INCIDENT_RESPONSE_DRILL_PLAYBOOK.md` |
| 5.26 | Response to information security incidents | Included | Baseline evidence linked | ISMS Manager | `docs/security/INCIDENT_RESPONSE.md`, `docs/security/INCIDENT_POSTMORTEM_LOG.md` |
| 5.27 | Learning from information security incidents | Included | Baseline evidence linked | ISMS Manager | `docs/security/INCIDENT_POSTMORTEM_LOG.md`, `docs/security/INCIDENT_RESPONSE_DRILL_PLAYBOOK.md` |
| 5.28 | Collection of evidence | Included | Baseline evidence linked | ISMS Manager | `docs/security/INCIDENT_RESPONSE.md`, `docs/security/AUDIT_EVIDENCE_INDEX.md` |
| 5.29 | Information security during disruption | Included | Baseline evidence linked | ISMS Manager | `docs/security/BUSINESS_CONTINUITY_STANDARD.md`, `docs/security/INCIDENT_RESPONSE.md` |
| 5.30 | ICT readiness for business continuity | Included | Baseline evidence linked | Engineering lead | `docs/security/BUSINESS_CONTINUITY_STANDARD.md`, `docs/security/RESTORE_TEST_PLAYBOOK.md`, `.github/workflows/deploy.yml` |
| 5.31 | Legal, statutory, regulatory and contractual requirements | Included | Baseline evidence linked | ISMS Manager | `docs/security/LEGAL_RECORDS_AND_PRIVACY_STANDARD.md`, `docs/security/SUPPLIER_MANAGEMENT.md` |
| 5.32 | Intellectual property rights | Included | Baseline evidence linked | ISMS Manager | `docs/security/LEGAL_RECORDS_AND_PRIVACY_STANDARD.md`, `docs/security/SUPPLIER_ASSURANCE_STANDARD.md` |
| 5.33 | Protection of records | Included | Baseline evidence linked | ISMS Manager | `docs/security/LEGAL_RECORDS_AND_PRIVACY_STANDARD.md`, `docs/security/AUDIT_EVIDENCE_INDEX.md` |
| 5.34 | Privacy and protection of PII | Included | Baseline evidence linked | ISMS Manager | `docs/security/LEGAL_RECORDS_AND_PRIVACY_STANDARD.md`, `docs/PRODUCTION_DATA_SAFETY.md`, `docs/security/INFORMATION_HANDLING_STANDARD.md` |
| 5.35 | Independent review of information security | Included | Baseline evidence linked | ISMS Manager | `docs/security/INTERNAL_AUDIT_LOG.md`, `docs/security/INTERNAL_AUDIT_PLAYBOOK.md` |
| 5.36 | Compliance with policies, rules and standards for information security | Included | Baseline evidence linked | ISMS Manager | `docs/security/INTERNAL_AUDIT_LOG.md`, `docs/security/STATEMENT_OF_APPLICABILITY.md` |
| 5.37 | Documented operating procedures | Included | Baseline evidence linked | Engineering lead | `docs/security/CHANGE_MANAGEMENT.md`, `docs/security/RESTORE_TEST_PLAYBOOK.md`, `docs/security/ACCESS_REVIEW_CHECKLIST.md` |

## A.6 People Controls

| Control | Title | Applicability | Implementation status | Owner | Evidence or notes |
| --- | --- | --- | --- | --- | --- |
| 6.1 | Screening | Included | Baseline evidence linked | ISMS Manager | `docs/security/PEOPLE_AND_EMPLOYMENT_SECURITY_STANDARD.md` |
| 6.2 | Terms and conditions of employment | Included | Baseline evidence linked | ISMS Manager | `docs/security/PEOPLE_AND_EMPLOYMENT_SECURITY_STANDARD.md` |
| 6.3 | Information security awareness, education and training | Included | Baseline evidence linked | ISMS Manager | `docs/security/SECURITY_AWARENESS_LOG.md`, `docs/security/SECURITY_AWARENESS_PLAYBOOK.md`, `docs/security/AI_USAGE_POLICY.md` |
| 6.4 | Disciplinary process | Included | Baseline evidence linked | ISMS Manager | `docs/security/PEOPLE_AND_EMPLOYMENT_SECURITY_STANDARD.md` |
| 6.5 | Responsibilities after termination or change of employment | Included | Baseline evidence linked | ISMS Manager | `docs/security/ACCESS_CONTROL.md`, `docs/security/ACCESS_REVIEW_CHECKLIST.md` |
| 6.6 | Confidentiality or non-disclosure agreements | Included | Baseline evidence linked | ISMS Manager | `docs/security/PEOPLE_AND_EMPLOYMENT_SECURITY_STANDARD.md` |
| 6.7 | Remote working | Included | Baseline evidence linked | ISMS Manager | `docs/security/REMOTE_WORKING_STANDARD.md`, `docs/security/ACCESS_CONTROL.md`, `docs/vps-security-guide.html` |
| 6.8 | Information security event reporting | Included | Baseline evidence linked | ISMS Manager | `docs/security/INCIDENT_RESPONSE.md`, `docs/security/INCIDENT_RESPONSE_DRILL_PLAYBOOK.md` |

## A.7 Physical Controls

| Control | Title | Applicability | Implementation status | Owner | Evidence or notes |
| --- | --- | --- | --- | --- | --- |
| 7.1 | Physical security perimeters | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/SUPPLIER_MANAGEMENT.md` |
| 7.2 | Physical entry | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/REMOTE_WORKING_STANDARD.md` |
| 7.3 | Securing offices, rooms and facilities | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/REMOTE_WORKING_STANDARD.md` |
| 7.4 | Physical security monitoring | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/SUPPLIER_MANAGEMENT.md` |
| 7.5 | Protecting against physical and environmental threats | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/SUPPLIER_ASSURANCE_STANDARD.md` |
| 7.6 | Working in secure areas | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/REMOTE_WORKING_STANDARD.md` |
| 7.7 | Clear desk and clear screen | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/REMOTE_WORKING_STANDARD.md` |
| 7.8 | Equipment siting and protection | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/REMOTE_WORKING_STANDARD.md` |
| 7.9 | Security of assets off-premises | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/REMOTE_WORKING_STANDARD.md` |
| 7.10 | Storage media | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/LEGAL_RECORDS_AND_PRIVACY_STANDARD.md` |
| 7.11 | Supporting utilities | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/BUSINESS_CONTINUITY_STANDARD.md` |
| 7.12 | Cabling security | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/SUPPLIER_MANAGEMENT.md` |
| 7.13 | Equipment maintenance | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/SUPPLIER_ASSURANCE_STANDARD.md` |
| 7.14 | Secure disposal or re-use of equipment | Included | Baseline evidence linked | ISMS Manager | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/LEGAL_RECORDS_AND_PRIVACY_STANDARD.md` |

## A.8 Technological Controls

| Control | Title | Applicability | Implementation status | Owner | Evidence or notes |
| --- | --- | --- | --- | --- | --- |
| 8.1 | User endpoint devices | Included | Baseline evidence linked | Engineering lead | `docs/security/ENDPOINT_AND_OPERATIONS_SECURITY_STANDARD.md`, `docs/security/REMOTE_WORKING_STANDARD.md` |
| 8.2 | Privileged access rights | Included | Baseline evidence linked | ISMS Manager | `docs/security/ACCESS_CONTROL.md`, `docs/security/ACCESS_REVIEW_LOG.md` |
| 8.3 | Information access restriction | Included | Baseline evidence linked | Engineering lead | `docs/security/ACCESS_CONTROL.md`, `docs/security/AUDIT_EVIDENCE_INDEX.md` |
| 8.4 | Access to source code | Included | Baseline evidence linked | Engineering lead | `docs/security/ACCESS_CONTROL.md`, `.github/workflows/quality-gates.yml` |
| 8.5 | Secure authentication | Included | Baseline evidence linked | Engineering lead | `docs/security/AUTHENTICATION_AND_CRYPTOGRAPHY_STANDARD.md`, `docs/security/ACCESS_CONTROL.md` |
| 8.6 | Capacity management | Included | Baseline evidence linked | Engineering lead | `docs/security/ENDPOINT_AND_OPERATIONS_SECURITY_STANDARD.md`, `docs/security/BUSINESS_CONTINUITY_STANDARD.md` |
| 8.7 | Protection against malware | Included | Baseline evidence linked | Engineering lead | `docs/security/ENDPOINT_AND_OPERATIONS_SECURITY_STANDARD.md`, `docs/security/REMOTE_WORKING_STANDARD.md` |
| 8.8 | Management of technical vulnerabilities | Included | Baseline evidence linked | Engineering lead | `docs/security/VULNERABILITY_MANAGEMENT.md`, `docs/security/VULNERABILITY_REVIEW_LOG.md` |
| 8.9 | Configuration management | Included | Baseline evidence linked | Engineering lead | `docs/security/CONFIGURATION_AND_APPLICATION_SECURITY_STANDARD.md`, `.github/workflows/quality-gates.yml`, `.github/workflows/deploy.yml` |
| 8.10 | Information deletion | Included | Baseline evidence linked | Engineering lead | `docs/security/DATA_PROTECTION_LIFECYCLE_STANDARD.md`, `docs/PRODUCTION_DATA_SAFETY.md` |
| 8.11 | Data masking | Included | Baseline evidence linked | Engineering lead | `docs/security/DATA_PROTECTION_LIFECYCLE_STANDARD.md`, `docs/security/TEST_INFORMATION_STANDARD.md` |
| 8.12 | Data leakage prevention | Included | Baseline evidence linked | Engineering lead | `docs/security/DATA_PROTECTION_LIFECYCLE_STANDARD.md`, `docs/security/INFORMATION_TRANSFER_STANDARD.md`, `docs/security/AI_USAGE_POLICY.md` |
| 8.13 | Information backup | Included | Baseline evidence linked | Engineering lead | `docs/security/BACKUP_AND_RESTORE.md`, `docs/security/RESTORE_TEST_LOG.md` |
| 8.14 | Redundancy of information processing facilities | Review required | Open gap | TBD | Record hosting resilience evidence or justified exclusion |
| 8.15 | Logging | Included | Baseline evidence linked | Engineering lead | `docs/security/AUDIT_EVIDENCE_INDEX.md`, `.github/workflows/deploy.yml` |
| 8.16 | Monitoring activities | Included | Baseline evidence linked | Engineering lead | `docs/security/ENDPOINT_AND_OPERATIONS_SECURITY_STANDARD.md`, `.github/workflows/deploy.yml`, `docs/security/INCIDENT_RESPONSE.md` |
| 8.17 | Clock synchronization | Included | Baseline evidence linked | Engineering lead | `docs/security/ENDPOINT_AND_OPERATIONS_SECURITY_STANDARD.md`, `docs/vps-security-guide.html` |
| 8.18 | Use of privileged utility programs | Included | Baseline evidence linked | Engineering lead | `docs/security/ENDPOINT_AND_OPERATIONS_SECURITY_STANDARD.md`, `docs/security/ACCESS_CONTROL.md` |
| 8.19 | Installation of software on operational systems | Included | Baseline evidence linked | Engineering lead | `docs/security/CONFIGURATION_AND_APPLICATION_SECURITY_STANDARD.md`, `docs/security/CHANGE_MANAGEMENT.md`, `scripts/deploy-release.sh` |
| 8.20 | Networks security | Included | Baseline evidence linked | Engineering lead | `docs/security/NETWORK_AND_SERVICE_SECURITY_STANDARD.md`, `docs/vps-security-guide.html` |
| 8.21 | Security of network services | Included | Baseline evidence linked | Engineering lead | `docs/security/NETWORK_AND_SERVICE_SECURITY_STANDARD.md`, `.github/workflows/deploy.yml` |
| 8.22 | Segregation of networks | Included | Baseline evidence linked | Engineering lead | `docs/security/NETWORK_AND_SERVICE_SECURITY_STANDARD.md`, `docs/security/REMOTE_WORKING_STANDARD.md` |
| 8.23 | Web filtering | Review required | Open gap | TBD | Record justified exclusion or implemented control |
| 8.24 | Use of cryptography | Included | Baseline evidence linked | Engineering lead | `docs/security/AUTHENTICATION_AND_CRYPTOGRAPHY_STANDARD.md`, `.github/workflows/deploy.yml` |
| 8.25 | Secure development life cycle | Included | Baseline evidence linked | Engineering lead | `docs/security/SECURE_DEVELOPMENT.md`, `.github/workflows/quality-gates.yml` |
| 8.26 | Application security requirements | Included | Baseline evidence linked | Engineering lead | `docs/security/CONFIGURATION_AND_APPLICATION_SECURITY_STANDARD.md`, `docs/AI_ENGINEERING.md`, `docs/PRODUCTION_DATA_SAFETY.md` |
| 8.27 | Secure system architecture and engineering principles | Included | Baseline evidence linked | Engineering lead | `docs/AI_ENGINEERING.md`, `docs/ARCHITECTURE.md`, `docs/PLATFORM_ARCHITECTURE.md` |
| 8.28 | Secure coding | Included | Baseline evidence linked | Engineering lead | `docs/security/SECURE_DEVELOPMENT.md`, `docs/AI_ENGINEERING.md` |
| 8.29 | Security testing in development and acceptance | Included | Baseline evidence linked | Engineering lead | `.github/workflows/quality-gates.yml`, `package.json` |
| 8.30 | Outsourced development | Included | Baseline evidence linked | Engineering lead | `docs/security/SUPPLIER_ASSURANCE_STANDARD.md`, `docs/security/AI_USAGE_POLICY.md`, `docs/security/SECURE_DEVELOPMENT.md` |
| 8.31 | Separation of development, test and production environments | Included | Baseline evidence linked | Engineering lead | `docs/security/ENVIRONMENT_SEPARATION_STANDARD.md`, `.github/workflows/deploy.yml`, `.github/workflows/quality-gates.yml` |
| 8.32 | Change management | Included | Baseline evidence linked | Engineering lead | `docs/security/CHANGE_MANAGEMENT.md`, `.github/workflows/deploy.yml` |
| 8.33 | Test information | Included | Baseline evidence linked | Engineering lead | `docs/security/TEST_INFORMATION_STANDARD.md`, `docs/security/RESTORE_TEST_PLAYBOOK.md`, `docs/PRODUCTION_DATA_SAFETY.md` |
| 8.34 | Protection of information systems during audit testing | Included | Baseline evidence linked | Engineering lead | `docs/security/CONFIGURATION_AND_APPLICATION_SECURITY_STANDARD.md`, `docs/security/RESTORE_TEST_PLAYBOOK.md`, `docs/security/INFORMATION_HANDLING_STANDARD.md` |

