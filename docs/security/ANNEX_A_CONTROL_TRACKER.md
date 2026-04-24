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
| 5.3 | Segregation of duties | Review required | Open gap | TBD | Record decision and evidence before readiness claim |
| 5.4 | Management responsibilities | Included | Baseline evidence linked | Management | `docs/security/MANAGEMENT_REVIEW_LOG.md`, `docs/security/MANAGEMENT_REVIEW_AGENDA.md` |
| 5.5 | Contact with authorities | Review required | Open gap | TBD | Record operational owner and evidence source |
| 5.6 | Contact with special interest groups | Review required | Open gap | TBD | Record operational owner and evidence source |
| 5.7 | Threat intelligence | Review required | Open gap | TBD | Record review method or justified exclusion |
| 5.8 | Information security in project management | Included | Baseline evidence linked | Engineering lead | `docs/security/CHANGE_MANAGEMENT.md`, `docs/REFACTORING_PLAYBOOK.md` |
| 5.9 | Inventory of information and other associated assets | Review required | Open gap | TBD | Record inventory source and owner |
| 5.10 | Acceptable use of information and other associated assets | Review required | Open gap | TBD | Record policy location or justified exclusion |
| 5.11 | Return of assets | Review required | Open gap | TBD | Record offboarding evidence source |
| 5.12 | Classification of information | Review required | Open gap | TBD | Record classification method or justified exclusion |
| 5.13 | Labelling of information | Review required | Open gap | TBD | Record labelling method or justified exclusion |
| 5.14 | Information transfer | Review required | Open gap | TBD | Record transfer controls and evidence |
| 5.15 | Access control | Included | Baseline evidence linked | ISMS Manager | `docs/security/ACCESS_CONTROL.md`, `docs/security/ACCESS_REVIEW_LOG.md` |
| 5.16 | Identity management | Included | Baseline evidence linked | Engineering lead | `docs/security/ACCESS_CONTROL.md`, `docs/security/AUDIT_EVIDENCE_INDEX.md` |
| 5.17 | Authentication information | Included | Baseline evidence linked | Engineering lead | `docs/security/ACCESS_CONTROL.md`, `docs/security/AUDIT_EVIDENCE_INDEX.md` |
| 5.18 | Access rights | Included | Baseline evidence linked | ISMS Manager | `docs/security/ACCESS_CONTROL.md`, `docs/security/ACCESS_REVIEW_CHECKLIST.md` |
| 5.19 | Information security in supplier relationships | Included | Baseline evidence linked | ISMS Manager | `docs/security/SUPPLIER_MANAGEMENT.md` |
| 5.20 | Addressing information security within supplier agreements | Review required | Open gap | TBD | Record how supplier terms are reviewed |
| 5.21 | Managing information security in the ICT supply chain | Review required | Open gap | TBD | Record supply-chain review method |
| 5.22 | Monitoring, review and change management of supplier services | Review required | Open gap | TBD | Record supplier-review cadence and evidence |
| 5.23 | Information security for use of cloud services | Included | Baseline evidence linked | Engineering lead | `docs/security/SUPPLIER_MANAGEMENT.md`, `.github/workflows/deploy.yml` |
| 5.24 | Information security incident management planning and preparation | Included | Baseline evidence linked | ISMS Manager | `docs/security/INCIDENT_RESPONSE.md` |
| 5.25 | Assessment and decision on information security events | Included | Baseline evidence linked | ISMS Manager | `docs/security/INCIDENT_RESPONSE.md`, `docs/security/INCIDENT_RESPONSE_DRILL_PLAYBOOK.md` |
| 5.26 | Response to information security incidents | Included | Baseline evidence linked | ISMS Manager | `docs/security/INCIDENT_RESPONSE.md`, `docs/security/INCIDENT_POSTMORTEM_LOG.md` |
| 5.27 | Learning from information security incidents | Included | Baseline evidence linked | ISMS Manager | `docs/security/INCIDENT_POSTMORTEM_LOG.md`, `docs/security/INCIDENT_RESPONSE_DRILL_PLAYBOOK.md` |
| 5.28 | Collection of evidence | Included | Baseline evidence linked | ISMS Manager | `docs/security/INCIDENT_RESPONSE.md`, `docs/security/AUDIT_EVIDENCE_INDEX.md` |
| 5.29 | Information security during disruption | Review required | Open gap | TBD | Record continuity evidence or justified exclusion |
| 5.30 | ICT readiness for business continuity | Review required | Open gap | TBD | Record continuity testing evidence or justified exclusion |
| 5.31 | Legal, statutory, regulatory and contractual requirements | Review required | Open gap | TBD | Record legal register or justified exclusion |
| 5.32 | Intellectual property rights | Review required | Open gap | TBD | Record policy or contractual evidence |
| 5.33 | Protection of records | Review required | Open gap | TBD | Record retention and protection controls |
| 5.34 | Privacy and protection of PII | Review required | Open gap | TBD | Record privacy control set and evidence |
| 5.35 | Independent review of information security | Included | Baseline evidence linked | ISMS Manager | `docs/security/INTERNAL_AUDIT_LOG.md`, `docs/security/INTERNAL_AUDIT_PLAYBOOK.md` |
| 5.36 | Compliance with policies, rules and standards for information security | Included | Baseline evidence linked | ISMS Manager | `docs/security/INTERNAL_AUDIT_LOG.md`, `docs/security/STATEMENT_OF_APPLICABILITY.md` |
| 5.37 | Documented operating procedures | Included | Baseline evidence linked | Engineering lead | `docs/security/CHANGE_MANAGEMENT.md`, `docs/security/RESTORE_TEST_PLAYBOOK.md`, `docs/security/ACCESS_REVIEW_CHECKLIST.md` |

