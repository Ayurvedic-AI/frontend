#!/usr/bin/env bash
#
# svm-fe/scripts/sdk-gen.sh
#
# Wrapper around `orval` that pre-checks the OpenAPI URL is reachable BEFORE
# letting Orval wipe the previously generated SDK. Without this guard,
# `clean: true` in orval.config.ts would empty `src/sdk/` and then fail the
# fetch, leaving the project with no SDK at all — see the edge case in
# specs/004-frontend-orval-sdk/spec.md ("Backend offline during regeneration
# — previously generated SDK files are left untouched").
#
# Usage: bun run sdk:gen
# Env:   OPENAPI_URL — defaults to http://localhost:8000/api/v1/openapi.json
#
set -euo pipefail

URL="${OPENAPI_URL:-http://localhost:8000/api/v1/openapi.json}"

echo "[sdk:gen] probing OpenAPI source: $URL"

# Fail fast if the URL is unreachable or returns non-2xx. curl -sf:
#   -s : silent
#   -f : fail on non-2xx (exit 22)
#   --max-time 10 : 10-second budget (the backend should answer instantly locally)
if ! curl -sf --max-time 10 "$URL" -o /dev/null; then
  echo ""
  echo "[sdk:gen] ERROR: could not fetch $URL"
  echo "[sdk:gen] The previously generated SDK in src/sdk/ has been left untouched."
  echo ""
  echo "[sdk:gen] Common causes:"
  echo "  - svm-be is not running. Start it with:"
  echo "      cd svm-be && uv run uvicorn app.main:app --port 8000"
  echo "  - OPENAPI_URL points at the wrong host or port."
  echo "  - The backend is up but the /api/v1/openapi.json route is broken."
  exit 1
fi

# Quick JSON sanity-check: openapi.json MUST start with `{` after optional whitespace.
# Catches the case where the URL returns 200 with HTML (e.g., misconfigured proxy).
#
# Read the body WITHOUT piping into `head`: `head -c N` closes the pipe as soon as
# it has its bytes, which hands curl a broken-pipe write error (exit 23). Under
# `set -o pipefail` that non-zero status propagates and `set -e` aborts the script
# — even though the JSON is perfectly valid. Trimming leading whitespace in pure
# bash keeps the check pipe-free and race-free.
BODY=$(curl -sf --max-time 10 "$URL")
TRIMMED="${BODY#"${BODY%%[![:space:]]*}"}"
FIRST_CHAR="${TRIMMED:0:1}"
if [ "$FIRST_CHAR" != "{" ]; then
  echo ""
  echo "[sdk:gen] ERROR: $URL returned 200 but the body does not look like JSON."
  echo "[sdk:gen] First byte received: '$FIRST_CHAR'"
  echo "[sdk:gen] The previously generated SDK in src/sdk/ has been left untouched."
  exit 1
fi

echo "[sdk:gen] source reachable; running orval"
exec orval --config ./orval.config.ts
