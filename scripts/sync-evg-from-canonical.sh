#!/usr/bin/env bash
# Copy EVG 3.0 Storm from its canonical repo into this vendor tree.
#
# Usage:
#   scripts/sync-evg-from-canonical.sh
#   scripts/sync-evg-from-canonical.sh /path/to/evg
#   EVG_ROOT=/path/to/evg scripts/sync-evg-from-canonical.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/lib/evg"

EVG_SRC="${1:-${EVG_ROOT:-}}"
if [ -z "$EVG_SRC" ]; then
  for candidate in \
    "$ROOT/../evg" \
    "/agent/repos/evg"
  do
    if [ -d "$candidate/storm" ]; then
      EVG_SRC="$candidate"
      break
    fi
  done
fi

if [ -z "$EVG_SRC" ] || [ ! -d "$EVG_SRC/storm" ]; then
  echo "No EVG checkout found. Clone github.com/terotests/evg and pass its path." >&2
  echo "  scripts/sync-evg-from-canonical.sh /path/to/evg" >&2
  exit 1
fi

STORM="$EVG_SRC/storm"
echo "Syncing $STORM → $DEST"

mkdir -p "$DEST"
tar -C "$STORM" --exclude 'bin/*' --exclude 'bin/.**' -cf - . | tar -C "$DEST" -xf -
mkdir -p "$DEST/bin"
if [ -f "$STORM/bin/.gitignore" ]; then
  cp "$STORM/bin/.gitignore" "$DEST/bin/.gitignore"
fi

# Keep the vendor notice; Storm's README is the engine reference.
if [ ! -f "$DEST/CANONICAL.md" ]; then
  echo "warning: CANONICAL.md missing after sync" >&2
fi

echo "Done. Vendor copy now matches $(cat "$STORM/ORIGIN.sha" 2>/dev/null || echo "$EVG_SRC")"