## A.6 People Controls

| Control | Title | Applicability | Implementation status | Owner | Evidence or notes |
| --- | --- | --- | --- | --- | --- |
| 6.1 | Screening | Review required | Open gap | TBD | Record hiring control or justified exclusion |
| 6.2 | Terms and conditions of employment | Review required | Open gap | TBD | Record HR/legal evidence source |
| 6.3 | Information security awareness, education and training | Review required | Open gap | TBD | Record training evidence source |
| 6.4 | Disciplinary process | Review required | Open gap | TBD | Record HR/legal evidence source |
| 6.5 | Responsibilities after termination or change of employment | Included | Baseline evidence linked | ISMS Manager | `docs/security/ACCESS_CONTROL.md`, `docs/security/ACCESS_REVIEW_CHECKLIST.md` |
| 6.6 | Confidentiality or non-disclosure agreements | Review required | Open gap | TBD | Record HR/legal evidence source |
| 6.7 | Remote working | Review required | Open gap | TBD | Record remote-working control set |
| 6.8 | Information security event reporting | Included | Baseline evidence linked | ISMS Manager | `docs/security/INCIDENT_RESPONSE.md`, `docs/security/INCIDENT_RESPONSE_DRILL_PLAYBOOK.md` |

## A.7 Physical Controls

| Control | Title | Applicability | Implementation status | Owner | Evidence or notes |
| --- | --- | --- | --- | --- | --- |
| 7.1 | Physical security perimeters | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |
| 7.2 | Physical entry | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |
| 7.3 | Securing offices, rooms and facilities | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |
| 7.4 | Physical security monitoring | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |
| 7.5 | Protecting against physical and environmental threats | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |
| 7.6 | Working in secure areas | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |
| 7.7 | Clear desk and clear screen | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |
| 7.8 | Equipment siting and protection | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |
| 7.9 | Security of assets off-premises | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |
| 7.10 | Storage media | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |
| 7.11 | Supporting utilities | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |
| 7.12 | Cabling security | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |
| 7.13 | Equipment maintenance | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |
| 7.14 | Secure disposal or re-use of equipment | Review required | Open gap | TBD | Likely outside repo-backed evidence; record source or justified exclusion |

## A.8 Technological Controls

