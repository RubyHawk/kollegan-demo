# Fluffy's Go-Live Runbook

This runbook assumes one built Next.js artifact and two systemd services on the
same host:

- `fluffys-public` on `127.0.0.1:3100` with `APP_SURFACE=public`
- `kollegan` or `fluffys-portal` on `127.0.0.1:3000` with `APP_SURFACE=portal`

Unset `APP_SURFACE` is for local development only; it preserves the combined
public/portal behavior used before the runtime split.

## Required DNS

- `fluffys.se` A/AAAA -> production host
- `www.fluffys.se` CNAME or A/AAAA -> production host, redirected to apex
- `portal.fluffys.se` A/AAAA -> production host

Do not repoint DNS until the database backup, migration dry run, and local
health checks are complete.

## Environment

Public service:

```ini
PORT=3100
APP_SURFACE=public
PUBLIC_SITE_HOSTS=fluffys.se
NEXT_PUBLIC_APP_URL=https://fluffys.se
```

Portal service:

```ini
PORT=3000
APP_SURFACE=portal
PUBLIC_SITE_HOSTS=fluffys.se
NEXT_PUBLIC_APP_URL=https://portal.fluffys.se
PUBLIC_OFFER_HOSTS=offert.soleria.se
```

Keep WebAuthn settings unchanged for this release. Staff and kitchen remain
password-only through the existing MFA exemption; owner, manager, and accountant
roles still require MFA.

## Nginx Sketch

```nginx
server {
  server_name www.fluffys.se;
  return 301 https://fluffys.se$request_uri;
}

server {
  server_name fluffys.se;
  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_pass http://127.0.0.1:3100;
  }
}

server {
  server_name portal.fluffys.se;
  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_pass http://127.0.0.1:3000;
  }
}
```

Issue or renew certificates for all three hostnames before DNS cutover.

## Deploy

1. Capture a production database backup and record the external backup reference
   in the operations log.
2. Build the artifact from the reviewed commit.
3. Run migration deploy from the release script. The Fluffy migration is
   guarded and additive: it adds nullable user fields, inserts permission rows,
   renames the seeded restaurant slug only when `fluffys` is free, adds
   `fluffys.se`/`portal.fluffys.se` only for the Fluffy org, and demotes
   placeholder hostnames without deleting them.
4. Restart both services from one artifact:

```bash
SERVICE_NAMES=fluffys-public,kollegan \
HEALTHCHECK_URLS=http://127.0.0.1:3100/api/health,http://127.0.0.1:3000/api/health \
/var/www/offert/deploy_kollegan.sh artifact.tar.gz <commit-sha>
```

## Smoke Checks

- `curl -H 'Host: fluffys.se' http://127.0.0.1:3100/api/health`
- `curl -H 'Host: fluffys.se' http://127.0.0.1:3100/meny`
- `curl -I -H 'Host: portal.fluffys.se' http://127.0.0.1:3000/logga-in`
- `curl -I -H 'Host: portal.fluffys.se' http://127.0.0.1:3000/site` returns `404`
- Public reservation submit through `https://fluffys.se/boka`
- Portal login, `/narvaro`, `/personal`, `/webbplats`, menu, reservations,
  schedule, and tasks smoke checks

Rollback is the previous release artifact plus restoring service environment to
the prior single-service shape. Do not roll back the database with destructive
SQL; use the backup/restore procedure if a data rollback is explicitly approved.
