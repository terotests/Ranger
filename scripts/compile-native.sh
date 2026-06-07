#!/usr/bin/env bash
# Ranger -> LLVM IR -> native executable (via clang)
#
# Usage:
#   ./scripts/compile-native.sh [ranger-source.rgr] [output-binary]
#
# Example:
#   ./scripts/compile-native.sh tests/fixtures/llvm_add.rgr /tmp/add_demo

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="${1:-$ROOT/tests/fixtures/llvm_add.rgr}"
OUT_BIN="${2:-$ROOT/tmp/ranger-native-demo/add_demo}"
OUT_DIR_REL="tmp/ranger-native-demo"
OUT_DIR="$ROOT/$OUT_DIR_REL"
BASENAME="$(basename "$SOURCE" .rgr)"
LL_NAME="${BASENAME}.ll"
LL_FILE="$OUT_DIR/$LL_NAME"
MAIN_C="$OUT_DIR/main.c"

mkdir -p "$OUT_DIR"

RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr"
COMPILER="$ROOT/bin/output.js"

if ! command -v clang >/dev/null 2>&1; then
  echo "error: clang not found (install Xcode CLT or LLVM)" >&2
  exit 1
fi

if [[ ! -f "$COMPILER" ]]; then
  echo "error: compiler not built  run: npm run compile" >&2
  exit 1
fi

echo "==> 1/4 Ranger -> LLVM IR"
echo "    source: $SOURCE"
cd "$ROOT"
RANGER_LIB="$RANGER_LIB" node "$COMPILER" \
  -l=llvm "$SOURCE" \
  -nodecli \
  -d="$OUT_DIR_REL" \
  -o="$LL_NAME"

if [[ ! -f "$LL_FILE" ]]; then
  echo "error: expected IR at $LL_FILE" >&2
  exit 1
fi

echo ""
echo "    IR ($LL_FILE):"
sed 's/^/    /' "$LL_FILE"
echo ""

HAS_MAIN=0
if grep -q '@main(' "$LL_FILE" || grep -q 'define dso_local i32 @main(' "$LL_FILE"; then
  HAS_MAIN=1
fi

if [[ "$HAS_MAIN" -eq 1 ]]; then
  echo "==> 2/4 @main found in IR — no C wrapper needed"
  echo "==> 3/4 clang: LLVM IR -> native binary"
  clang "$LL_FILE" -o "$OUT_BIN"
else
  SYMBOL="$(grep -Eo '@[A-Za-z_][A-Za-z0-9_]*\(' "$LL_FILE" | head -1 | tr -d '(')"
  if [[ -z "$SYMBOL" ]]; then
    echo "error: could not find exported function in $LL_FILE" >&2
    exit 1
  fi
  SYMBOL="${SYMBOL#@}"
  echo "==> 2/4 Generate host main.c (calls ${SYMBOL}(40, 2))"
  cat > "$MAIN_C" <<EOF
/* Auto-generated host entry for Ranger LLVM demo */
extern int ${SYMBOL}(int a, int b);

int main(void) {
  return ${SYMBOL}(40, 2);
}
EOF
  echo "==> 3/4 clang: LLVM IR + main.c -> native binary"
  clang "$LL_FILE" "$MAIN_C" -o "$OUT_BIN"
fi

echo "==> 4/4 Run"
file "$OUT_BIN"
set +e
"$OUT_BIN"
EXIT=$?
set -e
echo ""
echo "exit code: $EXIT  (expected 42 for add demo: 40 + 2)"
echo "binary:    $OUT_BIN"
