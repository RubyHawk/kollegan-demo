# Kollegan Platform Architecture & DevSecOps Guide

> Reference document for infrastructure, security, and compliance decisions.
> Covers: Docker scaling strategy, WireGuard networking, ISO 27001:2022 roadmap, DevSecOps pipeline, and engineering role responsibilities.

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Overall Platform Architecture](#2-overall-platform-architecture)
3. [Network Security — WireGuard](#3-network-security--wireguard)
4. [DevSecOps Pipeline](#4-devsecops-pipeline)
5. [ISO 27001:2022 Roadmap](#5-iso-270012022-roadmap)
6. [Docker & Horizontal Scaling Strategy](#6-docker--horizontal-scaling-strategy)
7. [Engineering Roles You Are Covering](#7-engineering-roles-you-are-covering)
8. [Priority Execution Order](#8-priority-execution-order)

---

## 1. Current State

What is already built and production-grade:

| Area | Status | Notes |
|------|--------|-------|
| Docker Compose | ✅ Done | Next.js + PostgreSQL + Redis + Caddy |
| HTTPS / TLS | ✅ Done | Caddy with auto Let's Encrypt |
| Authentication | ✅ Done | JWT + httpOnly cookies, TOTP MFA, WebAuthn passkeys |
| Session security | ✅ Done | Redis token blacklist on logout, user blacklist |
| Rate limiting | ✅ Done | Redis sliding-window per route, standard headers |
| Security headers | ✅ Done | HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| Audit trail | ✅ Done | Append-only `aud_*` tables with actor tracking |
| Multi-tenancy | ✅ Done | `organizationId` on every table, enforced at query layer |
| Redis persistence | ✅ Done | AOF enabled |
| Health checks | ✅ Done | Docker health endpoints |
| Webhook auth | ✅ Done | HMAC validation on Vapi webhooks |
| CI/CD pipelines | ❌ Missing | GitHub Actions not yet configured |
| Secrets management | ❌ Missing | Still using `.env` files on disk |
| Uptime monitoring | ❌ Missing | No alerting for downtime |
| Encryption at rest | ❌ Missing | Volumes not encrypted |
| Automated backups | ❌ Missing | No DB backup strategy |
| WireGuard | ❌ Missing | SSH port still publicly exposed |
| SAST / container scan | ❌ Missing | No security gates in CI |

---

## 2. Overall Platform Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Firewall   │
                    │  Open ports: │
                    │  443  (HTTPS)│
                    │  80   (→443) │
                    │  51820 (WG)  │
                    └──┬───────┬───┘
                       │       │
             ┌─────────▼──┐  ┌─▼──────────────┐
             │    Caddy    │  │   WireGuard VPN │
             │  Rev Proxy  │  │  (admin only)   │
             │  Auto TLS   │  └─┬───────────────┘
             └─────┬───────┘    │
                   │            │ (private overlay)
        ┌──────────▼────────────▼──────────────────┐
        │         Docker Internal Network           │
        │                                           │
        │  ┌──────────────┐   ┌──────────────────┐  │
        │  │  Next.js App │   │  n8n Workflows   │  │
        │  │   :3000      │   │    :5678         │  │
        │  └──────┬───────┘   └──────────────────┘  │
        │         │                                  │
        │  ┌──────▼───────┐   ┌──────────────────┐  │
        │  │  PostgreSQL  │   │     Redis 7      │  │
        │  │    :5432     │   │     :6379        │  │
        │  └──────────────┘   └──────────────────┘  │
        └───────────────────────────────────────────┘

        External SaaS (outbound only, no inbound):
        ┌──────────────┬──────────────┬──────────────┐
        │  Vapi Voice  │    Resend    │Google Calendar│
        │     AI       │    Email     │     API       │
        └──────────────┴──────────────┴──────────────┘
```

### Access model

| Who | How they reach the VPS | What they can access |
|-----|------------------------|----------------------|
| End users (browser) | Public HTTPS via Caddy (port 443) | Next.js app only |
| You (admin) | WireGuard tunnel → SSH internally | Everything |
| CI/CD (GitHub Actions) | WireGuard tunnel → SSH internally → deploy | Docker daemon |
| PostgreSQL, Redis, n8n | Not reachable from public internet | Internal only |

---

## 3. Network Security — WireGuard

### Why WireGuard instead of exposed SSH or OpenVPN

| | Exposed SSH | OpenVPN | **WireGuard** |
|--|-------------|---------|---------------|
| Crypto | Older algorithms | TLS/OpenSSL | ChaCha20-Poly1305 (modern) |
| Attack surface | Port 22 brute-forced constantly | Complex config, many CVEs | ~4000 lines of code, minimal surface |
| Performance | N/A | User-space, slow | Kernel-level, ~3ms handshake |
| Config complexity | Simple but dangerous | Very complex | Simple key pairs |
| Public port | Exposed | Exposed | Only 51820/UDP |

### WireGuard topology

```
Your Laptop           VPS (Server)
┌──────────┐          ┌────────────────────────┐
│ wg0      │◄────────►│ wg0  10.0.0.1/24       │
│10.0.0.2  │  tunnel  │ (WireGuard interface)   │
└──────────┘  51820   │                         │
                      │  ┌─────────────────────┐│
GitHub Actions        │  │ SSH (only on wg0)   ││
┌──────────┐          │  │ PostgreSQL (no pub) ││
│ wg0      │◄────────►│  │ Redis (no pub)      ││
│10.0.0.3  │          │  │ n8n  (no pub)       ││
└──────────┘          │  └─────────────────────┘│
                      └────────────────────────┘
```

### Extra safety layers on top of WireGuard

1. **Pre-shared keys (PSK)** — symmetric key on top of WireGuard's asymmetric crypto (quantum-resistant layer)
2. **Firewall allowlist** — only WireGuard peer IPs can SSH, even inside the tunnel
3. **Fail2ban** — monitors WireGuard handshake failures and bans repeat offenders
4. **Key rotation policy** — rotate peer keys quarterly (document in your ISO 27001 policies)
5. **Peer allowedIPs** — each peer (you, CI/CD) can only reach specific internal IPs

### WireGuard setup checklist

- [ ] Install WireGuard on VPS (`apt install wireguard`)
- [ ] Generate server keypair (`wg genkey | tee server.key | wg pubkey > server.pub`)
- [ ] Generate peer keypair for your laptop
- [ ] Generate peer keypair for GitHub Actions (ephemeral, rotated per run)
- [ ] Generate pre-shared key (`wg genpsk`)
- [ ] Configure `/etc/wireguard/wg0.conf` on server
- [ ] Configure `wg0.conf` on your laptop
- [ ] Enable on boot (`systemctl enable wg-quick@wg0`)
- [ ] Update firewall: drop SSH from public, allow only from WireGuard subnet
- [ ] Test: confirm `wg show` shows peers, confirm SSH over tunnel works
- [ ] Add GitHub Actions WireGuard setup step to CI workflow

---

## 4. DevSecOps Pipeline

### Pipeline flow

```
┌──────────────┐
│  Local Dev   │
│  Your Laptop │
└──────┬───────┘
       │ git push
       ▼
┌──────────────┐
│    GitHub    │
│ Pull Request │
└──────┬───────┘
       │ triggers
       ▼
┌─────────────────────────────────────────────┐
│           GitHub Actions CI                  │
│                                             │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Dependency   │  │   Secret Scanning    │ │
│  │ npm audit    │  │   GitHub native /    │ │
│  │ --audit-level│  │   GitGuardian        │ │
│  │ =high        │  └──────────┬───────────┘ │
│  └──────┬───────┘             │             │
│         │           ┌─────────▼──────────┐  │
│  ┌──────▼───────┐   │       SAST         │  │
│  │    Tests     │   │  CodeQL / Semgrep  │  │
│  │    Vitest    │   └─────────┬──────────┘  │
│  └──────┬───────┘             │             │
│         └──────────┬──────────┘             │
│                    ▼                        │
│             ┌─────────────┐                 │
│             │Security Gate│                 │
│             │  All pass?  │                 │
│             └──┬──────┬───┘                 │
│                │      │                     │
│              FAIL    PASS                   │
└────────────────┼──────┼─────────────────────┘
                 ▼      ▼
          ┌─────────┐ ┌─────────────────────┐
          │  Block  │ │   Docker Build      │
          │  Merge  │ │   + Trivy scan      │
          │  Notify │ │   (container CVEs)  │
          └─────────┘ └──────────┬──────────┘
                                 │ pass
                                 ▼
                      ┌─────────────────────┐
                      │  Push to GHCR       │
                      │  (GitHub Container  │
                      │   Registry)         │
                      └──────────┬──────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │  Deploy via         │
                      │  WireGuard → SSH    │
                      │  docker compose     │
                      │  pull && up -d      │
                      └──────────┬──────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │  Smoke Test         │
                      │  /api/health poll   │
                      └──────────┬──────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Observability       │
                    │                         │
                    │  Axiom (structured logs) │
                    │  Uptime monitor alerts   │
                    └─────────────────────────┘
```

### What each security gate checks

| Gate | Tool | What it catches |
|------|------|-----------------|
| Dependency scan | `npm audit --audit-level=high` or Snyk | CVEs in npm packages |
| SAST | CodeQL (free on GitHub) or Semgrep | SQL injection, XSS, insecure patterns in code |
| Secret scan | GitHub secret scanning (built-in) | API keys, tokens accidentally committed |
| Container scan | Trivy | CVEs in the Docker image OS packages |
| Tests | Vitest | Regressions in business logic |

### What still needs to be built

- [ ] `.github/workflows/ci.yml` — security gates on every PR
- [ ] `.github/workflows/deploy.yml` — build + push + deploy on merge to main
- [ ] GitHub Actions WireGuard peer setup (ephemeral key per run)
- [ ] GHCR login step in workflow
- [ ] Trivy scan step
- [ ] Smoke test script after deploy

---

## 5. ISO 27001:2022 Roadmap

ISO 27001:2022 is the correct standard for EU/Nordic B2B customers. It aligns with GDPR, Swedish procurement requirements, and has affordable local auditors (~€15-25k for a certified body like BSI, Intertek, or DNV). Unlike SOC 2 (US-centric), ISO 27001 is internationally recognised and what Nordic enterprise buyers ask for.

**Evidence collection is built-in** — the compliance module at `/admin/compliance` auto-collects evidence from the platform's own infrastructure daily. No third-party tool needed.

### Annex A technological controls (A.8) — automated evidence

These 13 controls are queried automatically by the compliance module:

| Control | Name | Status |
|---------|------|--------|
| A.8.2 | Privileged Access Rights | ✅ Auto-evidenced — admin user count + role changes |
| A.8.3 | Information Access Restriction (RBAC) | ✅ Auto-evidenced — role-permission count |
| A.8.5 | Secure Authentication (MFA) | ✅ Auto-evidenced — staff MFA adoption rate |
| A.8.6 | Capacity Management (Rate Limiting) | ✅ Auto-evidenced — Redis config snapshot |
| A.8.7 | Protection Against Malware (Security Headers) | ✅ Auto-evidenced — HTTP self-check |
| A.8.15 | Logging (Audit Trail) | ✅ Auto-evidenced — audit log row count + recency |
| A.8.16 | Monitoring (Failed Logins) | ✅ Auto-evidenced — failed login count last 30d |
| A.8.17 | Clock Synchronisation | ✅ Auto-evidenced — NTP config snapshot |
| A.8.28 | Secure Coding (Token Security) | ✅ Auto-evidenced — JWT config snapshot |
| A.8.29 | Security Testing | ✅ Auto-evidenced — Vitest config presence |
| A.8.32 | Change Management (Session Tracking) | ✅ Auto-evidenced — session counts |
| A.8.33 | Test Information Protection | ✅ Auto-evidenced — .env convention check |
| A.8.34 | Protection During Audit (Access Review) | ✅ Auto-evidenced — last access review timestamp |

### Controls requiring manual evidence

These categories cannot be auto-evidenced from code — they need written documentation and process evidence:

**Organizational (A.5) — policies and governance:**

| Control | Action needed |
|---------|---------------|
| Information security policy (A.5.1) | Written policy document — see Policy Vault |
| Roles and responsibilities (A.5.2) | Written document: who owns what |
| Segregation of duties (A.5.3) | Document access boundaries |
| Information classification (A.5.12) | Written scheme: public / internal / confidential |
| Data retention and disposal (A.5.33) | Written policy: how long data kept, deletion process |
| Supplier security (A.5.19-22) | Risk assessment docs for Vapi, Resend, n8n |

**People (A.6) — HR and training:**

| Control | Action needed |
|---------|---------------|
| Security awareness training (A.6.3) | Log training completion — even a free online course |
| Acceptable use policy (A.6.2) | Written document |
| Remote working policy (A.6.7) | Written document |

**Physical (A.7) — facility controls:**

| Control | Action needed |
|---------|---------------|
| Physical security perimeter (A.7.1) | Your hosting provider's ISO 27001 cert covers this — get their cert |
| Secure areas and access control (A.7.2-4) | VPS provider cert + your home office policy |

### Technical gaps still needed

| Gap | Action needed |
|-----|---------------|
| Secrets management | Move from `.env` files to Doppler or Vault (A.8.13) |
| Vulnerability scanning | Add Trivy + npm audit to CI (A.8.8) |
| SAST | Add CodeQL to GitHub Actions (A.8.28) |
| Uptime monitoring | BetterStack free tier (A.8.16) |
| Automated DB backups | Daily `pg_dump`, off-site storage (A.8.13) |
| Encryption at rest | Docker volume encryption or managed DB (A.8.24) |
| Incident response plan | Written playbook with defined response times (A.5.26) |

### Certification path

```
Stage 1 — Document review (1-2 days)
├── Auditor checks your ISMS documentation
├── Policies, risk register, scope statement
└── Gap analysis report issued

Stage 2 — Audit (2-4 days on-site or remote)
├── Auditor tests that controls are actually operating
├── Reviews evidence from compliance module
├── Interviews you about processes
└── Issues certificate (valid 3 years) or nonconformity list

Surveillance audits — annual check to maintain certificate
```

**Timeline:** Stage 1 + Stage 2 can be scheduled back-to-back — no mandatory evidence collection period like SOC 2 Type 2. Typical timeline: 3-6 months from starting documentation to holding the certificate.

**Swedish auditors:** BSI Sverige, Intertek, DNV, Bureau Veritas — all certify to ISO 27001:2022. Cost: ~€15-25k for initial certification of a small scope.

### Tooling

| Need | Tool | Cost |
|------|------|------|
| Evidence collection | Built-in — `/admin/compliance` | Free (self-hosted) |
| Risk register | Built-in — `/admin/compliance/risks` | Free |
| Policy vault | Built-in — `/admin/compliance/policies` | Free |
| Uptime monitoring | BetterStack | Free tier |
| Error tracking | Sentry | Free tier |
| Secrets management | Doppler | Free tier |
| Pen testing (recommended) | HackerOne, Cobalt, or Swedish freelance | €3-10k |
| ISO 27001 auditor | BSI, DNV, Bureau Veritas Sverige | ~€15-25k |

---

## 6. Docker & Horizontal Scaling Strategy

### Current: Single VPS (Docker Compose)

```
VPS
└── docker compose
    ├── next-app (1 replica)
    ├── postgres (1 replica)
    ├── redis (1 replica)
    └── caddy (1 replica)
```

Good for: MVP, early customers, low traffic.
Limit: single point of failure, vertical scaling only.

### Next: Multi-VPS (Docker Swarm)

When you need more capacity but not full Kubernetes complexity:

```
Manager Node (VPS 1)              Worker Nodes
┌─────────────────────┐    ┌──────────────────┐
│  Docker Swarm       │    │  next-app replica │
│  Manager            │───►│  next-app replica │
│                     │    │  next-app replica │
│  Caddy (load bal.)  │    └──────────────────┘
│  postgres (single)  │
│  redis (single)     │    Shared storage / managed DB
└─────────────────────┘    for stateful services
```

When to move here: sustained traffic > ~500 concurrent users, or you need zero-downtime deploys.

### Future: Kubernetes (K8s)

When you have: dedicated infra team, multi-region requirements, hundreds of microservices.
Not needed now. The codebase is already modular monolith → extraction-ready for this later.

### Stateless vs Stateful services

The Next.js app is **already stateless** (sessions in Redis, data in Postgres).
This means you can add more Next.js replicas at any time without code changes.

Stateful services (Postgres, Redis) must be handled carefully:
- **PostgreSQL**: Use managed service (Supabase, Neon, RDS) for HA, or PostgreSQL streaming replication
- **Redis**: Redis Sentinel or Redis Cluster for HA, or managed (Upstash, Redis Cloud)

---

## 7. Engineering Roles You Are Covering

As a solo founder, you are wearing all of these hats simultaneously. Here's how to think about the workload:

| Role | What it involves | Urgency | Notes |
|------|-----------------|---------|-------|
| **Platform / DevOps Engineer** | Docker, CI/CD pipelines, GitHub Actions, deployment automation, container registry | High — now | The CI/CD gap is the biggest immediate risk |
| **Cloud Infrastructure / NetSec Engineer** | VPS firewall rules, WireGuard setup, DNS, OS hardening | High — now | Closes the public SSH attack surface |
| **Application Security Engineer** | SAST in CI, secrets management, threat modeling, security header tuning | High — for ISO 27001 | Much of this is already done in the app; gaps are in CI |
| **GRC Analyst** (Governance, Risk, Compliance) | ISO 27001 policy writing, evidence collection, risk register, auditor liaison | Medium — 3-6 month runway | Most time-consuming, least technical. Evidence collection built into `/admin/compliance`. Consider fractional GRC hire for policy docs |
| **SRE** (Site Reliability Engineer) | SLO/SLA definitions, alerting, uptime monitoring, incident response playbooks, on-call | Medium | Needed before Stage 1 audit |
| **Backend Engineer** | Product features, API design, domain logic | Ongoing | You're already doing this |
| **Frontend Engineer** | UI components, UX, real-time features | Ongoing | You're already doing this |

### What to delegate or buy

- **GRC policy writing** — hire a fractional compliance consultant for ~20-30 hours of specialized work. Not worth learning from scratch when auditors have templates. Evidence collection itself is built into `/admin/compliance`.
- **Pen testing** — recommended but not strictly required for ISO 27001 (unlike SOC 2). Still valuable as supporting evidence.
- **ISO 27001 audit** — must be a certified body (BSI, DNV, Bureau Veritas, etc.). Cannot self-certify.
- **Uptime monitoring, error tracking** — buy tools (BetterStack, Sentry), don't build.

---

## 8. Priority Execution Order

Each step enables the next. Do these in order:

```
PHASE 1 — CLOSE THE ATTACK SURFACE (Week 1-2)
├── 1. WireGuard setup on VPS
├── 2. Firewall: drop public SSH, only WG + 443 + 80 open
└── 3. Verify all Docker internal ports are NOT exposed publicly

PHASE 2 — SECRETS & CI/CD (Week 2-4)
├── 4. Migrate .env files to Doppler (or similar)
├── 5. GitHub Actions CI pipeline with security gates
│       npm audit + CodeQL + Trivy + secret scan + Vitest
└── 6. GitHub Actions deploy pipeline via WireGuard

PHASE 3 — OBSERVABILITY (Week 4-6)
├── 7. Uptime monitoring with alerts (BetterStack free tier)
├── 8. Error tracking (Sentry free tier)
└── 9. Define SLO: target uptime % and alert thresholds

PHASE 4 — COMPLIANCE FOUNDATIONS (Month 2-3)
├── 10. Encryption at rest (volume encryption or managed DB)
├── 11. Automated daily DB backups + off-site storage
├── 12. Write Access Control Policy (who can access what)
├── 13. Write Incident Response Plan
└── 14. Write Data Retention & Classification Policy

PHASE 5 — ENGAGE ISO 27001 AUDITOR (Month 3+)
├── 15. Engage certified body early (BSI, DNV, Bureau Veritas Sverige)
├── 16. Evidence collection runs daily via /admin/compliance (already built)
├── 17. Complete policy documentation in /admin/compliance/policies
└── 18. Schedule Stage 1 + Stage 2 audit (~€15-25k, 9-12 months to cert)

PHASE 6 — SCALING PREP (Month 6+, as needed)
├── 19. Move PostgreSQL + Redis to managed services
├── 20. Docker Swarm for Next.js horizontal scaling
└── 21. Consider CDN (Cloudflare) in front of Caddy
```

---

*Last updated: 2026-03. Maintained alongside `docs/ARCHITECTURE.md`.*
