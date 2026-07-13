#!/usr/bin/env bash
# Build the AssemblyScript UI-effects showcase guest to build/logic.wasm.
#
# Usage:  bash gallery/game_engine/wasm/as_ui_effects/build.sh
#
# Reuses the shared RGU1 builder in ../as_autopeli/assembly/ui.ts. If asc is not
# installed in this crate, fall back to a sibling crate's assemblyscript install.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
CRATE="$ROOT/gallery/game_engine/wasm/as_ui_effects"
SIB1="$ROOT/gallery/game_engine/wasm/as_ui_menu"
SIB2="$ROOT/gallery/game_engine/wasm/as_autopeli"

cd "$CRATE"
mkdir -p build

ASC=""
if [[ -x node_modules/.bin/asc ]]; then
  ASC="node_modules/.bin/asc"
elif [[ -x "$SIB1/node_modules/.bin/asc" ]]; then
  ASC="$SIB1/node_modules/.bin/asc"
elif [[ -x "$SIB2/node_modules/.bin/asc" ]]; then
  ASC="$SIB2/node_modules/.bin/asc"
else
  echo "==> npm install (assemblyscript)"
  npm install --no-audit --no-fund
  ASC="node_modules/.bin/asc"
fi

echo "==> asc build (optimize, minimal runtime)"
"$ASC" assembly/index.ts \
  --outFile build/logic.wasm --runtime minimal --use abort= --optimize

echo "==> wrote $CRATE/build/logic.wasm ($(wc -c < build/logic.wasm) bytes)"
