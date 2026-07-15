#!/usr/bin/env bash
# Compile the Ranger-language autopeli (autopeli.rgr + ranger_game.rgr) to
# games/ranger_autopeli/logic.wasm — a linear/physics RGW1 guest that the
# engine's WasmPhysicsRunner drives exactly like the Rust games/autopeli_wasm.
#
#   Ranger .rgr --(-l=llvm -wat -freestanding)--> WAT --(rename exports)--> wasm
#
# The backend exports statics as `Auto_init`, `Auto_update`, ... ; the engine
# looks the guest exports up by their bare ABI names, so we rename them in the
# WAT text before assembling (a pure build step).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
GAME_DIR="$ROOT/gallery/game_engine/games/ranger_autopeli"
SRC="$GAME_DIR/src/autopeli.rgr"
OUT_DIR="$ROOT/tmp/ranger-autopeli"
WAT="$OUT_DIR/autopeli.wat"
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
  "$SRC" -nodecli -d="tmp/ranger-autopeli" -o="autopeli.wat"

GEN="$OUT_DIR/autopeli.ll"
[[ -f "$GEN" ]] || GEN="$OUT_DIR/autopeli.wat.ll"
cp "$GEN" "$WAT"

echo "==> 2/3 rename exports to the engine ABI"
sed -i -E 's/\(export "Auto_(abi_base|rg_abi_version|declare_resources|init|update|rg_ui_ptr|rg_ui_size|rg_ui_revision)"/(export "\1"/' "$WAT"

echo "==> 3/3 wat2wasm -> $WASM"
"$WAT2WASM" "$WAT" -o "$WASM"

echo "    ok: $WASM ($(wc -c < "$WASM") bytes)"
node -e "
const fs=require('fs');
const m=new WebAssembly.Module(fs.readFileSync('$WASM'));
const names=WebAssembly.Module.exports(m).map(e=>e.name);
const need=['abi_base','rg_abi_version','init','update'];
const missing=need.filter(n=>!names.includes(n));
if(missing.length){console.error('    MISSING ABI exports:', missing.join(', ')); process.exit(1);}
console.log('    ABI exports present: abi_base, rg_abi_version, declare_resources, init, update');
"
