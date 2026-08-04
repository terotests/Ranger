#!/usr/bin/env bash
# Build the Octane runner for cpp and/or rust.
#
#   bash build-native.sh           # both
#   TARGET=cpp bash build-native.sh
#   TARGET=rust bash build-native.sh
set -e
cd "$(dirname "$0")/../../../../../.."
TARGETS="${TARGET:-cpp rust}"
SRC=gallery/game_engine/v2/interp/bench/zoo_octane/octane_main.rgr

for T in $TARGETS; do
  OUT_DIR=gallery/game_engine/v2/interp/bin/$T
  mkdir -p "$OUT_DIR"
  EXT="$T"
  case "$T" in
    rust) EXT="rs" ;;
  esac
  echo "== Ranger -> $T (octane_runner)"
  RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -l="$T" \
    "$SRC" -d="$OUT_DIR" -o=octane_runner."$EXT" -nodecli -native-fast-alloc
  case "$T" in
    cpp)
      echo "== g++ -O3 octane_runner"
      g++ -O3 -march=native -std=c++17 "$OUT_DIR/octane_runner.cpp" -o "$OUT_DIR/octane_runner"
      echo "built: $OUT_DIR/octane_runner"
      ;;
    rust)
      echo "== rustc -C opt-level=3 octane_runner"
      rustc -C opt-level=3 -C target-cpu=native -C codegen-units=1 \
        "$OUT_DIR/octane_runner.rs" -o "$OUT_DIR/octane_runner"
      echo "built: $OUT_DIR/octane_runner"
      ;;
    *)
      echo "unsupported TARGET=$T (use cpp or rust)" >&2
      exit 1
      ;;
  esac
done
