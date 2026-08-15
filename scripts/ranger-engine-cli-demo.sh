#!/usr/bin/env bash
# Build a Ranger program to bytecode and run it three ways: the native
# rangercli binary, the same CLI on Node, and (for comparison) the ordinary
# compiled JavaScript. Shows what the compiler-free runtime actually needs.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

OUT="gallery/ranger_engine/bin"
PROGRAM="${1:-gallery/ranger_engine/examples/cli_wc.rgr}"
ARGS=("${@:2}")
if [ ${#ARGS[@]} -eq 0 ]; then
  ARGS=("gallery/ranger_engine/examples/cli_wc.rgr")
fi

if [ ! -f "$OUT/rg_build.js" ] || [ ! -f "$OUT/rangercli" ]; then
  bash scripts/ranger-engine-build.sh build cli native
fi

mkdir -p tmp/rgb
BASE="$(basename "${PROGRAM%.*}")"
RGB="tmp/rgb/$BASE.rgb"

echo "── building bytecode ─────────────────────────────────────────"
RANGER_LIB="./compiler/;./lib/" node "$OUT/rg_build.js" "$PROGRAM" -o="$RGB" | tail -n +20

echo ""
echo "── native rangercli ──────────────────────────────────────────"
"./$OUT/rangercli" -steps "$RGB" "${ARGS[@]}"

echo ""
echo "── the same bytecode on Node ─────────────────────────────────"
node "$OUT/rg_cli.js" -steps "$RGB" "${ARGS[@]}"

echo ""
echo "── sizes ─────────────────────────────────────────────────────"
printf '  %-14s %8s bytes\n' "$BASE.rgb" "$(wc -c < "$RGB")"
printf '  %-14s %8s bytes\n' "rangercli" "$(wc -c < "$OUT/rangercli")"
printf '  %-14s %8s bytes\n' "rg_cli.js" "$(wc -c < "$OUT/rg_cli.js")"
printf '  %-14s %8s bytes\n' "rg_build.js" "$(wc -c < "$OUT/rg_build.js")"
