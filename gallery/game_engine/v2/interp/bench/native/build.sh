#!/usr/bin/env bash
# Build the interpreter benchmark as a native binary.
#
# TARGET defaults to cpp. See RUST.md for why rust is not the default.
#
#   TARGET=cpp     g++ -O3            -> engine_bench
#   TARGET=rust    rustc -O           -> engine_bench
#   TARGET=go      go build           -> engine_bench
#   TARGET=kotlin  kotlinc            -> engine_bench.jar   (run with java -jar)
#   TARGET=python  none               -> engine_bench.py    (run with python3)
#   TARGET=csharp  mcs                -> engine_bench.exe   (run with mono)
#   TARGET=swift6  swiftc -O          -> engine_bench       (needs a Swift toolchain)
#   TARGET=dart    none               -> engine_bench.dart  (run with dart run)
#   TARGET=llvm    clang -O2          -> engine_bench       (LLVM IR + the C runtime)
#
# Every target after the Ranger step is skipped when its toolchain is absent;
# the generated source is still written, which is what the target test checks.
set -e
cd "$(dirname "$0")/../../../../../.."
ROOT="$(pwd)"
TARGET="${TARGET:-cpp}"
OUT_DIR=gallery/game_engine/v2/interp/bin/$TARGET
SRC=gallery/game_engine/v2/interp/bench/native/bench_main.rgr
mkdir -p "$OUT_DIR"

# GNU sed (Linux): sed -i '…' file
# BSD sed (macOS): sed -i '' '…' file
# Detect via --version (GNU only) so the rust .clone().clone() collapse works
# on both. Do not use `sed -i ''` alone — GNU treats '' as the script name.
sed_i() {
  if sed --version >/dev/null 2>&1; then
    sed -i "$@"
  else
    sed -i '' "$@"
  fi
}

# Resolve a real libstdc++ g++ when possible (Apple's g++ is clang/libc++).
# shellcheck source=scripts/cpp-toolchain.sh
. "$ROOT/scripts/cpp-toolchain.sh"
if [ -z "${CXX:-}" ] || [ -z "${CXX_SUPPORTS_SINGLE_THREAD:-}" ]; then
  cpp_toolchain_resolve || true
fi
CXX="${CXX:-g++}"
CPP_ST_FLAGS=()
if [ "${CXX_SUPPORTS_SINGLE_THREAD:-0}" = "1" ]; then
  CPP_ST_FLAGS=(-cpp-single-thread)
elif [ "$TARGET" = "cpp" ]; then
  echo "note: $CXX cannot build -cpp-single-thread (need GCC/libstdc++);" >&2
  echo "      compiling with atomic std::shared_ptr instead." >&2
  if [ "$(uname -s)" = "Darwin" ]; then
    echo "      tip: brew install gcc   # then re-run; g++-14 will be picked up" >&2
  fi
fi

echo "== Ranger -> $TARGET"
EXT="$TARGET"
case "$TARGET" in
  rust) EXT="rs" ;;
  kotlin) EXT="kt" ;;
  python) EXT="py" ;;
  csharp) EXT="cs" ;;
  swift6|swift3) EXT="swift" ;;
  dart) EXT="dart" ;;
  llvm) EXT="ll" ;;
esac
# LLVM needs a concrete triple: the reference counting and the object runtime
# are gated on the target having libc, and without one the module comes out
# freestanding and will not link against ranger_mem.c. `-native-fast-alloc` is
# a Rust/C++ flag and does nothing here, but it is harmless to pass.
EXTRA_ARGS=()
if [ "$TARGET" = "llvm" ]; then
  EXTRA_ARGS=(-target=native-linux-gnu)
fi
# -cpp-single-thread: the interpreter is single-threaded, so handles ride a
# non-atomically counted shared_ptr (rg_ptr) — without it every EvHandle copy
# is a lock-prefixed atomic pair, a global tax with no thread to protect.
# The flag is cpp-only and ignored elsewhere. Omitted when the selected CXX
# is Apple clang / libc++ (see scripts/cpp-toolchain.sh).
# `node bin/output.js` EXITS 0 EVEN WHEN COMPILATION FAILS, so `set -e` does
# not catch it -- and the native step below would then happily rebuild the
# previous run's stale generated source and report success. That is how a
# benchmark starts comparing a change against itself. Tee the output and fail
# on the compiler's own verdict.
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -l="$TARGET" \
  "$SRC" -d="$OUT_DIR" -o=engine_bench."$EXT" -nodecli -native-fast-alloc \
  "${CPP_ST_FLAGS[@]}" "${EXTRA_ARGS[@]}" 2>&1 | tee /tmp/rgr_build_$$.log
