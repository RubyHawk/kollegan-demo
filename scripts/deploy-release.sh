#!/usr/bin/env bash
set -euo pipefail

# Quiet npm's update-notifier and funding notices in deploy logs
export NPM_CONFIG_UPDATE_NOTIFIER=false
export NPM_CONFIG_FUND=false

APP_DIR="${APP_DIR:-/var/www/offert}"
ARTIFACT_PATH="${1:-}"
DEPLOY_SHA="${2:-}"
SERVICE_NAME="${SERVICE_NAME:-kollegan}"
SERVICE_NAMES="${SERVICE_NAMES:-$SERVICE_NAME}"
DEPLOY_STATE_DIR="${DEPLOY_STATE_DIR:-$APP_DIR/.deploy-state}"
APP_BASE_URL="${APP_BASE_URL:-}"
# Health-check URLs use AND semantics: every configured URL must become healthy
# before the deploy is reported successful. List one URL per runtime service
# (split runtime = port 3000 for the portal and 3100 for the public site).
# Do not list redundant aliases of the same service, or the deploy will block on
# alias endpoints that are not actually served.
DEFAULT_LOCAL_HEALTHCHECK_URLS="http://127.0.0.1:3000/api/health"
HEALTHCHECK_ATTEMPTS="${HEALTHCHECK_ATTEMPTS:-15}"
HEALTHCHECK_DELAY_SECONDS="${HEALTHCHECK_DELAY_SECONDS:-2}"

if [ -z "$ARTIFACT_PATH" ] || [ -z "$DEPLOY_SHA" ]; then
  echo "Usage: /var/www/offert/deploy_kollegan.sh <artifact.tar.gz> <commit-sha>" >&2
  exit 1
fi

if [ ! -f "$ARTIFACT_PATH" ]; then
  echo "Artifact not found: $ARTIFACT_PATH" >&2
  exit 1
fi

if [ -n "${HEALTHCHECK_URLS:-}" ]; then
  HEALTHCHECK_URLS_CSV="$HEALTHCHECK_URLS"
elif [ -n "$APP_BASE_URL" ]; then
  HEALTHCHECK_URLS_CSV="${APP_BASE_URL%/}/api/health"
else
  HEALTHCHECK_URLS_CSV="$DEFAULT_LOCAL_HEALTHCHECK_URLS"
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
  npm ci --omit=dev --prefer-offline --no-audit --ignore-scripts
  printf '%s' "$lock_hash" > "$DEPLOY_STATE_DIR/package-lock.sha256"
fi

rm -rf .next
tar -xzf "$ARTIFACT_PATH" -C "$APP_DIR"
rm -f "$ARTIFACT_PATH"

DATABASE_URL="${DATABASE_URL:-postgresql://user:pass@localhost:5432/kollegan?schema=public}" npx prisma generate
npx prisma migrate deploy

IFS=',' read -r -a service_names <<< "$SERVICE_NAMES"
for service in "${service_names[@]}"; do
  service="$(echo "$service" | xargs)"
  if [ -n "$service" ]; then
    sudo systemctl restart "$service"
  fi
done

IFS=',' read -r -a health_urls <<< "$HEALTHCHECK_URLS_CSV"

# Probe a single health URL, retrying until it succeeds or attempts run out.
# Returns 0 on the first healthy response, non-zero if it never becomes healthy.
wait_for_health_url() {
  local url="$1"
  local attempt output
  for ((attempt=1; attempt<=HEALTHCHECK_ATTEMPTS; attempt+=1)); do
    if output="$(curl --fail --silent --show-error --connect-timeout 2 --max-time 5 "$url" 2>&1 >/dev/null)"; then
      return 0
    fi
    health_last_error="$url :: ${output:-curl failed}"
    if [ "$attempt" -lt "$HEALTHCHECK_ATTEMPTS" ]; then
      sleep "$HEALTHCHECK_DELAY_SECONDS"
    fi
  done
  return 1
}

# Every configured runtime service must pass its health check (AND semantics);
# one healthy service is not enough to call the deploy successful.
health_ok=true
for url in "${health_urls[@]}"; do
  url="$(echo "$url" | xargs)"
  [ -n "$url" ] || continue
  health_last_error=""
  if ! wait_for_health_url "$url"; then
    health_ok=false
    echo "Health check failed for $url. Last probe error: ${health_last_error:-unknown}" >&2
  fi
done

if [ "$health_ok" = true ]; then
  exit 0
fi

echo "Deploy health checks failed: one or more runtime services are unhealthy after restart." >&2
for service in "${service_names[@]}"; do
  service="$(echo "$service" | xargs)"
  if [ -n "$service" ]; then
    sudo systemctl --no-pager --full status "$service" || true
  fi
done
exit 1
