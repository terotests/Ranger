#!/usr/bin/env bash
# ==============================================================================
# run_trace_bench.sh — unit tests + timing vs npm/CLI potrace
# ==============================================================================
set -u
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
OUT=".evg_trace_out"
mkdir -p "$OUT"

status=0

echo "### evg/bitmap_tracer (unit)"
if ! RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
     node bin/output.js -es6 gallery/evg/EvgBitmapTracerTest.rgr \
       -d="$OUT" -o=EvgBitmapTracerTest.js -nodecli >"$OUT/test_compile.log" 2>&1; then
  echo "  COMPILE FAIL EvgBitmapTracerTest"
  tail -40 "$OUT/test_compile.log"
  exit 1
fi
test_out="$(node "$OUT/EvgBitmapTracerTest.js" 2>&1)"
echo "$test_out" | grep -E "FAIL |PASS |passed=" || true
if ! echo "$test_out" | grep -q "ALL PASS"; then
  echo "$test_out"
  status=1
fi

echo
echo "### evg/bitmap_tracer (bench cases)"
if ! RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
     node bin/output.js -es6 gallery/evg/tools/evg_trace_bench.rgr \
       -d="$OUT" -o=evg_trace_bench.js -nodecli >"$OUT/bench_compile.log" 2>&1; then
  echo "  COMPILE FAIL evg_trace_bench"
  tail -40 "$OUT/bench_compile.log"
  exit 1
fi
if [ ! -f "$OUT/evg_trace_bench.js" ]; then
  echo "  COMPILE FAIL evg_trace_bench (no output file)"
  tail -40 "$OUT/bench_compile.log"
  exit 1
fi

t0="$(node -e 'process.stdout.write(String(process.hrtime.bigint()))')"
bench_out="$(node "$OUT/evg_trace_bench.js" 2>&1)"
t1="$(node -e 'process.stdout.write(String(process.hrtime.bigint()))')"
echo "$bench_out" | tee "$OUT/bench_ranger.log"
ms="$(node -e "const a=BigInt(process.argv[1]); const b=BigInt(process.argv[2]); console.log(((Number(b-a))/1e6).toFixed(2))" "$t0" "$t1")"
echo "BENCH_RANGER_WALL_MS $ms" | tee -a "$OUT/bench_ranger.log"
if ! echo "$bench_out" | grep -q "BENCH_DONE"; then
  status=1
fi

echo
echo "### comparison vs potrace (optional)"
node gallery/evg/tools/bench_vs_potrace.mjs "$OUT" || true

echo "=============================================================="
if [ "$status" -eq 0 ]; then
  echo "evg bitmap tracer ALL GREEN"
else
  echo "evg bitmap tracer FAILURES"
fi
exit "$status"