if grep -q "Compilation FAILED" /tmp/rgr_build_$$.log; then
  rm -f /tmp/rgr_build_$$.log
  echo "Ranger -> $TARGET FAILED; refusing to build a stale $OUT_DIR/engine_bench.$EXT" >&2
  exit 1
fi
rm -f /tmp/rgr_build_$$.log

case "$TARGET" in
  cpp)
    # Shape case classes are emitted after ordinary classes; move the six
    # by-value EvalValue alternatives ahead of EvMapEntry (see script).
    python3 gallery/game_engine/v2/interp/bench/native/fix_cpp_evalvalue_order.py \
      "$OUT_DIR/engine_bench.cpp"
    echo "== $CXX -O3"
    "$CXX" -O3 -march=native -std=c++17 "$OUT_DIR/engine_bench.cpp" -o "$OUT_DIR/engine_bench"
    echo "built: $OUT_DIR/engine_bench"
    ;;
  rust)
    # The writer sometimes stacks a def/return clone on an expression that
    # already ends in .clone() (an itemAt read, a field read). Clone::clone
    # returns Self, so collapsing the pair is always semantics-preserving —
    # and each pair was a full extra copy of the value (a union clone copies
    # its string payload). Same spirit as fix_cpp_evalvalue_order.py above.
    sed_i 's/\.clone()\.clone()/.clone()/g' "$OUT_DIR/engine_bench.rs"
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
  python)
    echo "generated: $OUT_DIR/engine_bench.py   (python3 $OUT_DIR/engine_bench.py loop 1)"
    ;;
  csharp)
    if command -v mcs >/dev/null; then
      echo "== mcs"
      mcs -out:"$OUT_DIR/engine_bench.exe" "$OUT_DIR/engine_bench.cs"
      echo "built: $OUT_DIR/engine_bench.exe   (mono $OUT_DIR/engine_bench.exe loop 1)"
    else
      echo "no mcs; generated $OUT_DIR/engine_bench.cs only"
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
  dart)
    echo "generated: $OUT_DIR/engine_bench.dart   (dart run $OUT_DIR/engine_bench.dart loop 1)"
    ;;
  llvm)
    # The LLVM backend emits @main for the Ranger entry point, so it is renamed
    # and called from a C host that hands the process arguments to the runtime
    # first -- the same wrapper scripts/compile-ts-parser-llvm.sh uses.
    #
    # ranger_rt.c already contains the cli and terminal helpers; linking
    # ranger_cli.c or ranger_term.c alongside it is a duplicate-symbol error.
    # ranger_buffer.c is separate and IS needed: the engine reaches the buffer
    # intrinsics through the JPEG paths its standard library pulls in.
    echo "== clang -O2"
    sed 's/@main(/@rgr_main(/g; s/define i32 @main(/define i32 @rgr_main(/g' \
      "$OUT_DIR/engine_bench.ll" > "$OUT_DIR/engine_bench_fixed.ll"
    cat > "$OUT_DIR/host_main.c" <<'HOSTEOF'
#include <stdlib.h>
void ranger_cli_init(int argc, char **argv);
int rgr_main(void);
int main(int argc, char **argv) { ranger_cli_init(argc, argv); return rgr_main(); }
HOSTEOF
    clang -O2 "$OUT_DIR/engine_bench_fixed.ll" "$OUT_DIR/host_main.c" \
      runtime/ranger_rt.c runtime/ranger_mem.c runtime/ranger_buffer.c \
      -o "$OUT_DIR/engine_bench" -Wno-override-module -lm
    echo "built: $OUT_DIR/engine_bench   ($OUT_DIR/engine_bench loop 1)"
    ;;
esac
