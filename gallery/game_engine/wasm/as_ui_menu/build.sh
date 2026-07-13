#!/usr/bin/env bash
# Build the AssemblyScript selectable-menu guest to build/logic.wasm.
#
# Usage:  bash gallery/game_engine/wasm/as_ui_menu/build.sh
#
# Reuses the shared RGU1 builder in ../as_autopeli/assembly/ui.ts, so its
# node_modules (assemblyscript) satisfy the import too. If asc is not present in
# this project, we fall back to the sibling as_autopeli install.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
CRATE="$ROOT/gallery/game_engine/wasm/as_ui_menu"
SIB="$ROOT/gallery/game_engine/wasm/as_autopeli"

cd "$CRATE"
mkdir -p build

ASC=""
if [[ -x node_modules/.bin/asc ]]; then
  ASC="node_modules/.bin/asc"
elif [[ -x "$SIB/node_modules/.bin/asc" ]]; then
  ASC="$SIB/node_modules/.bin/asc"
else
  echo "==> npm install (assemblyscript)"
  npm install --no-audit --no-fund
  ASC="node_modules/.bin/asc"
fi

echo "==> asc build (optimize, minimal runtime)"
"$ASC" assembly/index.ts \
  --outFile build/logic.wasm --runtime minimal --use abort= --optimize

echo "==> wrote $CRATE/build/logic.wasm ($(wc -c < build/logic.wasm) bytes)"
