#!/usr/bin/env bash
# Ranger TypeScript parser -> LLVM IR -> native executable (experimental)
#
# Usage: ./scripts/compile-ts-parser-llvm.sh [extra args passed to binary]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/gallery/ts_parser/ts_parser_main.rgr"
OUT_DIR="$ROOT/tmp/ts-parser-llvm"
LL_FILE="$OUT_DIR/ts_parser_main.ll"
LL_FIXED="$OUT_DIR/ts_parser_main_fixed.ll"
HOST_C="$OUT_DIR/host_main.c"
BIN_FILE="$OUT_DIR/ts_parser_main"
RT_C="$ROOT/runtime/ranger_rt.c"

mkdir -p "$OUT_DIR"

if [[ "$(uname -s)" == "Darwin" ]]; then
  if [[ "$(uname -m)" == "arm64" ]]; then
    TARGET="arm64-apple-macos"
  else
    TARGET="x86_64-apple-macos"
  fi
else
  TARGET="native-linux-gnu"
fi

if [[ ! -f "$ROOT/bin/output.js" ]]; then
  echo "error: run npm run compile first" >&2
  exit 1
fi

echo "==> 1/4 Ranger compiler + LLVM IR"
cd "$ROOT"
if [[ "$ROOT/compiler/ng_LowIRBuilder.rgr" -nt "$ROOT/bin/output.js" ]] || [[ ! -f "$ROOT/bin/output.js" ]]; then
  npm run compile --silent
fi
RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=llvm "$SOURCE" \
  -nodecli \
  -d="tmp/ts-parser-llvm" \
  -o="ts_parser_main.ll" \
  -target="$TARGET"

echo "==> 2/4 Rename @main -> @rgr_main for C host wrapper"
sed 's/@main(/@rgr_main(/g; s/define i32 @main(/define i32 @rgr_main(/g' "$LL_FILE" > "$LL_FIXED"

cat > "$HOST_C" <<'EOF'
#include <stdlib.h>

void ranger_cli_init(int argc, char **argv);
int rgr_main(void);

int main(int argc, char **argv) {
  ranger_cli_init(argc, argv);
  return rgr_main();
}
EOF

echo "==> 3/4 clang"
if ! clang "$LL_FIXED" "$HOST_C" "$RT_C" -o "$BIN_FILE" -Wno-override-module -Wl,-stack_size,0x1000000; then
  echo ""
  echo "note: native link still fails  LLVM lowering for ts_parser is incomplete (itemAt, [Token] indexing, ...)." >&2
  exit 1
fi

echo "==> 4/4 Ready: $BIN_FILE"
exec "$BIN_FILE" "$@"
