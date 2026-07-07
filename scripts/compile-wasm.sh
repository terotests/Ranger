#!/usr/bin/env bash
# Ranger -> WAT -> .wasm (freestanding exported functions)
#
# Usage:
#   ./scripts/compile-wasm.sh [source.rgr] [output.wasm]
#
# Requires: npm package wabt (devDependency) or wat2wasm on PATH

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="${1:-$ROOT/tests/fixtures/llvm_wasm_demo.rgr}"
OUT_WASM="${2:-$ROOT/tmp/wasm-demo/demo.wasm}"
OUT_DIR_REL="tmp/wasm-demo"
OUT_DIR="$ROOT/$OUT_DIR_REL"
BASENAME="$(basename "$SOURCE" .rgr)"
WAT_FILE="$OUT_DIR/${BASENAME}.wat"

mkdir -p "$OUT_DIR"

RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr"
COMPILER="$ROOT/bin/output.js"
WAT2WASM="$ROOT/node_modules/.bin/wat2wasm"

if [[ ! -f "$COMPILER" ]]; then
  echo "error: run npm run compile first" >&2
  exit 1
fi

if [[ ! -x "$WAT2WASM" ]]; then
  if command -v wat2wasm >/dev/null 2>&1; then
    WAT2WASM="$(command -v wat2wasm)"
  else
    echo "error: wat2wasm not found � run: npm install" >&2
    exit 1
  fi
fi

echo "==> 1/3 Ranger -> WAT (-wat -freestanding)"
cd "$ROOT"
RANGER_LIB="$RANGER_LIB" node "$COMPILER" \
  -l=llvm -wat -freestanding \
  "$SOURCE" \
  -nodecli \
  -d="$OUT_DIR_REL" \
  -o="${BASENAME}.wat"

GENERATED="$OUT_DIR/${BASENAME}.ll"
if [[ ! -f "$GENERATED" ]]; then
  GENERATED="$OUT_DIR/${BASENAME}.wat.ll"
fi
if [[ -f "$GENERATED" ]]; then
  cp "$GENERATED" "$WAT_FILE"
fi

if [[ ! -f "$WAT_FILE" ]]; then
  echo "error: expected WAT at $WAT_FILE" >&2
  exit 1
fi

echo "    WAT: $WAT_FILE ($(wc -l < "$WAT_FILE") lines)"
echo ""
echo "==> 2/3 wat2wasm"
"$WAT2WASM" "$WAT_FILE" -o "$OUT_WASM"

echo "==> 3/3 Validate exports"
case "$BASENAME" in
  llvm_collections)
    node -e "
const fs = require('fs');
const buf = fs.readFileSync('$OUT_WASM');
const mod = new WebAssembly.Module(buf);
const exp = WebAssembly.Module.exports(mod).map(e => e.name);
console.log('exports:', exp.join(', '));
const inst = new WebAssembly.Instance(mod);
const run = inst.exports.CollectionsDemo_run();
console.log('CollectionsDemo_run() =', run, '(expected 410)');
if (run !== 410) process.exit(1);
"
    ;;
  llvm_counter)
    node -e "
const fs = require('fs');
const buf = fs.readFileSync('$OUT_WASM');
const mod = new WebAssembly.Module(buf);
const exp = WebAssembly.Module.exports(mod).map(e => e.name);
console.log('exports:', exp.join(', '));
const inst = new WebAssembly.Instance(mod);
const run = inst.exports.CounterDemo_run();
console.log('CounterDemo_run() =', run, '(expected 12)');
if (run !== 12) process.exit(1);
"
    ;;
  llvm_array_map_lang)
    node -e "
const fs = require('fs');
const buf = fs.readFileSync('$OUT_WASM');
const mod = new WebAssembly.Module(buf);
const exp = WebAssembly.Module.exports(mod).map(e => e.name);
console.log('exports:', exp.join(', '));
const inst = new WebAssembly.Instance(mod);
const run = inst.exports.LangCollectionsDemo_run();
console.log('LangCollectionsDemo_run() =', run, '(expected 410)');
if (run !== 410) process.exit(1);
"
    ;;
  llvm_list_smoke)
    node -e "
const fs = require('fs');
const buf = fs.readFileSync('$OUT_WASM');
const mod = new WebAssembly.Module(buf);
const exp = WebAssembly.Module.exports(mod).map(e => e.name);
console.log('exports:', exp.join(', '));
const inst = new WebAssembly.Instance(mod);
const run = inst.exports.ListSmoke_run();
console.log('ListSmoke_run() =', run, '(expected 10)');
if (run !== 10) process.exit(1);
"
    ;;
  llvm_mathlib)
    node -e "
const fs = require('fs');
const buf = fs.readFileSync('$OUT_WASM');
const mod = new WebAssembly.Module(buf);
const exp = WebAssembly.Module.exports(mod).map(e => e.name);
console.log('exports:', exp.join(', '));
const inst = new WebAssembly.Instance(mod);
const fib = inst.exports.Fib_fib(10);
const fact = inst.exports.Fact_factorial(5);
console.log('Fib_fib(10) =', fib);
console.log('Fact_factorial(5) =', fact);
if (fib !== 55 || fact !== 120) process.exit(1);
"
    ;;
  *)
    node -e "
const fs = require('fs');
const buf = fs.readFileSync('$OUT_WASM');
const mod = new WebAssembly.Module(buf);
const exp = WebAssembly.Module.exports(mod).map(e => e.name);
console.log('exports:', exp.join(', '));
const inst = new WebAssembly.Instance(mod);
const add = inst.exports.MathLib_add(40, 2);
const sq = inst.exports.MathLib_sq(7);
const hyp = inst.exports.MathLib_hypot(3, 4);
const fib = inst.exports.Fib_fib(10);
const fact = inst.exports.Fact_factorial(5);
console.log('MathLib_add(40,2) =', add);
console.log('MathLib_sq(7) =', sq);
console.log('MathLib_hypot(3,4) =', hyp);
console.log('Fib_fib(10) =', fib);
console.log('Fact_factorial(5) =', fact);
if (fib !== 55 || fact !== 120) process.exit(1);
"
    ;;
esac

HTML_OUT="$OUT_DIR/index.html"
case "$BASENAME" in
  llvm_collections)
    TEMPLATE="$ROOT/scripts/wasm-demo/collections.template.html"
    ;;
  *)
    TEMPLATE="$ROOT/scripts/wasm-demo/index.template.html"
    ;;
esac
if [[ -f "$TEMPLATE" ]]; then
  node "$ROOT/scripts/embed-wasm-demo-html.js" "$TEMPLATE" "$OUT_WASM" "$HTML_OUT"
  echo ""
  echo "==> 4/4 Browser demo page"
  echo "    HTML: $HTML_OUT (embedded wasm, works via file://)"
fi

echo ""
echo "wasm binary: $OUT_WASM"
echo "browser demo: $HTML_OUT"
echo "http server:  npm run demo:wasm:serve"
