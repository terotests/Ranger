#!/usr/bin/env bash
# Compile the Ranger-language Pong (pong.rgr) to games/ranger_pong/logic.wasm.
#
#   Ranger .rgr --(-l=llvm -wat -freestanding)--> WAT --(rename exports)--> wat2wasm
#
# The Ranger WAT backend exports static methods as `Pong_init`, `Pong_update`,
# ... but the engine's WasmGameRunner looks the guest exports up by their bare
# names (`init`, `update`, `ball_x`, ...). We rename them in the WAT text before
# assembling — a pure build step, no code generation involved.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
GAME_DIR="$ROOT/gallery/game_engine/games/ranger_pong"
SRC="$GAME_DIR/src/pong.rgr"
OUT_DIR="$ROOT/tmp/ranger-pong"
WAT="$OUT_DIR/pong.wat"
WASM="$GAME_DIR/logic.wasm"

RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr"
COMPILER="$ROOT/bin/output.js"
WAT2WASM="$ROOT/node_modules/.bin/wat2wasm"
if [[ ! -x "$WAT2WASM" ]]; then
  WAT2WASM="$(command -v wat2wasm || true)"
fi
if [[ -z "${WAT2WASM:-}" || ! -x "$WAT2WASM" ]]; then
  echo "error: wat2wasm not found — run: npm install" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "==> 1/3 Ranger -> WAT"
RANGER_LIB="$RANGER_LIB" node "$COMPILER" \
  -l=llvm -wat -freestanding \
  "$SRC" -nodecli -d="tmp/ranger-pong" -o="pong.wat"

# The WAT text is written with a .ll extension by the backend.
GEN="$OUT_DIR/pong.ll"
[[ -f "$GEN" ]] || GEN="$OUT_DIR/pong.wat.ll"
cp "$GEN" "$WAT"

echo "==> 2/3 rename exports to the engine ABI"
sed -i \
  -e 's/(export "Pong_init"/(export "init"/' \
  -e 's/(export "Pong_update"/(export "update"/' \
  -e 's/(export "Pong_ball_x"/(export "ball_x"/' \
  -e 's/(export "Pong_ball_y"/(export "ball_y"/' \
  -e 's/(export "Pong_paddle1_y"/(export "paddle1_y"/' \
  -e 's/(export "Pong_paddle2_y"/(export "paddle2_y"/' \
  -e 's/(export "Pong_score1"/(export "score1"/' \
  -e 's/(export "Pong_score2"/(export "score2"/' \
  "$WAT"

echo "==> 3/3 wat2wasm -> $WASM"
"$WAT2WASM" "$WAT" -o "$WASM"

echo "    ok: $WASM ($(wc -c < "$WASM") bytes)"
node -e "
const fs=require('fs');
const m=new WebAssembly.Module(fs.readFileSync('$WASM'));
const names=WebAssembly.Module.exports(m).map(e=>e.name);
const need=['init','update','ball_x','ball_y','paddle1_y','paddle2_y','score1','score2'];
const missing=need.filter(n=>!names.includes(n));
console.log('    exports:', names.join(', '));
if(missing.length){console.error('    MISSING:', missing.join(', ')); process.exit(1);}
console.log('    all 8 ABI exports present');
"
