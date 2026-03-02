# Kollegan Platform Architecture & DevSecOps Guide

> Reference document for infrastructure, security, and compliance decisions.
> Covers: Docker scaling strategy, WireGuard networking, SOC 2 Type 2 roadmap, DevSecOps pipeline, and engineering role responsibilities.

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Overall Platform Architecture](#2-overall-platform-architecture)
3. [Network Security — WireGuard](#3-network-security--wireguard)
4. [DevSecOps Pipeline](#4-devsecops-pipeline)
5. [SOC 2 Type 2 Roadmap](#5-soc-2-type-2-roadmap)
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
4. **Key rotation policy** — rotate peer keys quarterly (document in your SOC 2 policies)
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

## 5. SOC 2 Type 2 Roadmap

SOC 2 Type 2 requires **6-12 months of continuous evidence** that controls are operating. You need to start the evidence clock as soon as the controls are in place.

### Trust Service Criteria overview

```
SOC 2 Type 2
├── CC6-CC9   Security          (most controls, biggest section)
├── A1        Availability      (uptime, backups, incident response)
├── C1        Confidentiality   (encryption, data handling)
└── PI1       Processing Integrity (accurate, complete processing)
```

### Security controls (CC6-CC9)

| Control | Status | Action needed |
|---------|--------|---------------|
| MFA enforced for all users | ✅ Done | TOTP + WebAuthn already in codebase |
| Secure session management | ✅ Done | JWT + httpOnly + Redis blacklist |
| Rate limiting on APIs | ✅ Done | Redis sliding window |
| Security headers (HSTS, CSP) | ✅ Done | Configured in `next.config.ts` |
| Webhook authentication | ✅ Done | HMAC on Vapi webhooks |
| Audit log (who did what, when) | ✅ Done | Append-only `aud_*` tables |
| Multi-tenant data isolation | ✅ Done | `organizationId` enforced at query layer |
| Secrets management | ❌ Missing | Move from `.env` files to Doppler or Vault |
| Vulnerability scanning | ❌ Missing | Add Trivy + npm audit to CI |
| SAST (code analysis) | ❌ Missing | Add CodeQL to GitHub Actions |
| Penetration testing | ❌ Missing | Annual third-party pen test |
| Vendor security reviews | ❌ Missing | Document Vapi, Resend, n8n risk assessments |
| Access control policy | ❌ Missing | Written document: who can access what, how |
| Security training records | ❌ Missing | Even for one person — log it |

### Availability controls (A1)

| Control | Status | Action needed |
|---------|--------|---------------|
| Health checks | ✅ Done | Docker health endpoints |
| Redis data persistence | ✅ Done | AOF enabled |
| HTTPS uptime | ✅ Done | Caddy auto-renews TLS |
| Uptime monitoring | ❌ Missing | Set up BetterStack / UptimeRobot / Pagerduty |
| Automated DB backups | ❌ Missing | Daily `pg_dump`, off-site storage |
| Backup restore testing | ❌ Missing | Test restore quarterly, document results |
| Incident response plan | ❌ Missing | Written playbook: who, what, how fast |
| SLO definition | ❌ Missing | Define target uptime (e.g. 99.9%) |

### Confidentiality controls (C1)

| Control | Status | Action needed |
|---------|--------|---------------|
| Encryption in transit | ✅ Done | TLS everywhere via Caddy |
| Tenant data isolation | ✅ Done | Row-level `organizationId` |
| Audit trail | ✅ Done | Append-only event + audit logs |
| Encryption at rest | ❌ Missing | Encrypt Docker volumes (LUKS or cloud disk encryption) |
| Data retention policy | ❌ Missing | Written document: how long data is kept, deletion process |
| Data classification | ❌ Missing | Written document: what data is PII, sensitive, public |

### Processing Integrity controls (PI1)

| Control | Status | Action needed |
|---------|--------|---------------|
| Domain event log | ✅ Done | Events table with actor tracking |
| Audit trail on mutations | ✅ Done | Append-only `aud_*` tables |
| RFC 9457 error format | ✅ Done | Standard error responses |
| Error tracking | ❌ Missing | Sentry or Axiom error monitoring |
| Validation coverage docs | ❌ Missing | Document input validation approach |

### Evidence collection checklist (start the clock)

Once controls are in place, you need to collect evidence continuously:

- [ ] Export audit logs monthly (evidence of who accessed what)
- [ ] Screenshot uptime dashboard monthly (evidence of availability)
- [ ] Run and save vulnerability scan results monthly
- [ ] Document any incidents + resolution (even minor ones)
- [ ] Keep access control reviews (who has access, reviewed quarterly)
- [ ] Save backup restore test results
- [ ] Log security training completion (you completing a course counts)

### SOC 2 tooling recommendations

| Need | Tool | Cost |
|------|------|------|
| Audit readiness platform | Vanta, Drata, or Sprinto | $500-1500/mo — automates evidence collection |
| Uptime monitoring | BetterStack | Free tier available |
| Error tracking | Sentry | Free tier available |
| Secrets management | Doppler | Free tier available |
| Pen testing (annual) | HackerOne, Cobalt, or freelance | $3k-15k per engagement |
| SOC 2 auditor | Johanson Group, A-LIGN, Schellman | $15k-40k for Type 2 |

> **Tip:** Vanta or Drata significantly reduces SOC 2 effort by auto-collecting evidence from GitHub, AWS, etc. Worth the cost if you're serious about the cert.

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
| **Application Security Engineer** | SAST in CI, secrets management, threat modeling, security header tuning | High — for SOC 2 | Much of this is already done in the app; gaps are in CI |
| **GRC Analyst** (Governance, Risk, Compliance) | SOC 2 policy writing, evidence collection, risk register, auditor liaison | Medium — 6-month runway | Most time-consuming, least technical. Consider fractional GRC hire |
| **SRE** (Site Reliability Engineer) | SLO/SLA definitions, alerting, uptime monitoring, incident response playbooks, on-call | Medium | Needed before SOC 2 evidence collection starts |
| **Backend Engineer** | Product features, API design, domain logic | Ongoing | You're already doing this |
| **Frontend Engineer** | UI components, UX, real-time features | Ongoing | You're already doing this |

### What to delegate or buy

- **GRC policy writing** — hire a fractional compliance consultant for ~20-30 hours of specialized work. Not worth learning from scratch when auditors have templates.
- **Pen testing** — must be a third party. Cannot self-attest for SOC 2.
- **SOC 2 audit** — must be a certified CPA firm (not a SaaS tool alone).
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

PHASE 5 — START SOC 2 CLOCK (Month 3+)
├── 15. Engage SOC 2 auditor early (they guide what evidence to collect)
├── 16. Consider Vanta/Drata for automated evidence collection
├── 17. Begin 6-month evidence collection period
└── 18. Schedule annual pen test

PHASE 6 — SCALING PREP (Month 6+, as needed)
├── 19. Move PostgreSQL + Redis to managed services
├── 20. Docker Swarm for Next.js horizontal scaling
└── 21. Consider CDN (Cloudflare) in front of Caddy
```

---

*Last updated: 2026-03. Maintained alongside `docs/ARCHITECTURE.md`.*
