#!/usr/bin/env bash
# Build the Octane runner for cpp and/or rust.
#
#   bash build-native.sh           # both
#   TARGET=cpp bash build-native.sh
#   TARGET=rust bash build-native.sh
#   TARGET=llvm bash build-native.sh
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
    llvm) EXT="ll" ;;
  esac
  # The LLVM backend needs the target named: without it pointers default to
  # 32 bits and the module will not even parse on x86-64.
  TARGET_FLAG=""
  if [ "$T" = "llvm" ]; then
    TARGET_FLAG='-target=native-linux-gnu'
  fi
  echo "== Ranger -> $T (octane_runner)"
  RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -l="$T" \
    "$SRC" -d="$OUT_DIR" -o=octane_runner."$EXT" -nodecli -native-fast-alloc $TARGET_FLAG
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
    llvm)
      # The generated module defines @main itself; rename it so the C shim owns
      # the real entry point and can hand argc/argv to ranger_cli_init.
      echo "== clang -O2 octane_runner (llvm)"
      sed 's/@main(/@rgr_main(/g' "$OUT_DIR/octane_runner.ll" > "$OUT_DIR/octane_runner_main.ll"
      cat > "$OUT_DIR/octane_shim.c" <<'SHIM'
extern int rgr_main(int argc, char **argv);
int main(int argc, char **argv) { return rgr_main(argc, argv); }
SHIM
      clang -O2 -Wno-override-module         "$OUT_DIR/octane_runner_main.ll" "$OUT_DIR/octane_shim.c"         runtime/ranger_rt.c runtime/ranger_mem.c runtime/ranger_buffer.c         -o "$OUT_DIR/octane_runner" -lm
      echo "built: $OUT_DIR/octane_runner"
      ;;
    *)
      echo "unsupported TARGET=$T (use cpp, rust or llvm)" >&2
      exit 1
      ;;
  esac
done
