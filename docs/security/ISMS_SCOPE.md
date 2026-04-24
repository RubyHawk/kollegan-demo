# ISMS Scope

Owner: ISMS Manager  
Review cadence: Quarterly and after major architecture changes  
Status: Structured baseline

## In Scope

- Kollegan ERP web application.
- Production database and schema migrations.
- Public offer links, signatures, customer records, products, companies, projects, and purchase orders.
- Source repository, pull requests, CI/CD, deployment scripts, and release process.
- Admin/support workflows that can access customer or business data.
- AI-assisted development workflows, agent instructions, and project skills.
- Hosting, database, email, repository, monitoring, domain, and AI service providers used by the ERP.

## Out Of Scope

- Demo-only environments that do not process real customer data.
- Local developer machines beyond secure-development, remote-working, asset-handling, and access-control baselines.
- Native mobile app until it exists or begins processing in-scope ERP data.

## Scope Decisions

- Demo-only environments remain out of scope only while they stay isolated from ERP production data and customer-facing production workflows.
- Local developer machines are not treated as production systems of record, but the people, endpoint, remote-working, secure-development, and access-control baselines still apply to their use.
- A future native mobile app automatically becomes in scope when it exists as a maintained product component or begins using production ERP APIs, data, or credentials.

## Scope Review Triggers

- A demo begins processing real customer data or production-identifiable business data.
- A native mobile app is created or connected to production ERP workflows.
- Local endpoint or device-management expectations materially change.
- A major supplier, hosting boundary, or production environment changes.

## Evidence Expectations

- Approved scope statement.
- Supplier list.
- Data inventory.
- Access review records.
- Change-management evidence.
- Risk register and Statement of Applicability links.