| Control | Title | Applicability | Implementation status | Owner | Evidence or notes |
| --- | --- | --- | --- | --- | --- |
| 8.1 | User endpoint devices | Review required | Open gap | TBD | Record endpoint-management evidence source |
| 8.2 | Privileged access rights | Included | Baseline evidence linked | ISMS Manager | `docs/security/ACCESS_CONTROL.md`, `docs/security/ACCESS_REVIEW_LOG.md` |
| 8.3 | Information access restriction | Included | Baseline evidence linked | Engineering lead | `docs/security/ACCESS_CONTROL.md`, `docs/security/AUDIT_EVIDENCE_INDEX.md` |
| 8.4 | Access to source code | Included | Baseline evidence linked | Engineering lead | `docs/security/ACCESS_CONTROL.md`, `.github/workflows/quality-gates.yml` |
| 8.5 | Secure authentication | Review required | Open gap | TBD | Record auth control decision and evidence |
| 8.6 | Capacity management | Review required | Open gap | TBD | Record monitoring/capacity evidence source |
| 8.7 | Protection against malware | Review required | Open gap | TBD | Record endpoint/server anti-malware approach |
| 8.8 | Management of technical vulnerabilities | Included | Baseline evidence linked | Engineering lead | `docs/security/VULNERABILITY_MANAGEMENT.md`, `docs/security/VULNERABILITY_REVIEW_LOG.md` |
| 8.9 | Configuration management | Review required | Open gap | TBD | Record configuration-management evidence |
| 8.10 | Information deletion | Review required | Open gap | TBD | Record deletion control set and evidence |
| 8.11 | Data masking | Review required | Open gap | TBD | Record masking approach or justified exclusion |
| 8.12 | Data leakage prevention | Review required | Open gap | TBD | Record DLP approach or justified exclusion |
| 8.13 | Information backup | Included | Baseline evidence linked | Engineering lead | `docs/security/BACKUP_AND_RESTORE.md`, `docs/security/RESTORE_TEST_LOG.md` |
| 8.14 | Redundancy of information processing facilities | Review required | Open gap | TBD | Record hosting resilience evidence or justified exclusion |
| 8.15 | Logging | Included | Baseline evidence linked | Engineering lead | `docs/security/AUDIT_EVIDENCE_INDEX.md`, `.github/workflows/deploy.yml` |
| 8.16 | Monitoring activities | Review required | Open gap | TBD | Record monitoring evidence or justified exclusion |
| 8.17 | Clock synchronization | Review required | Open gap | TBD | Record platform evidence or justified exclusion |
| 8.18 | Use of privileged utility programs | Review required | Open gap | TBD | Record administrative utility controls |
| 8.19 | Installation of software on operational systems | Review required | Open gap | TBD | Record change/release control evidence |
| 8.20 | Networks security | Review required | Open gap | TBD | Record hosting/network control evidence |
| 8.21 | Security of network services | Review required | Open gap | TBD | Record hosting/network control evidence |
| 8.22 | Segregation of networks | Review required | Open gap | TBD | Record hosting/network control evidence |
| 8.23 | Web filtering | Review required | Open gap | TBD | Record justified exclusion or implemented control |
| 8.24 | Use of cryptography | Review required | Open gap | TBD | Record crypto control evidence |
| 8.25 | Secure development life cycle | Included | Baseline evidence linked | Engineering lead | `docs/security/SECURE_DEVELOPMENT.md`, `.github/workflows/quality-gates.yml` |
| 8.26 | Application security requirements | Review required | Open gap | TBD | Record requirement-setting evidence |
| 8.27 | Secure system architecture and engineering principles | Included | Baseline evidence linked | Engineering lead | `docs/AI_ENGINEERING.md`, `docs/ARCHITECTURE.md`, `docs/PLATFORM_ARCHITECTURE.md` |
| 8.28 | Secure coding | Included | Baseline evidence linked | Engineering lead | `docs/security/SECURE_DEVELOPMENT.md`, `docs/AI_ENGINEERING.md` |
| 8.29 | Security testing in development and acceptance | Included | Baseline evidence linked | Engineering lead | `.github/workflows/quality-gates.yml`, `package.json` |
| 8.30 | Outsourced development | Review required | Open gap | TBD | Record supplier/AI-assisted development control decision |
| 8.31 | Separation of development, test and production environments | Review required | Open gap | TBD | Record environment separation evidence |
| 8.32 | Change management | Included | Baseline evidence linked | Engineering lead | `docs/security/CHANGE_MANAGEMENT.md`, `.github/workflows/deploy.yml` |
| 8.33 | Test information | Review required | Open gap | TBD | Record test-data handling evidence |
| 8.34 | Protection of information systems during audit testing | Review required | Open gap | TBD | Record audit-testing protection evidence |

