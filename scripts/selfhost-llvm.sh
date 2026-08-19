#!/usr/bin/env bash
# The compiler, compiled for LLVM.
#
#   scripts/selfhost-llvm.sh            generate the IR and report the error count
#   scripts/selfhost-llvm.sh verify     ...and run `opt -passes=verify` over it
#   scripts/selfhost-llvm.sh build      ...and link ./tmp/selfhost-llvm/rangerc
#   scripts/selfhost-llvm.sh round      ...and compile the compiler WITH that
#                                       binary, checking the result against the
#                                       Node build and against itself
#
# See TARGET_NOTES.md ("The compiler on LLVM") for what this covers. `round` is
# the one that means self-hosting: the native binary reproduces the Node
# build's output byte for byte, and that output reproduces itself.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
MODE="${1:-generate}"
OUT="tmp/selfhost-llvm"
LL="$OUT/ranger_compiler.ll"
LOG="tmp/llvm-selfhost.log"

if [[ "$(uname -s)" == "Darwin" ]]; then
  if [[ "$(uname -m)" == "arm64" ]]; then TARGET="arm64-apple-macos"; else TARGET="x86_64-apple-macos"; fi
else
  TARGET="native-linux-gnu"
fi

mkdir -p "$OUT"
echo "==> generating LLVM IR for the compiler"
RANGER_LIB="./compiler/Lang.rgr;./lib/stdops.rgr" \
  node --max-old-space-size=8192 bin/output.js \
  -l=llvm ./compiler/ng_Compiler.rgr -nodecli \
  -d="$OUT" -o=ranger_compiler.ll -target="$TARGET" > "$LOG" 2>&1
ERRORS="$(grep -c '\[FAIL\]' "$LOG" || true)"
echo "    compiler errors: $ERRORS   (full log: $LOG)"
if [[ ! -f "$LL" ]]; then
  echo "    no IR produced"
  exit 1
fi
echo "    IR: $(wc -l < "$LL") lines, $(du -h "$LL" | cut -f1)"
[[ "$MODE" == "generate" ]] && exit 0

echo "==> opt -passes=verify"
if opt -passes=verify -disable-output "$LL"; then
  echo "    IR is valid"
else
  exit 1
fi
[[ "$MODE" == "verify" ]] && exit 0

echo "==> clang"
clang -O0 "$LL" \
  runtime/ranger_rt.c runtime/ranger_mem.c runtime/ranger_json.c runtime/ranger_buffer.c \
  -o "$OUT/rangerc" -lm -Wno-override-module || exit 1
cp ./compiler/Lang.rgr "$OUT/Lang.rgr"
cp ./lib/stdops.rgr "$OUT/stdops.rgr"
mkdir -p "$OUT/lib" && cp ./lib/*.rgr "$OUT/lib/"
echo "==> ready: $OUT/rangerc"
[[ "$MODE" == "build" ]] && exit 0

# The self-host round: the native binary compiles the compiler, and the result
# has to match what the Node build makes of the same sources. Then that result
# compiles the compiler again -- a compiler that reproduces itself is at a
# fixed point, which is the property "self-hosting" actually names.
ROUND="tmp/selfhost-llvm-round"
rm -rf "$ROUND" && mkdir -p "$ROUND"
echo "==> gen2: the native rangerc compiles the compiler"
"$OUT/rangerc" -l=es6 ./compiler/ng_Compiler.rgr -nodecli -d="$ROUND" -o=gen2.js > "$ROUND/gen2.log" 2>&1
if [[ ! -f "$ROUND/gen2.js" ]]; then
  echo "    FAILED (see $ROUND/gen2.log)"
  exit 1
fi
echo "    $(wc -c < "$ROUND/gen2.js") bytes"

echo "==> reference: the Node build compiles the same sources"
RANGER_LIB="./compiler/Lang.rgr;./lib/stdops.rgr" \
  node --max-old-space-size=8192 bin/output.js \
  -l=es6 ./compiler/ng_Compiler.rgr -nodecli -d="$ROUND" -o=ref.js > "$ROUND/ref.log" 2>&1
if cmp -s "$ROUND/gen2.js" "$ROUND/ref.js"; then
  echo "    identical to the Node build"
else
  echo "    DIFFERS from the Node build"
  exit 1
fi

echo "==> gen3: gen2 compiles the compiler"
RANGER_LIB="./compiler/Lang.rgr;./lib/stdops.rgr" \
  node --max-old-space-size=8192 "$ROUND/gen2.js" \
  -l=es6 ./compiler/ng_Compiler.rgr -nodecli -d="$ROUND" -o=gen3.js > "$ROUND/gen3.log" 2>&1
if cmp -s "$ROUND/gen2.js" "$ROUND/gen3.js"; then
  echo "    gen2 == gen3 -- fixed point"
else
  echo "    gen2 != gen3 -- NOT a fixed point"
  exit 1
fi
