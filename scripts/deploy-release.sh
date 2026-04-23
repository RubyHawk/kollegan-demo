#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/offert}"
ARTIFACT_PATH="${1:-}"
SERVICE_NAME="${SERVICE_NAME:-kollegan}"
DEPLOY_STATE_DIR="${DEPLOY_STATE_DIR:-$APP_DIR/.deploy-state}"

if [ -z "$ARTIFACT_PATH" ]; then
  echo "Usage: bash scripts/deploy-release.sh /tmp/kollegan-next-build.tar.gz" >&2
  exit 1
fi

if [ ! -f "$ARTIFACT_PATH" ]; then
  echo "Artifact not found: $ARTIFACT_PATH" >&2
  exit 1
fi

cd "$APP_DIR"

git fetch origin
git rebase --abort >/dev/null 2>&1 || true
git reset --hard origin/main
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

npx prisma migrate deploy
sudo systemctl restart "$SERVICE_NAME"

health_urls=(
  "http://127.0.0.1:3000/api/health"
  "http://localhost:3000/api/health"
  "http://127.0.0.1/api/health"
  "http://localhost/api/health"
)

for attempt in {1..15}; do
  for url in "${health_urls[@]}"; do
    if curl --fail --silent --show-error "$url" >/dev/null; then
      exit 0
    fi
  done

  sleep 2
done

echo "Health check failed on all known local endpoints after restart" >&2
exit 1
