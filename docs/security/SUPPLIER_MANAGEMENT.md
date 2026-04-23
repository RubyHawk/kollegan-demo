# Supplier Management

Owner: ISMS Manager  
Review cadence: Quarterly  
Status: Baseline identified

## Supplier Register

| Supplier | Service | Data/process | Owner | Review status |
|---|---|---|---|---|
| GitHub | Repository and CI | Source code, pull requests, CI metadata | Engineering lead | Identified in the engineering baseline; formal quarterly supplier review evidence still pending |
| VPS / self-managed hosting | Production runtime | App runtime, logs, deployment | Engineering lead | Identified from `.github/workflows/deploy.yml` and `docs/vps-security-guide.html`; formal quarterly supplier review evidence still pending |
| PostgreSQL / server-managed database | Database | Customer and business data | Engineering lead | Identified from `docker-compose.yml` and `docs/vps-security-guide.html`; formal quarterly supplier review evidence still pending |
| Resend | Transactional email | Offer/customer email metadata | Engineering lead | Identified from `.env.example` and `src/modules/supporting/offers/application/offer-email-transport.ts`; formal quarterly supplier review evidence still pending |
| OpenAI/Codex | AI-assisted development | Prompts and code context | Engineering lead | Identified from `docs/AI_ENGINEERING.md`; formal quarterly supplier review evidence still pending |
| Anthropic/Claude | AI-assisted development | Prompts and code context | Engineering lead | Identified from `docs/AI_ENGINEERING.md`; formal quarterly supplier review evidence still pending |

## Requirements

- Identify data processed by each supplier.
- Review security posture based on risk.
- Track contractual or compliance requirements.
- Record review evidence.
- Next quarterly supplier review should capture explicit evidence for the identified providers above.

