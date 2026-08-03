#!/usr/bin/env bash
# Build the interpreter benchmark as a native binary.
#
# TARGET defaults to cpp. See RUST.md for why rust is not the default.
set -e
cd "$(dirname "$0")/../../../../../.."
TARGET="${TARGET:-cpp}"
OUT_DIR=gallery/game_engine/v2/interp/bin/$TARGET
SRC=gallery/game_engine/v2/interp/bench/native/bench_main.rgr
mkdir -p "$OUT_DIR"

echo "== Ranger -> $TARGET"
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -l="$TARGET" \
  "$SRC" -d="$OUT_DIR" -o=engine_bench."${TARGET/cpp/cpp}" -nodecli

case "$TARGET" in
  cpp)
    echo "== g++ -O2"
    g++ -O2 -std=c++17 "$OUT_DIR/engine_bench.cpp" -o "$OUT_DIR/engine_bench"
    echo "built: $OUT_DIR/engine_bench"
    ;;
  rust)
    echo "== rustc -O"
    rustc -O "$OUT_DIR/engine_bench.rust" -o "$OUT_DIR/engine_bench"
    echo "built: $OUT_DIR/engine_bench"
    ;;
esac
