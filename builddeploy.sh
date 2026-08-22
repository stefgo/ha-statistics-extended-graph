#!/bin/bash
# Builds the card and deploys dist/customgraph.js to the Home Assistant instance.
#
# Configuration comes from .env (see .env.example); environment variables that
# are already set take precedence.

set -e

cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

HOST="${CUSTOMGRAPH_HOST:-}"
CONFIG="${CUSTOMGRAPH_CONFIG:-/config}"
TARGET="${CUSTOMGRAPH_TARGET:-${CONFIG}/www/community/custom-graph}"
SSH_PORT="${CUSTOMGRAPH_SSH_PORT:-22}"

if [ -z "$HOST" ]; then
  echo "CUSTOMGRAPH_HOST is not set. Copy .env.example to .env and fill it in." >&2
  exit 1
fi

echo "Building card ..."
npm ci --silent
# The local build counter is opt-in, so only the bundle deployed from here
# carries one; every other build stays at the plain semver.
CUSTOMGRAPH_BUILD_COUNTER=1 npm run build

echo "Deploying customgraph.js to ${HOST}:${TARGET} ..."
ssh -p "${SSH_PORT}" "${HOST}" "mkdir -p ${TARGET}"
scp -P "${SSH_PORT}" dist/customgraph.js "${HOST}:${TARGET}/"

# Read back what the build baked into the bundle, so the message below names
# the exact build that was just deployed.
VERSION="$(node -p "require('./package.json').version")+build.$(cat .build-number 2>/dev/null || echo '?')"

echo "Done. Deployed version: ${VERSION}"
echo "Clear the browser cache and reload the dashboard."
echo "Resource URL: /hacsfiles/custom-graph/customgraph.js"
