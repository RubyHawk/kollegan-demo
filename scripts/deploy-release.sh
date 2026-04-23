#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/offert}"
ARTIFACT_PATH="${1:-}"
DEPLOY_SHA="${2:-}"
SERVICE_NAME="${SERVICE_NAME:-kollegan}"
DEPLOY_STATE_DIR="${DEPLOY_STATE_DIR:-$APP_DIR/.deploy-state}"
HEALTHCHECK_URLS_CSV="${HEALTHCHECK_URLS:-http://127.0.0.1:3000/api/health,http://localhost:3000/api/health,http://127.0.0.1/api/health,http://localhost/api/health}"
HEALTHCHECK_ATTEMPTS="${HEALTHCHECK_ATTEMPTS:-15}"
HEALTHCHECK_DELAY_SECONDS="${HEALTHCHECK_DELAY_SECONDS:-2}"

if [ -z "$ARTIFACT_PATH" ] || [ -z "$DEPLOY_SHA" ]; then
  echo "Usage: bash scripts/deploy-release.sh /tmp/kollegan-release/kollegan-next-build.tar.gz <commit-sha>" >&2
  exit 1
fi

if [ ! -f "$ARTIFACT_PATH" ]; then
  echo "Artifact not found: $ARTIFACT_PATH" >&2
  exit 1
fi

cd "$APP_DIR"

git fetch origin main
git rebase --abort >/dev/null 2>&1 || true
if ! git rev-parse --verify "${DEPLOY_SHA}^{commit}" >/dev/null 2>&1; then
  echo "Commit not available after fetch: $DEPLOY_SHA" >&2
  exit 1
fi
git reset --hard "$DEPLOY_SHA"
rm -f .next/lock

mkdir -p "$DEPLOY_STATE_DIR"

lock_hash="$(sha256sum package-lock.json | awk '{print $1}')"
previous_lock_hash=""
if [ -f "$DEPLOY_STATE_DIR/package-lock.sha256" ]; then
  previous_lock_hash="$(cat "$DEPLOY_STATE_DIR/package-lock.sha256")"
fi

if [ ! -d node_modules ] || [ "$lock_hash" != "$previous_lock_hash" ]; then
  npm ci --omit=dev --prefer-offline --no-audit
  printf '%s' "$lock_hash" > "$DEPLOY_STATE_DIR/package-lock.sha256"
fi

rm -rf .next
tar -xzf "$ARTIFACT_PATH" -C "$APP_DIR"
rm -f "$ARTIFACT_PATH"

DATABASE_URL="${DATABASE_URL:-postgresql://user:pass@localhost:5432/kollegan?schema=public}" npx prisma generate
npx prisma migrate deploy
sudo systemctl restart "$SERVICE_NAME"

IFS=',' read -r -a health_urls <<< "$HEALTHCHECK_URLS_CSV"

for ((attempt=1; attempt<=HEALTHCHECK_ATTEMPTS; attempt+=1)); do
  for url in "${health_urls[@]}"; do
    if curl --fail --silent --show-error "$url" >/dev/null; then
      exit 0
    fi
  done

  sleep "$HEALTHCHECK_DELAY_SECONDS"
done

echo "Health check failed on all known local endpoints after restart" >&2
exit 1
