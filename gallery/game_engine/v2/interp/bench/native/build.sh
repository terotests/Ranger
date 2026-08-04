#!/usr/bin/env bash
# Build the interpreter benchmark as a native binary.
#
# TARGET defaults to cpp. See RUST.md for why rust is not the default.
#
#   TARGET=cpp     g++ -O3            -> engine_bench
#   TARGET=rust    rustc -O           -> engine_bench
#   TARGET=go      go build           -> engine_bench
#   TARGET=kotlin  kotlinc            -> engine_bench.jar   (run with java -jar)
#   TARGET=swift6  swiftc -O          -> engine_bench       (needs a Swift toolchain)
#
# Every target after the Ranger step is skipped when its toolchain is absent;
# the generated source is still written, which is what the target test checks.
set -e
cd "$(dirname "$0")/../../../../../.."
TARGET="${TARGET:-cpp}"
OUT_DIR=gallery/game_engine/v2/interp/bin/$TARGET
SRC=gallery/game_engine/v2/interp/bench/native/bench_main.rgr
mkdir -p "$OUT_DIR"

echo "== Ranger -> $TARGET"
EXT="$TARGET"
case "$TARGET" in
  rust) EXT="rs" ;;
  kotlin) EXT="kt" ;;
  swift6|swift3) EXT="swift" ;;
esac
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -l="$TARGET" \
  "$SRC" -d="$OUT_DIR" -o=engine_bench."$EXT" -nodecli -native-fast-alloc

case "$TARGET" in
  cpp)
    echo "== g++ -O3"
    g++ -O3 -march=native -std=c++17 "$OUT_DIR/engine_bench.cpp" -o "$OUT_DIR/engine_bench"
    echo "built: $OUT_DIR/engine_bench"
    ;;
  rust)
    echo "== rustc -C opt-level=3"
    rustc -C opt-level=3 -C target-cpu=native -C codegen-units=1 \
      "$OUT_DIR/engine_bench.rs" -o "$OUT_DIR/engine_bench"
    echo "built: $OUT_DIR/engine_bench"
    ;;
  go)
    if command -v go >/dev/null; then
      echo "== go build"
      ( cd "$OUT_DIR" && go build -o engine_bench engine_bench.go )
      echo "built: $OUT_DIR/engine_bench"
    else
      echo "no go toolchain; generated $OUT_DIR/engine_bench.go only"
    fi
    ;;
  kotlin)
    if command -v kotlinc >/dev/null; then
      # -include-runtime so the jar is self-contained: java -jar engine_bench.jar
      echo "== kotlinc (this takes several minutes on a file this size)"
      kotlinc "$OUT_DIR/engine_bench.kt" -include-runtime -d "$OUT_DIR/engine_bench.jar"
      echo "built: $OUT_DIR/engine_bench.jar   (java -jar $OUT_DIR/engine_bench.jar loop 1)"
    else
      echo "no kotlinc; generated $OUT_DIR/engine_bench.kt only"
    fi
    ;;
  swift6|swift3)
    if command -v swiftc >/dev/null; then
      echo "== swiftc -O"
      swiftc -O "$OUT_DIR/engine_bench.swift" -o "$OUT_DIR/engine_bench"
      echo "built: $OUT_DIR/engine_bench"
    else
      echo "no swiftc; generated $OUT_DIR/engine_bench.swift only"
    fi
    ;;
esac
