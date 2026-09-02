#!/usr/bin/env bash
# EVG's watch frame as ahead-of-time compiled native code — the watchOS proxy.
#
#   bash gallery/watch_evg/bench/scripts/run-native.sh
#
# Ranger's Swift target is what an Apple Watch port would use and there is no
# Swift toolchain here, so the C++ target stands in for it: AOT, native, and
# reference-counted through `std::shared_ptr`, which is the same class of cost
# as Swift's ARC and the one thing the JVM number cannot show.
#
# Needs g++ (or clang++) with C++17. No Ranger rebuild is skipped: the .cpp is
# a compiler artefact and is regenerated every time.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"

BENCH=gallery/watch_evg/bench
OUT=tmp/watch-native
CXX="${CXX:-g++}"

if [ ! -f bin/output.js ]; then
  echo "bin/output.js is missing — build the compiler first (npm run compile)" >&2
  exit 1
fi

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p "$OUT"

echo "  Ranger → C++…"
# -cpp-single-thread makes the refcount non-atomic and -native-fast-alloc puts
# a size-class freelist under `operator new`. Both are what CPP_ENGINE_ANALYSIS.md
# says a C++ build should be measured with; without them this measures the
# default allocator and a lock prefix, not EVG.
node --max-old-space-size=8192 bin/output.js -l=cpp -cpp-single-thread -native-fast-alloc \
  "$BENCH/WatchBench.rgr" -nodecli -d="./$OUT" -o=watch_bench.cpp > /dev/null

echo "  $CXX -O2…"
"$CXX" -std=c++17 -O2 -w -I"$OUT" \
  "$BENCH/native/watch_bench_main.cpp" -o "$OUT/watch_bench"

if command -v taskset >/dev/null 2>&1; then
  taskset -c 0 "$OUT/watch_bench" "$ROOT"
else
  "$OUT/watch_bench" "$ROOT"
fi
