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
npm run build

echo "Deploying customgraph.js to ${HOST}:${TARGET} ..."
ssh -p "${SSH_PORT}" "${HOST}" "mkdir -p ${TARGET}"
scp -P "${SSH_PORT}" dist/customgraph.js "${HOST}:${TARGET}/"

echo "Done. Clear the browser cache and reload the dashboard."
echo "Resource URL: /hacsfiles/custom-graph/customgraph.js"
