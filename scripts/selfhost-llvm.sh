#!/usr/bin/env bash
# The compiler, compiled for LLVM.
#
#   scripts/selfhost-llvm.sh            generate the IR and report the error count
#   scripts/selfhost-llvm.sh verify     ...and run `opt -passes=verify` over it
#   scripts/selfhost-llvm.sh build      ...and link ./tmp/selfhost-llvm/rangerc
#
# See TARGET_NOTES.md ("The compiler on LLVM") for what does and does not work
# yet. This is not a pass/fail gate: it is the number to watch while the
# backend closes the gap to the C++/Dart/Python/C#/Go/Kotlin self-host path.
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
