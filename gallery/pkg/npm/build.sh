#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later
# Assemble the publishable `ranger-pkg` tree under gallery/pkg/npm/dist.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
NPM_DIR="$ROOT/gallery/pkg/npm"
DIST="$NPM_DIR/dist"

rm -rf "$DIST"
mkdir -p "$DIST"

echo "→ compile gallery/pkg/src/pkg_tool.rgr"
cd "$ROOT"
# -d= is taken relative to the working directory, so keep it relative.
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
  node bin/output.js -es6 ./gallery/pkg/src/pkg_tool.rgr \
  -d=./gallery/pkg/npm/dist -o=pkg_tool.cjs -nodecli
chmod +x "$DIST/pkg_tool.cjs"

cp "$ROOT/gallery/pkg/tools/git-http.mjs" "$DIST/"
cp "$ROOT/gallery/pkg/tools/install.mjs" "$DIST/"
cp "$ROOT/gallery/pkg/tools/clone.mjs" "$DIST/"
cp "$NPM_DIR/ranger-pkg.mjs" "$DIST/"
chmod +x "$DIST/ranger-pkg.mjs"
cp "$ROOT/gallery/pkg/README.md" "$NPM_DIR/README.md"
cp "$ROOT/LICENSE-AGPL-3.0" "$NPM_DIR/LICENSE"

echo "→ $DIST"
ls -la "$DIST"
