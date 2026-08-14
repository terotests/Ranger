#!/usr/bin/env bash
# Build the `rangerjs` CLI natively.
#
#   bash gallery/game_engine/v2/interp/cli/build-rangerjs.sh          # cpp
#   TARGET=rust bash .../build-rangerjs.sh                            # rust
#   TARGET="cpp rust" bash .../build-rangerjs.sh                      # both
#
# The system allocator, NOT -native-fast-alloc. That flag parks freed blocks
# in per-size freelists and never returns them to the OS, which is the right
# trade for a benchmark and the wrong one for a tool: measured at 577 MB with
# it against 458 MB without, for 2.8% wall clock. Pass FAST_ALLOC=-native-fast-alloc
# to get it back.
#
# Worth noting the number moved: the same comparison earlier in this work was
# 749 MB vs 734 MB. The freelist only became expensive once the allocation mix
# changed underneath it, which is a good reason to re-measure a settled
# decision after the thing it was measured against has changed.
#
# Output: gallery/game_engine/v2/interp/bin/<target>/rangerjs
set -e
cd "$(dirname "$0")/../../../../.."
ROOT="$(pwd)"
TARGETS="${TARGET:-cpp}"
SRC=gallery/game_engine/v2/interp/cli/rangerjs_main.rgr

sed_i() {
  if sed --version >/dev/null 2>&1; then sed -i "$@"; else sed -i '' "$@"; fi
}

# shellcheck source=scripts/cpp-toolchain.sh
. "$ROOT/scripts/cpp-toolchain.sh"
if [ -z "${CXX:-}" ] || [ -z "${CXX_SUPPORTS_SINGLE_THREAD:-}" ]; then
  cpp_toolchain_resolve || true
fi
CXX="${CXX:-g++}"

for T in $TARGETS; do
  OUT_DIR=gallery/game_engine/v2/interp/bin/$T
  mkdir -p "$OUT_DIR"
  EXT="$T"
  [ "$T" = "rust" ] && EXT="rs"

  CPP_ST_FLAGS=(-cpp-single-thread)
  if [ "$T" = "cpp" ] && [ "${CXX_SUPPORTS_SINGLE_THREAD:-0}" != "1" ]; then
    echo "note: $CXX cannot build -cpp-single-thread; using atomic refcounts" >&2
    CPP_ST_FLAGS=()
  fi

  echo "== Ranger -> $T (rangerjs)"
  # The compiler exits 0 even when compilation fails, so the log has to be
  # checked or the previous run's binary is rebuilt and reported as fresh.
  RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node --stack-size=8000 bin/output.js -l="$T" \
    "$SRC" -d="$OUT_DIR" -o=rangerjs."$EXT" -nodecli ${FAST_ALLOC:-} \
    "${CPP_ST_FLAGS[@]}" 2>&1 | tee /tmp/rgr_cli_$$.log
  if grep -q "Compilation FAILED" /tmp/rgr_cli_$$.log; then
    rm -f /tmp/rgr_cli_$$.log
    echo "Ranger -> $T FAILED; refusing to build a stale $OUT_DIR/rangerjs.$EXT" >&2
    exit 1
  fi
  rm -f /tmp/rgr_cli_$$.log

  case "$T" in
    cpp)
      python3 gallery/game_engine/v2/interp/bench/native/fix_cpp_evalvalue_order.py \
        "$OUT_DIR/rangerjs.cpp"
      echo "== $CXX -O3 rangerjs"
      "$CXX" -O3 -march=native -std=c++17 "$OUT_DIR/rangerjs.cpp" -o "$OUT_DIR/rangerjs"
      ;;
    rust)
      sed_i 's/\.clone()\.clone()/.clone()/g' "$OUT_DIR/rangerjs.rs"
      echo "== rustc -C opt-level=3 rangerjs"
      rustc -C opt-level=3 -C target-cpu=native -C codegen-units=1 \
        "$OUT_DIR/rangerjs.rs" -o "$OUT_DIR/rangerjs"
      ;;
    *)
      echo "unsupported TARGET=$T (use cpp or rust)" >&2
      exit 1
      ;;
  esac
  echo "built: $OUT_DIR/rangerjs"
done
