#!/usr/bin/env bash
# ============================================================================
# fetch-three-reference.sh — vendor a pinned three.js source tree for API/value
# comparison (NOT compiled into anything; a read-only reference + the source of
# truth for the value-parity golden numbers).
#
#   bash fetch-three-reference.sh          # fetch the pinned version into vendor/
#
# Uses `npm pack` (registry.npmjs.org, no GitHub needed) to grab the published
# tarball, then extracts package/src (the full ES-module source) and
# package/build into vendor/three-<version>/. vendor/ is .gitignored — the
# checkout is reproducible from this script + the pinned version, so we do not
# commit ~5 MB of third-party source.
# ============================================================================
set -euo pipefail

# Pin — bump deliberately (and regenerate goldens: see gen-goldens.mjs).
THREE_VERSION="0.185.1"

HERE="$(cd "$(dirname "$0")" && pwd)"
VENDOR="$HERE/vendor"
DEST="$VENDOR/three-$THREE_VERSION"

if [ -d "$DEST/src" ]; then
  echo "three@$THREE_VERSION already vendored at $DEST"
  exit 0
fi

mkdir -p "$VENDOR"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "==> npm pack three@$THREE_VERSION"
( cd "$TMP" && npm pack "three@$THREE_VERSION" >/dev/null )
TARBALL="$(ls "$TMP"/three-*.tgz | head -1)"

echo "==> extracting src/ + build/"
tar -xzf "$TARBALL" -C "$TMP"          # -> $TMP/package/...
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$TMP/package/src"   "$DEST/src"
cp -R "$TMP/package/build" "$DEST/build"
cp    "$TMP/package/package.json" "$DEST/package.json" 2>/dev/null || true
# A stable, version-agnostic symlink the tooling reads.
ln -sfn "three-$THREE_VERSION" "$VENDOR/current"

echo "==> done: $DEST"
echo "    src classes: $(find "$DEST/src" -name '*.js' | wc -l) files"
