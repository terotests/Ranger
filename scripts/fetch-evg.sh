#!/usr/bin/env bash
# Fetch EVG 3.0 Storm from terotests/evg and materialize lib/evg for JS hosts.
#
# Gallery ranger.json files depend on deps/evg/storm. Browser helpers and
# npm scripts that still say lib/evg/gl/... load the copy written here, so
# /lib/evg/gl URLs keep working without vendoring the engine in git.
#
# Usage:
#   scripts/fetch-evg.sh                 # clone or reuse, then copy storm → lib/evg
#   scripts/fetch-evg.sh --materialize-only   # deps/evg must already exist
#   EVG_REF=<sha-or-branch> scripts/fetch-evg.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIN_FILE="$ROOT/deps/evg.ref"
DEST="$ROOT/deps/evg"
MATERIALIZE_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --materialize-only) MATERIALIZE_ONLY=1 ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

read_pin() {
  if [ -n "${EVG_REF:-}" ]; then
    echo "$EVG_REF"
    return
  fi
  if [ ! -f "$PIN_FILE" ]; then
    echo "missing $PIN_FILE" >&2
    exit 1
  fi
  grep -v '^#' "$PIN_FILE" | head -1 | tr -d '[:space:]'
}

materialize() {
  if [ ! -d "$DEST/storm" ]; then
    echo "EVG checkout has no storm/ at $DEST" >&2
    exit 1
  fi
  mkdir -p "$ROOT/lib"
  rm -rf "$ROOT/lib/evg"
  mkdir -p "$ROOT/lib/evg"
  tar -C "$DEST/storm" --exclude bin --exclude '.git' -cf - . | tar -C "$ROOT/lib/evg" -xf -
  mkdir -p "$ROOT/lib/evg/bin"
  echo "EVG Storm ready: $DEST/storm → $ROOT/lib/evg"
}

if [ "$MATERIALIZE_ONLY" -eq 1 ]; then
  materialize
  exit 0
fi

PIN="$(read_pin)"
mkdir -p "$ROOT/deps"

link_sibling() {
  local candidate
  for candidate in \
    "${EVG_ROOT:-}" \
    "$ROOT/../evg" \
    "/agent/repos/evg"
  do
    if [ -n "$candidate" ] && [ -d "$candidate/storm" ]; then
      ln -sfn "$candidate" "$DEST"
      echo "Using sibling EVG at $candidate"
      return 0
    fi
  done
  return 1
}

if [ -d "$DEST/storm" ]; then
  echo "Using existing $DEST"
elif link_sibling; then
  :
else
  URL="https://github.com/terotests/evg.git"
  echo "Cloning $URL @$PIN into $DEST"
  rm -rf "$DEST"
  if git clone --depth 1 --branch "$PIN" "$URL" "$DEST" 2>/dev/null; then
    :
  else
    git clone --filter=blob:none "$URL" "$DEST"
    git -C "$DEST" fetch --depth 1 origin "$PIN"
    git -C "$DEST" checkout --detach FETCH_HEAD
  fi
fi

materialize
